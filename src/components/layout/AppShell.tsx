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
  const { toast } = useToast();
  const [userId, setUserId] = useState<string | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [actionPickerOpen, setActionPickerOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  // Fetch user and profile data
  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        
        // Fetch profile
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        
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
      return profile.user_name
        .split(' ')
        .map((n: string) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    return 'KA';
  };

  return (
    <>
      {/* Background atmosphere layer */}
      <motion.div 
        className="fixed inset-0 bg-gradient-to-br from-background via-background to-primary/5 z-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.2 }}
      />
      
      <UniversalShell className="pt-6">
        {children}
      </UniversalShell>

      {/* The Floating Command Dock - Redesigned with Hero Aperture */}
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3, type: "spring", stiffness: 260, damping: 20 }}
        className="fixed bottom-[calc(1rem+env(safe-area-inset-bottom))] left-1/2 -translate-x-1/2 z-50 pointer-events-auto"
      >
        <div className="relative flex items-center gap-8 px-8 py-4 bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-full">
          {/* Left: Settings */}
          <button 
            onClick={() => navigate('/settings')} 
            className="p-3 text-muted-foreground hover:text-foreground transition-colors rounded-full hover:bg-white/5"
            aria-label="Settings"
          >
            <Settings size={22} strokeWidth={1.5} />
          </button>

          {/* Center: The Living Aperture (Hero Button) */}
          <button 
            onClick={handleApertureClick}
            className="relative -my-8 cursor-pointer group"
            aria-label="Open action menu"
          >
            <div className="w-16 h-16 transition-transform group-hover:scale-105 group-active:scale-95">
              <KaevaAperture 
                state="idle" 
                size="sm"
              />
            </div>
          </button>

          {/* Right: Profile/Household */}
          <button 
            onClick={() => navigate('/household')} 
            className="p-1 hover:opacity-80 transition-opacity rounded-full hover:bg-white/5"
            aria-label="Household"
          >
            <Avatar className="h-10 w-10 border-2 border-secondary/30">
              <AvatarImage src={undefined} />
              <AvatarFallback className="bg-secondary/20 text-secondary text-xs font-medium">
                {getUserInitials()}
              </AvatarFallback>
            </Avatar>
          </button>
        </div>
      </motion.div>

      {/* Action Picker Dialog */}
      <ActionPickerDialog
        open={actionPickerOpen}
        onOpenChange={setActionPickerOpen}
        onVoiceActivate={handleVoiceActivate}
        onScanActivate={onScan}
      />

      {/* Global Search */}
      <GlobalSearch open={searchOpen} onOpenChange={setSearchOpen} />
    </>
  );
};

export default AppShell;
