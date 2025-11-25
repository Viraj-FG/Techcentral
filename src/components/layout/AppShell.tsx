import { ReactNode, useState } from 'react';
import { motion } from 'framer-motion';
import { Settings, Scan, LogOut, Users, Mic, Bell, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import { kaevaTransition } from '@/hooks/useKaevaMotion';
import KaevaAperture from '@/components/KaevaAperture';
import { NotificationBell } from '@/components/ui/NotificationBell';
import GlobalSearch from '@/components/search/GlobalSearch';

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
  const { trigger: triggerHaptic } = useHapticFeedback();
  
  const handleLogout = async () => {
    await triggerHaptic('medium');
    await supabase.auth.signOut();
    toast({
      title: "Logged out successfully"
    });
    navigate('/auth');
  };
  return <div className="relative w-full h-screen bg-[#0F172A] text-slate-50 overflow-hidden selection:bg-emerald-500/30">
      
      {/* LAYER 0: Atmosphere (Fixed Background) */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <motion.div className="absolute top-[-10%] left-[-10%] w-[80%] h-[80%] bg-kaeva-sage/10 rounded-full blur-[120px]" animate={{
        scale: [1, 1.1, 1],
        opacity: [0.3, 0.5, 0.3]
      }} transition={{
        duration: 8,
        repeat: Infinity,
        ease: "easeInOut"
      }} />
        <motion.div className="absolute bottom-[-10%] right-[-10%] w-[80%] h-[80%] bg-kaeva-terra/10 rounded-full blur-[120px]" animate={{
        scale: [1.1, 1, 1.1],
        opacity: [0.3, 0.5, 0.3]
      }} transition={{
        duration: 10,
        repeat: Infinity,
        ease: "easeInOut"
      }} />
      </div>

      {/* LAYER 10: Scrollable Content */}
      <main className="relative z-10 w-full h-full overflow-y-auto overflow-x-hidden pb-[160px] pt-6 px-4 scroll-smooth">
        <div className="max-w-md mx-auto space-y-8">
          {children}
        </div>
      </main>

      {/* LAYER 20: Bottom Gradient Mask */}
      <div className="fixed bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#0F172A] via-[#0F172A]/80 to-transparent z-20 pointer-events-none" />

      {/* LAYER 50: Navigation Dock */}
      <div className="fixed bottom-6 left-0 right-0 z-50 px-4 pointer-events-none">
        <motion.div className="mx-auto max-w-sm h-[72px] bg-slate-900/80 border border-white/10 rounded-full pointer-events-auto flex items-center justify-around px-4" initial={{
        opacity: 0,
        y: 100
      }} animate={{
        opacity: 1,
        y: 0
      }} transition={{
        ...kaevaTransition,
        delay: 0.5
      }}>
          {/* LEFT SIDE - 3 buttons */}
          
          {/* Notification Bell */}
          <NotificationBell />

          {/* Search Button */}
          <button 
            onClick={() => {
              triggerHaptic('light');
              setSearchOpen(true);
            }}
            className="p-3 text-slate-400 rounded-full"
          >
            <Search size={22} strokeWidth={1.5} />
          </button>

          {/* Household Button */}
          <button 
            onClick={() => {
              triggerHaptic('light');
              navigate('/household');
            }}
            className="p-3 text-slate-400 rounded-full"
          >
            <Users size={22} strokeWidth={1.5} />
          </button>
          
          {/* The Living Aperture - Vision Scanner Trigger */}
          <button onClick={onScan} className="relative -top-6">
            <div className="w-16 h-16 rounded-full bg-kaeva-sage border-4 border-[#0F172A] flex items-center justify-center">
              <Scan size={28} className="text-slate-900" strokeWidth={2} />
            </div>
          </button>

          {/* RIGHT SIDE - 3 buttons */}

          {/* Settings Button */}
          <button 
            onClick={() => {
              triggerHaptic('light');
              navigate('/settings');
            }}
            className="p-3 text-slate-400 rounded-full"
          >
            <Settings size={22} strokeWidth={1.5} />
          </button>

          {/* Mic Button */}
          <button 
            onClick={onVoiceActivate} 
            className="p-3 text-slate-400 rounded-full"
          >
            <Mic size={22} strokeWidth={1.5} />
          </button>

          {/* Logout Button */}
          <button onClick={handleLogout} className="p-3 text-slate-400 rounded-full">
            <LogOut size={24} strokeWidth={1.5} />
          </button>
        </motion.div>
      </div>

      {/* Global Search */}
      <GlobalSearch open={searchOpen} onOpenChange={setSearchOpen} />
    </div>;
};
export default AppShell;