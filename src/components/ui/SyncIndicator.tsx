import { motion, AnimatePresence } from 'framer-motion';
import { useRealtimeContext } from '@/contexts/RealtimeContext';
import { RefreshCw, Wifi, WifiOff } from 'lucide-react';
import { cn } from '@/lib/utils';

export const SyncIndicator = () => {
  const { isConnected, isSyncing, lastSync } = useRealtimeContext();

  return (
    <div className="fixed bottom-6 right-6 z-40 flex items-center gap-3">
      {/* Connection Status */}
      <AnimatePresence>
        {!isConnected && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="flex items-center gap-2 px-3 py-2 bg-destructive/90 backdrop-blur-sm rounded-full text-destructive-foreground text-sm font-medium shadow-lg"
          >
            <WifiOff className="w-4 h-4" />
            <span>Offline</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Syncing Indicator */}
      <AnimatePresence>
        {isSyncing && isConnected && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="flex items-center gap-2 px-3 py-2 bg-primary/90 backdrop-blur-sm rounded-full text-primary-foreground text-sm font-medium shadow-lg"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            >
              <RefreshCw className="w-4 h-4" />
            </motion.div>
            <span>Syncing...</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Connected & Up-to-date (subtle) */}
      {isConnected && !isSyncing && lastSync && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center gap-2 px-3 py-2 bg-card/50 backdrop-blur-sm rounded-full border border-border/50 text-muted-foreground text-xs"
        >
          <Wifi className="w-3 h-3 text-emerald-500" />
          <span>Live</span>
        </motion.div>
      )}
    </div>
  );
};
