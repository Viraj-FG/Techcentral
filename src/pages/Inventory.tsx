import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import AppShell from '@/components/layout/AppShell';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { InventoryItemCard } from '@/components/inventory/InventoryItemCard';
import { Package, Trash2, ShoppingCart, X } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

type InventoryCategory = 'fridge' | 'pantry' | 'beauty' | 'pets';

interface InventoryItem {
  id: string;
  name: string;
  brand_name: string | null;
  category: InventoryCategory;
  quantity: number | null;
  unit: string | null;
  fill_level: number | null;
  expiry_date: string | null;
  status: string | null;
  auto_order_enabled: boolean;
  reorder_threshold: number | null;
  product_image_url: string | null;
  household_id: string;
}

const Inventory = () => {
  const navigate = useNavigate();
  const [selectedTab, setSelectedTab] = useState<'all' | InventoryCategory>('all');
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    fetchInventory();
    checkAuth();
  }, []);

  useEffect(() => {
    if (!userId) return;

    // Real-time subscription
    const channel = supabase
      .channel('inventory-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'inventory',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setItems(prev => [...prev, payload.new as InventoryItem]);
          } else if (payload.eventType === 'UPDATE') {
            setItems(prev => prev.map(item => 
              item.id === payload.new.id ? payload.new as InventoryItem : item
            ));
          } else if (payload.eventType === 'DELETE') {
            setItems(prev => prev.filter(item => item.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) setUserId(user.id);
  };

  const fetchInventory = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('inventory')
      .select('*')
      .eq('user_id', user.id)
      .order('name');

    if (!error && data) {
      setItems(data);
    }
    setLoading(false);
  };

  const filteredItems = items.filter(item => 
    selectedTab === 'all' || item.category === selectedTab
  );

  const handleToggleSelection = (itemId: string) => {
    setSelectedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const handleLongPress = (itemId: string) => {
    if (!isSelectionMode) {
      setIsSelectionMode(true);
      setSelectedItems([itemId]);
    }
  };

  const handleBulkDelete = async () => {
    const count = selectedItems.length;
    if (!confirm(`Delete ${count} item${count > 1 ? 's' : ''}?`)) return;

    const { error } = await supabase
      .from('inventory')
      .delete()
      .in('id', selectedItems);

    if (!error) {
      toast.success(`${count} item${count > 1 ? 's' : ''} deleted`);
      setSelectedItems([]);
      setIsSelectionMode(false);
    } else {
      toast.error('Failed to delete items');
    }
  };

  const handleBulkAddToCart = async () => {
    if (!userId) return;

    // Get household_id from profile
    const { data: profileData } = await supabase
      .from('profiles')
      .select('current_household_id')
      .eq('id', userId)
      .single();

    if (!profileData?.current_household_id) {
      toast.error('No household found');
      return;
    }

    const itemsToAdd = items
      .filter(item => selectedItems.includes(item.id))
      .map(item => ({
        item_name: item.name,
        household_id: profileData.current_household_id,
        source: 'bulk_add',
        priority: 'normal',
        quantity: 1,
        unit: item.unit,
        inventory_id: item.id
      }));

    const { error } = await supabase
      .from('shopping_list')
      .insert(itemsToAdd);

    if (!error) {
      toast.success(`${itemsToAdd.length} item${itemsToAdd.length > 1 ? 's' : ''} added to shopping list`);
      setSelectedItems([]);
      setIsSelectionMode(false);
    } else {
      toast.error('Failed to add items to shopping list');
    }
  };

  const handleCancelSelection = () => {
    setIsSelectionMode(false);
    setSelectedItems([]);
  };

  return (
    <AppShell onScan={() => navigate('/')}>
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5">
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-foreground mb-2">Inventory Manager</h1>
            <p className="text-muted-foreground">Manage all your household items</p>
          </div>

          {/* Tabs */}
          <Tabs value={selectedTab} onValueChange={(val) => setSelectedTab(val as typeof selectedTab)} className="mb-6">
            <TabsList className="bg-card/50 backdrop-blur-sm border border-border/50">
              <TabsTrigger value="all">All Items</TabsTrigger>
              <TabsTrigger value="fridge">Fridge</TabsTrigger>
              <TabsTrigger value="pantry">Pantry</TabsTrigger>
              <TabsTrigger value="beauty">Beauty</TabsTrigger>
              <TabsTrigger value="pets">Pets</TabsTrigger>
            </TabsList>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
                {[1, 2, 3, 4, 5, 6].map(i => (
                  <div key={i} className="h-48 bg-card/30 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : (
              <TabsContent value={selectedTab} className="mt-6">
                {filteredItems.length === 0 ? (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center py-16"
                  >
                    <Package className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-lg text-muted-foreground mb-4">
                      No items in {selectedTab === 'all' ? 'your inventory' : selectedTab}
                    </p>
                    <Button onClick={() => navigate('/')} variant="default">
                      Scan Items
                    </Button>
                  </motion.div>
                ) : (
                  <motion.div 
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
                    initial="hidden"
                    animate="show"
                    variants={{
                      hidden: { opacity: 0 },
                      show: {
                        opacity: 1,
                        transition: { staggerChildren: 0.05 }
                      }
                    }}
                  >
                    {filteredItems.map((item) => (
                      <InventoryItemCard
                        key={item.id}
                        item={item}
                        isSelectionMode={isSelectionMode}
                        isSelected={selectedItems.includes(item.id)}
                        onToggleSelection={() => handleToggleSelection(item.id)}
                        onLongPress={() => handleLongPress(item.id)}
                        onRefresh={fetchInventory}
                      />
                    ))}
                  </motion.div>
                )}
              </TabsContent>
            )}
          </Tabs>

          {/* Bulk Action Bar */}
          <AnimatePresence>
            {isSelectionMode && selectedItems.length > 0 && (
              <motion.div
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 100, opacity: 0 }}
                className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50"
              >
                <div className="bg-card/95 backdrop-blur-xl border border-border/50 rounded-2xl shadow-2xl px-6 py-4 flex items-center gap-4">
                  <span className="text-sm text-muted-foreground">
                    {selectedItems.length} selected
                  </span>
                  <div className="h-6 w-px bg-border" />
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleBulkDelete}
                    className="gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={handleBulkAddToCart}
                    className="gap-2"
                  >
                    <ShoppingCart className="w-4 h-4" />
                    Add to Cart
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCancelSelection}
                    className="gap-2"
                  >
                    <X className="w-4 h-4" />
                    Cancel
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </AppShell>
  );
};

export default Inventory;
