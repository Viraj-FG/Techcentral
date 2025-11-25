import { ReactNode, useState } from 'react';
import { motion } from 'framer-motion';
import { Settings, Scan, LogOut, Users, Mic, Bell, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { kaevaTransition } from '@/hooks/useKaevaMotion';
import { NotificationBell } from '@/components/ui/NotificationBell';
import GlobalSearch from '@/components/search/GlobalSearch';
import UniversalShell from './UniversalShell';

interface AppShellProps {
  children: ReactNode;
  onScan: () => void;
  onVoiceActivate?: () => void;
}

const AppShell = ({
  children,
  onScan,
  onVoiceActivate
}: AppShellProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchOpen, setSearchOpen] = useState(false);
  
  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Logged out successfully"
    });
    navigate('/auth');
  };

  return (
    <>
      {/* Background atmosphere layer */}
      <motion.div 
        className="fixed inset-0 bg-gradient-to-br from-kaeva-void via-kaeva-void to-kaeva-teal/5 z-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.2 }}
      />
      
      <UniversalShell className="pt-6">
        {children}
      </UniversalShell>

      {/* Navigation Dock - positioned with safe area support */}
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3, type: "spring", stiffness: 260, damping: 20 }}
        className="fixed bottom-[calc(1rem+env(safe-area-inset-bottom))] left-1/2 -translate-x-1/2 z-50 pointer-events-auto"
      >
        <div className="mx-auto max-w-sm h-[72px] bg-slate-900/80 border border-white/10 rounded-full flex items-center justify-between px-6">
          {/* Left Group - 3 Buttons */}
          <div className="flex items-center gap-0.5">
            <NotificationBell />
            
            <button 
              onClick={() => setSearchOpen(true)}
              className="p-2 text-slate-400 hover:text-white transition-colors rounded-full"
            >
              <Search size={22} strokeWidth={1.5} />
            </button>

            <button onClick={() => navigate('/settings')} className="p-2 text-slate-400 hover:text-white transition-colors rounded-full">
              <Settings size={22} strokeWidth={1.5} />
            </button>
          </div>
          
          {/* Center - Scan Button */}
          <button onClick={onScan} className="p-2">
            <div className="w-16 h-16 rounded-full bg-kaeva-sage border-4 border-[#0F172A] flex items-center justify-center">
              <Scan size={28} className="text-slate-900" strokeWidth={2} />
            </div>
          </button>

          {/* Right Group - 3 Buttons */}
          <div className="flex items-center gap-0.5">
            <button onClick={() => navigate('/household')} className="p-2 text-slate-400 hover:text-kaeva-accent transition-colors rounded-full">
              <Users size={22} strokeWidth={1.5} />
            </button>

            <button 
              onClick={onVoiceActivate} 
              className="p-2 text-slate-400 hover:text-kaeva-accent transition-colors rounded-full"
            >
              <Mic size={22} strokeWidth={1.5} />
            </button>

            <button onClick={handleLogout} className="p-2 text-slate-400 hover:text-white transition-colors rounded-full">
              <LogOut size={24} strokeWidth={1.5} />
            </button>
          </div>
        </div>
      </motion.div>

      {/* Global Search */}
      <GlobalSearch open={searchOpen} onOpenChange={setSearchOpen} />
    </>
  );
};

export default AppShell;
