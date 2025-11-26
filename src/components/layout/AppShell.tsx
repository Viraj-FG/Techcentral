import { ReactNode, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import KaevaAperture from '@/components/KaevaAperture';
import ActionPickerDialog from './ActionPickerDialog';
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
  const {
    toast
  } = useToast();
  const [userId, setUserId] = useState<string | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [actionPickerOpen, setActionPickerOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  // Fetch user and profile data
  useEffect(() => {
    const fetchUser = async () => {
      const {
        data: {
          user
        }
      } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);

        // Fetch profile
        const {
          data: profileData
        } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        setProfile(profileData);
      }
    };
    fetchUser();
  }, []);
  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Logged out successfully"
    });
    navigate('/auth');
  };
  const handleApertureClick = () => {
    setActionPickerOpen(true);
  };
  const handleVoiceActivate = () => {
    if (onVoiceActivate) {
      onVoiceActivate();
    }
  };

  // Get user initials for avatar fallback
  const getUserInitials = () => {
    if (profile?.user_name) {
      return profile.user_name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
    }
    return 'KA';
  };
  return <>
      {/* Background atmosphere layer */}
      <motion.div className="fixed inset-0 bg-gradient-to-br from-background via-background to-primary/5 z-0" initial={{
      opacity: 0
    }} animate={{
      opacity: 1
    }} transition={{
      duration: 1.2
    }} />
      
      <UniversalShell className="pt-6">
        {children}
      </UniversalShell>

      {/* The Floating Command Dock - Satellite Architecture */}
      <motion.div initial={{
      y: 100,
      opacity: 0
    }} animate={{
      y: 0,
      opacity: 1
    }} transition={{
      delay: 0.3,
      type: "spring",
      stiffness: 260,
      damping: 20
    }} className="fixed bottom-[calc(1.5rem+env(safe-area-inset-bottom))] inset-x-0 z-50 flex justify-center pointer-events-none">
        {/* CONTAINER: Width constrained to prevent spreading */}
        <div className="relative w-full max-w-[320px] h-[72px] pointer-events-auto">
          
          {/* 1. THE GLASS CAPSULE (Background Layer) */}
          <div className="absolute inset-0 bg-[#141416]/90 backdrop-blur-2xl border border-white/10 rounded-full shadow-2xl flex items-center justify-between px-8">
            
            {/* LEFT ACTION: Settings */}
            <button onClick={() => navigate('/settings')} className="group p-2 rounded-full hover:bg-white/5 transition-colors active:scale-95 min-w-[44px] min-h-[44px] flex items-center justify-center" aria-label="Open settings">
              <Settings size={24} strokeWidth={1.5} className="text-slate-400 group-hover:text-white transition-colors" />
            </button>

            {/* RIGHT ACTION: Profile/Household */}
            <button onClick={() => navigate('/household')} className="group p-2 rounded-full hover:bg-white/5 transition-colors active:scale-95 min-w-[44px] min-h-[44px] flex items-center justify-center" aria-label="View household">
              <Avatar className="w-7 h-7 border border-secondary/30 group-hover:border-secondary/50 transition-colors">
                <AvatarImage src={undefined} />
                <AvatarFallback className="bg-secondary/20 text-secondary text-[10px] font-bold">
                  {getUserInitials()}
                </AvatarFallback>
              </Avatar>
            </button>
          </div>

          {/* 2. THE LIVING APERTURE (The Nucleus - Floats Above) */}
          <div className="absolute -top-8 left-1/2 -translate-x-1/2">
            <motion.button onClick={handleApertureClick} whileTap={{
            scale: 0.95
          }} className="relative group" aria-label="Open action menu - Voice or Scanner">
              {/* The Glow Effect */}
              <div className="absolute inset-0 rounded-full bg-primary blur-xl opacity-40 group-hover:opacity-60 transition-opacity" />
              
              {/* The Physical Button with Void Border */}
              <div className="relative w-20 h-20 rounded-full bg-primary flex items-center justify-center shadow-[0_4px_20px_rgba(0,0,0,0.4)] border-4 border-background z-10">
                <KaevaAperture state="idle" size="sm" />
              </div>
              
              {/* The "Breathing" Ring Animation */}
              <motion.div className="absolute inset-0 rounded-full border border-primary" animate={{
              scale: [1, 1.2, 1],
              opacity: [1, 0, 1]
            }} transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut"
            }} />
            </motion.button>
          </div>

        </div>
      </motion.div>

      {/* Action Picker Dialog */}
      <ActionPickerDialog open={actionPickerOpen} onOpenChange={setActionPickerOpen} onVoiceActivate={handleVoiceActivate} onScanActivate={onScan} />

      {/* Global Search */}
      <GlobalSearch open={searchOpen} onOpenChange={setSearchOpen} />
    </>;
};
export default AppShell;