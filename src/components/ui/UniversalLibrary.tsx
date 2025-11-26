import { useState, useMemo } from "react";
import { Search, X, Apple, Package, BookOpen, PawPrint, Sparkles, Clock, Bookmark, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

interface LibraryFilter {
  id: string;
  label: string;
  icon: any;
  query: (items: any[]) => any[];
}

interface UniversalLibraryProps {
  domain: 'nutrition' | 'inventory' | 'recipes' | 'pets' | 'beauty';
  isOpen: boolean;
  onClose: () => void;
  onSelect: (item: any) => void;
  items: any[];
  placeholder?: string;
  filters?: LibraryFilter[];
}

// Domain-specific tab configurations
const domainTabs = {
  nutrition: [
    { id: 'all', label: 'All Foods', icon: Apple },
    { id: 'meals', label: 'My Meals', icon: BookOpen },
    { id: 'recent', label: 'Recent', icon: Clock },
    { id: 'bookmarked', label: 'Saved', icon: Bookmark }
  ],
  inventory: [
    { id: 'all', label: 'All Items', icon: Package },
    { id: 'expiring', label: 'Expiring', icon: AlertCircle },
    { id: 'fridge', label: 'Fridge', icon: Package },
    { id: 'pantry', label: 'Pantry', icon: Package }
  ],
  recipes: [
    { id: 'all', label: 'All Recipes', icon: BookOpen },
    { id: 'my_recipes', label: 'My Recipes', icon: Sparkles },
    { id: 'bookmarked', label: 'Saved', icon: Bookmark },
    { id: 'ready', label: 'Ready to Cook', icon: AlertCircle }
  ],
  pets: [
    { id: 'all', label: 'All Products', icon: Package },
    { id: 'safe', label: 'Safe Foods', icon: Bookmark },
    { id: 'toxic', label: 'Toxic Foods', icon: AlertCircle },
    { id: 'schedule', label: 'Schedule', icon: Clock }
  ],
  beauty: [
    { id: 'all', label: 'All Products', icon: Sparkles },
    { id: 'expiring', label: 'Expiring Soon', icon: AlertCircle },
    { id: 'morning', label: 'Morning', icon: Clock },
    { id: 'bookmarked', label: 'Repurchase', icon: Bookmark }
  ]
};

export const UniversalLibrary = ({
  domain,
  isOpen,
  onClose,
  onSelect,
  items,
  placeholder = "Search...",
  filters
}: UniversalLibraryProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState('all');

  const tabs = domainTabs[domain];

  // Filter items based on search and active tab
  const filteredItems = useMemo(() => {
    let result = items;

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter((item: any) => 
        item.name?.toLowerCase().includes(query) ||
        item.title?.toLowerCase().includes(query) ||
        item.item_name?.toLowerCase().includes(query)
      );
    }

    // Apply tab filter
    if (activeTab !== 'all' && filters) {
      const filter = filters.find(f => f.id === activeTab);
      if (filter) {
        result = filter.query(result);
      }
    }

    return result;
  }, [items, searchQuery, activeTab, filters]);

  const handleItemSelect = (item: any) => {
    onSelect(item);
    setSearchQuery("");
    setActiveTab('all');
    onClose();
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="bottom" className="h-[80vh]">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Search size={20} className="text-primary" />
            Search {domain.charAt(0).toUpperCase() + domain.slice(1)}
          </SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-4 h-[calc(100%-80px)]">
          {/* Search input */}
          <div className="relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={placeholder}
              className="pl-10 pr-10"
              autoFocus
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSearchQuery("")}
                className="absolute right-1 top-1/2 -translate-y-1/2"
              >
                <X size={18} />
              </Button>
            )}
          </div>

          {/* Tabs */}
          <div className="overflow-x-auto">
            <div className="flex gap-2 pb-2">
              {tabs.map((tab) => (
                <Button
                  key={tab.id}
                  variant={activeTab === tab.id ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => setActiveTab(tab.id)}
                  className="whitespace-nowrap"
                >
                  <tab.icon size={14} />
                  {tab.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Items list */}
          <ScrollArea className="h-[calc(100%-120px)]">
            <div className="space-y-2">
              {filteredItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Search size={48} className="text-muted-foreground/20 mb-4" />
                  <p className="text-muted-foreground">No items found</p>
                </div>
              ) : (
                filteredItems.map((item: any, index: number) => {
                  const displayName = item.name || item.title || item.item_name || 'Unknown';
                  const displayQuantity = item.quantity || item.servings || '';
                  const displayUnit = item.unit || '';

                  return (
                    <button
                      key={item.id || index}
                      onClick={() => handleItemSelect(item)}
                      className={cn(
                        "w-full flex items-center justify-between p-4 rounded-xl",
                        "bg-background/40 backdrop-blur-xl border border-border/20",
                        "hover:border-primary/30 hover:bg-background/60",
                        "transition-all duration-200"
                      )}
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                          {domain === 'nutrition' && <Apple size={20} className="text-primary" />}
                          {domain === 'inventory' && <Package size={20} className="text-primary" />}
                          {domain === 'recipes' && <BookOpen size={20} className="text-primary" />}
                          {domain === 'pets' && <PawPrint size={20} className="text-primary" />}
                          {domain === 'beauty' && <Sparkles size={20} className="text-primary" />}
                        </div>
                        <div className="flex-1 min-w-0 text-left">
                          <p className="font-medium text-foreground truncate">{displayName}</p>
                          {(displayQuantity || displayUnit) && (
                            <p className="text-sm text-muted-foreground">
                              {displayQuantity} {displayUnit}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="text-muted-foreground">›</div>
                    </button>
                  );
                })
              )}
            </div>
          </ScrollArea>
        </div>
      </SheetContent>
    </Sheet>
  );
};
