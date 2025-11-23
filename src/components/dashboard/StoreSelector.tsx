import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Store, Loader2, X, Locate } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface Retailer {
  retailer_key: string;
  name: string;
  retailer_logo_url?: string;
  banner_name?: string;
  location?: {
    address?: string;
    address_extended?: string;
    city?: string;
    state?: string;
    zip_code?: string;
  };
  store_number?: string;
  distance?: number | null;
}

interface StoreSelectorProps {
  open: boolean;
  onClose: () => void;
  userId: string;
  onStoreSelected?: (retailer: Retailer) => void;
}

const StoreSelector = ({ open, onClose, userId, onStoreSelected }: StoreSelectorProps) => {
  const [zipCode, setZipCode] = useState("");
  const [retailers, setRetailers] = useState<Retailer[]>([]);
  const [loading, setLoading] = useState(false);
  const [selecting, setSelecting] = useState(false);
  const [detectingLocation, setDetectingLocation] = useState(false);
  const [selectedChains, setSelectedChains] = useState<string[]>([]);
  const [availableChains, setAvailableChains] = useState<{name: string, count: number}[]>([]);
  const [retailerHours, setRetailerHours] = useState<Record<string, any>>({});
  const [loadingHours, setLoadingHours] = useState<Record<string, boolean>>({});
  const [expandedHours, setExpandedHours] = useState<Record<string, boolean>>({});
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  const { toast } = useToast();

  // Calculate distance between two coordinates using Haversine formula
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 3959; // Earth's radius in miles
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Geocode address to coordinates
  const geocodeAddress = async (address: string, city: string, state: string, zip: string): Promise<{lat: number, lng: number} | null> => {
    try {
      const query = `${address}, ${city}, ${state} ${zip}`;
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`,
        {
          headers: {
            'User-Agent': 'Kaeva-App/1.0'
          }
        }
      );
      
      if (!response.ok) return null;
      
      const data = await response.json();
      if (data.length > 0) {
        return {
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon)
        };
      }
      return null;
    } catch (error) {
      console.error('Geocoding error:', error);
      return null;
    }
  };

  // Extract unique chains when retailers load
  useEffect(() => {
    if (retailers.length > 0) {
      const chainMap = new Map<string, number>();
      retailers.forEach(r => {
        const chain = r.banner_name || r.name;
        chainMap.set(chain, (chainMap.get(chain) || 0) + 1);
      });
      
      const chains = Array.from(chainMap.entries())
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => a.name.localeCompare(b.name));
      
      setAvailableChains(chains);
    }
  }, [retailers]);

  const detectLocation = async () => {
    if (!navigator.geolocation) {
      toast({
        title: "Location Not Supported",
        description: "Your browser doesn't support location detection",
        variant: "destructive"
      });
      return;
    }

    setDetectingLocation(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          
          // Store user location for distance calculations
          setUserLocation({ lat: latitude, lng: longitude });
          
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`,
            {
              headers: {
                'User-Agent': 'Kaeva-App/1.0'
              }
            }
          );

          if (!response.ok) throw new Error('Geocoding failed');

          const data = await response.json();
          const postalCode = data.address?.postcode;

          if (postalCode) {
            const zipMatch = postalCode.match(/\d{5}/);
            if (zipMatch) {
              setZipCode(zipMatch[0]);
              toast({
                title: "Location Detected",
                description: `Using zip code: ${zipMatch[0]}`
              });
              await fetchRetailers(zipMatch[0]);
            } else {
              toast({
                title: "Location Detected",
                description: "Please verify the zip code",
              });
              setZipCode(postalCode.replace(/\D/g, '').slice(0, 5));
            }
          } else {
            toast({
              title: "Zip Code Not Found",
              description: "Please enter your zip code manually",
              variant: "destructive"
            });
          }
        } catch (error) {
          console.error('Reverse geocoding error:', error);
          toast({
            title: "Location Error",
            description: "Failed to get zip code from location",
            variant: "destructive"
          });
        } finally {
          setDetectingLocation(false);
        }
      },
      (error) => {
        setDetectingLocation(false);
        let message = "Failed to detect location";
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            message = "Location permission denied. Please enable location access in your browser settings.";
            break;
          case error.POSITION_UNAVAILABLE:
            message = "Location information unavailable";
            break;
          case error.TIMEOUT:
            message = "Location request timed out";
            break;
        }

        toast({
          title: "Location Error",
          description: message,
          variant: "destructive"
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  const fetchHoursForRetailer = async (retailer: Retailer) => {
    const key = retailer.retailer_key;
    
    if (retailerHours[key] || loadingHours[key]) {
      return;
    }

    setLoadingHours(prev => ({ ...prev, [key]: true }));

    try {
      const { data, error } = await supabase.functions.invoke('get-place-hours', {
        body: {
          name: retailer.name,
          address: retailer.location?.address || '',
          city: retailer.location?.city || '',
          state: retailer.location?.state || '',
        }
      });

      if (error) throw error;

      setRetailerHours(prev => ({ ...prev, [key]: data }));
    } catch (error) {
      console.error('Error fetching hours:', error);
      setRetailerHours(prev => ({ 
        ...prev, 
        [key]: { available: false, message: 'Hours unavailable' } 
      }));
    } finally {
      setLoadingHours(prev => ({ ...prev, [key]: false }));
    }
  };

  const fetchRetailers = async (zip: string) => {
    if (!zip || zip.length < 5) {
      toast({
        title: "Invalid Zip Code",
        description: "Please enter a valid 5-digit zip code",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('instacart-service', {
        body: { 
          action: 'get_nearby_retailers',
          zipCode: zip
        }
      });

      if (error) throw error;

      let retailersData = data.retailers || [];
      
      // Calculate distances if we have user location
      if (userLocation && retailersData.length > 0) {
        const retailersWithDistance = await Promise.all(
          retailersData.map(async (retailer: any) => {
            if (retailer.location?.address && retailer.location?.city && retailer.location?.state && retailer.location?.zip_code) {
              const coords = await geocodeAddress(
                retailer.location.address,
                retailer.location.city,
                retailer.location.state,
                retailer.location.zip_code
              );
              
              if (coords) {
                const distance = calculateDistance(
                  userLocation.lat,
                  userLocation.lng,
                  coords.lat,
                  coords.lng
                );
                return { ...retailer, distance: Math.round(distance * 10) / 10 }; // Round to 1 decimal
              }
            }
            return { ...retailer, distance: null };
          })
        );
        
        // Sort by distance (nulls at end)
        retailersData = retailersWithDistance.sort((a, b) => {
          if (a.distance === null) return 1;
          if (b.distance === null) return -1;
          return a.distance - b.distance;
        });
      }
      
      setRetailers(retailersData);
      
      if (retailersData.length === 0) {
        toast({
          title: "No Stores Found",
          description: "No Instacart retailers found in this area",
          variant: "destructive"
        });
      } else {
        // Fetch hours for all retailers
        retailersData.forEach((retailer: Retailer) => {
          fetchHoursForRetailer(retailer);
        });
      }
    } catch (error) {
      console.error('Error fetching retailers:', error);
      toast({
        title: "Error",
        description: "Failed to fetch nearby stores. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSelectStore = async (retailer: Retailer) => {
    setSelecting(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          preferred_retailer_id: retailer.retailer_key,
          preferred_retailer_name: retailer.name,
          user_zip_code: zipCode,
          last_retailer_refresh: new Date().toISOString()
        })
        .eq('id', userId);

      if (error) throw error;

      toast({
        title: "Store Selected",
        description: `${retailer.name} is now your preferred store`
      });

      onStoreSelected?.(retailer);
      onClose();
    } catch (error) {
      console.error('Error selecting store:', error);
      toast({
        title: "Error",
        description: "Failed to save store preference",
        variant: "destructive"
      });
    } finally {
      setSelecting(false);
    }
  };

  const filteredRetailers = useMemo(() => {
    if (selectedChains.length === 0) {
      return retailers;
    }
    return retailers.filter(r => 
      selectedChains.includes(r.banner_name || r.name)
    );
  }, [retailers, selectedChains]);

  const toggleChain = (chainName: string) => {
    setSelectedChains(prev => 
      prev.includes(chainName) 
        ? prev.filter(c => c !== chainName)
        : [...prev, chainName]
    );
  };

  const toggleHoursExpanded = (retailerKey: string) => {
    setExpandedHours(prev => ({ ...prev, [retailerKey]: !prev[retailerKey] }));
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg bg-slate-900 text-white border-slate-800">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Store className="text-emerald-400" />
            Select Your Store
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            Choose your preferred Instacart retailer for seamless checkout
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Zip Code Input */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <Input
                type="text"
                placeholder="Enter zip code"
                value={zipCode}
                onChange={(e) => setZipCode(e.target.value.replace(/\D/g, '').slice(0, 5))}
                onKeyDown={(e) => e.key === 'Enter' && fetchRetailers(zipCode)}
                className="pl-10 bg-slate-800 border-slate-700 text-white"
                maxLength={5}
              />
            </div>
            <Button
              onClick={detectLocation}
              disabled={detectingLocation}
              variant="outline"
              size="icon"
              className="border-slate-700 hover:bg-slate-800"
              title="Detect my location"
            >
              {detectingLocation ? (
                <Loader2 className="animate-spin text-emerald-400" size={18} />
              ) : (
                <Locate className="text-emerald-400" size={18} />
              )}
            </Button>
            <Button
              onClick={() => fetchRetailers(zipCode)}
              disabled={loading || zipCode.length < 5}
              className="bg-emerald-500 hover:bg-emerald-600"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={18} />
              ) : (
                'Search'
              )}
            </Button>
          </div>

          {/* Chain Filter */}
          {availableChains.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-slate-300">Filter by Store Chain</label>
                {selectedChains.length > 0 && (
                  <button
                    onClick={() => setSelectedChains([])}
                    className="text-xs text-slate-400 hover:text-white"
                  >
                    Clear filters
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {availableChains.map(chain => (
                  <button
                    key={chain.name}
                    onClick={() => toggleChain(chain.name)}
                    className={cn(
                      "px-3 py-1.5 text-sm rounded-full border transition-colors",
                      selectedChains.includes(chain.name)
                        ? "bg-emerald-500 text-white border-emerald-500"
                        : "bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300"
                    )}
                  >
                    {chain.name} ({chain.count})
                  </button>
                ))}
              </div>
              {selectedChains.length > 0 && (
                <p className="text-xs text-slate-400">
                  Showing {filteredRetailers.length} of {retailers.length} stores
                </p>
              )}
            </div>
          )}

          {/* Retailers List */}
          <div className="max-h-96 overflow-y-auto space-y-2">
            <AnimatePresence mode="wait">
              {loading ? (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center justify-center py-12"
                >
                  <Loader2 className="animate-spin text-emerald-400" size={32} />
                </motion.div>
              ) : filteredRetailers.length > 0 ? (
                <motion.div
                  key="retailers"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-2"
                >
                  {filteredRetailers.map((retailer, index) => {
                    const hours = retailerHours[retailer.retailer_key];
                    const isLoadingHours = loadingHours[retailer.retailer_key];
                    const isExpanded = expandedHours[retailer.retailer_key];
                    
                    return (
                      <motion.div
                        key={retailer.retailer_key}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="group bg-slate-800/60 hover:bg-slate-800 border border-slate-700 hover:border-emerald-500/50 rounded-lg transition-all overflow-hidden"
                      >
                        <div 
                          className="p-4 cursor-pointer"
                          onClick={() => handleSelectStore(retailer)}
                        >
                          <div className="flex items-center gap-3">
                            {/* Retailer Logo */}
                            {retailer.retailer_logo_url ? (
                              <div className="w-12 h-12 rounded-lg bg-white flex items-center justify-center p-1.5 flex-shrink-0">
                                <img 
                                  src={retailer.retailer_logo_url} 
                                  alt={retailer.name}
                                  className="w-full h-full object-contain"
                                />
                              </div>
                            ) : (
                              <div className="w-12 h-12 rounded-lg bg-slate-700 flex items-center justify-center flex-shrink-0">
                                <Store className="text-slate-400" size={24} />
                              </div>
                            )}

                            {/* Store Information */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <h4 className="font-semibold text-white group-hover:text-emerald-400 transition-colors truncate">
                                  {retailer.name}
                                </h4>
                                {retailer.distance !== null && retailer.distance !== undefined && (
                                  <span className="text-xs font-medium text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full flex-shrink-0">
                                    {retailer.distance} mi
                                  </span>
                                )}
                              </div>
                              {retailer.banner_name && retailer.banner_name !== retailer.name && (
                                <p className="text-xs text-emerald-400/70 mt-0.5">{retailer.banner_name}</p>
                              )}
                              {retailer.location && (
                                <p className="text-sm text-slate-400 mt-1 truncate">
                                  {[
                                    retailer.location.address,
                                    retailer.location.city,
                                    retailer.location.state,
                                    retailer.location.zip_code
                                  ].filter(Boolean).join(', ')}
                                </p>
                              )}
                              {retailer.store_number && (
                                <p className="text-xs text-slate-500 mt-0.5">Store #{retailer.store_number}</p>
                              )}

                              {/* Operating Hours */}
                              {isLoadingHours ? (
                                <div className="flex items-center gap-2 mt-2 text-xs text-slate-400">
                                  <div className="w-3 h-3 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
                                  Loading hours...
                                </div>
                              ) : hours?.available ? (
                                <div className="mt-2">
                                  <div className="flex items-center gap-2">
                                    <div className={cn(
                                      "w-2 h-2 rounded-full",
                                      hours.isOpen ? "bg-green-500" : "bg-red-500"
                                    )} />
                                    <span className={cn(
                                      "text-sm font-medium",
                                      hours.isOpen ? "text-green-400" : "text-red-400"
                                    )}>
                                      {hours.currentStatus}
                                    </span>
                                    {hours.todayHours && (
                                      <span className="text-xs text-slate-400">
                                        · {hours.todayHours}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              ) : hours?.available === false ? (
                                <p className="text-xs text-slate-500 mt-2">
                                  {hours.message || 'Hours unavailable'}
                                </p>
                              ) : null}
                            </div>

                            {/* Action Indicator */}
                            <div className="flex-shrink-0">
                              {selecting ? (
                                <Loader2 className="animate-spin text-emerald-400" size={20} />
                              ) : (
                                <div className="w-10 h-10 rounded-full bg-emerald-500/10 group-hover:bg-emerald-500/20 flex items-center justify-center transition-colors">
                                  <Store className="text-emerald-400" size={18} />
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Expandable Full Hours */}
                        {hours?.available && hours.hours && (
                          <div className="border-t border-slate-700/50">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleHoursExpanded(retailer.retailer_key);
                              }}
                              className="w-full px-4 py-2 text-xs text-slate-400 hover:text-white flex items-center justify-center gap-1"
                            >
                              {isExpanded ? 'Hide' : 'View'} full hours
                              <motion.svg
                                animate={{ rotate: isExpanded ? 180 : 0 }}
                                className="w-3 h-3"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </motion.svg>
                            </button>
                            
                            {isExpanded && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="px-4 pb-4 space-y-1 bg-slate-800/30"
                              >
                                {Object.entries(hours.hours).map(([day, time]) => (
                                  <div key={day} className="flex justify-between text-xs">
                                    <span className="capitalize font-medium text-slate-300">{day}</span>
                                    <span className="text-slate-400">{time as string}</span>
                                  </div>
                                ))}
                              </motion.div>
                            )}
                          </div>
                        )}
                      </motion.div>
                    );
                  })}
                </motion.div>
              ) : retailers.length > 0 ? (
                <motion.div
                  key="filtered-empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-center py-12 text-slate-400"
                >
                  <Store className="mx-auto mb-3 opacity-50" size={48} />
                  <p>No stores match the selected filters.</p>
                </motion.div>
              ) : zipCode.length === 5 ? (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-center py-12 text-slate-400"
                >
                  <Store className="mx-auto mb-3 opacity-50" size={48} />
                  <p>No stores found. Try a different zip code.</p>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default StoreSelector;
