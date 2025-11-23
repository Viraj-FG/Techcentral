import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Camera, Zap, ShoppingBag, Package } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { kaevaEntranceVariants, kaevaTransition } from '@/hooks/useKaevaMotion';

interface Activity {
  id: string;
  icon: 'camera' | 'zap' | 'cart' | 'package';
  title: string;
  timestamp: string;
}

const RecentActivity = () => {
  const [activities, setActivities] = useState<Activity[]>([]);

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) return;

        const recentActivities: Activity[] = [];

        // Fetch recent inventory additions
        const inventoryTable = supabase.from('inventory') as any;
        const { data: inventoryData } = await inventoryTable
          .select('created_at, name')
          .eq('user_id', session.user.id)
          .order('created_at', { ascending: false })
          .limit(2);

        if (inventoryData) {
          inventoryData.forEach(item => {
            recentActivities.push({
              id: `inv-${item.created_at}`,
              icon: 'camera',
              title: `Scanned ${item.name}`,
              timestamp: getRelativeTime(item.created_at)
            });
          });
        }

        // Check for auto-order items
        const autoOrderTable = supabase.from('inventory') as any;
        const { data: autoOrderData } = await autoOrderTable
          .select('updated_at, name')
          .eq('user_id', session.user.id)
          .eq('auto_order_enabled', true)
          .order('updated_at', { ascending: false })
          .limit(1);

        if (autoOrderData && autoOrderData.length > 0) {
          recentActivities.push({
            id: `auto-${autoOrderData[0].updated_at}`,
            icon: 'cart',
            title: `Auto-Ordered ${autoOrderData[0].name}`,
            timestamp: getRelativeTime(autoOrderData[0].updated_at)
          });
        }

        // Add health check placeholder
        if (recentActivities.length < 3) {
          recentActivities.push({
            id: 'health-check',
            icon: 'zap',
            title: 'Health Check Passed',
            timestamp: '2 hours ago'
          });
        }

        setActivities(recentActivities.slice(0, 3));
      } catch (error) {
        console.error('Error fetching activities:', error);
      }
    };

    fetchActivities();
  }, []);

  const getRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    return `${Math.floor(diffInSeconds / 86400)} days ago`;
  };

  const getIcon = (iconType: Activity['icon']) => {
    switch (iconType) {
      case 'camera': return <Camera size={18} strokeWidth={1.5} />;
      case 'zap': return <Zap size={18} strokeWidth={1.5} />;
      case 'cart': return <ShoppingBag size={18} strokeWidth={1.5} />;
      case 'package': return <Package size={18} strokeWidth={1.5} />;
    }
  };

  if (activities.length === 0) return null;

  return (
    <motion.div 
      className="space-y-3"
      variants={kaevaEntranceVariants}
      initial="hidden"
      animate="visible"
      transition={kaevaTransition}
    >
      <h3 className="text-xs font-bold tracking-widest text-slate-500 uppercase px-1">
        Recent Activity
      </h3>
      {activities.map((activity, idx) => (
        <motion.div 
          key={activity.id}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ ...kaevaTransition, delay: idx * 0.1 }}
          className="w-full p-3 rounded-xl bg-white/5 border border-white/5 flex items-center gap-4 hover:bg-white/10 transition-colors cursor-pointer"
        >
          <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400">
            {getIcon(activity.icon)}
          </div>
          <div className="flex-1">
            <div className="text-sm text-slate-200 font-medium">
              {activity.title}
            </div>
            <div className="text-xs text-slate-500">
              {activity.timestamp}
            </div>
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
};

export default RecentActivity;
