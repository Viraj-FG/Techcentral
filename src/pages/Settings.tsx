import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { 
  User, Users, Heart, Sparkles, Store, BarChart3, 
  Leaf, MessageSquare, Bell, Shield, X, Package, ChefHat
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import AuroraBackground from "@/components/AuroraBackground";
import StoreSelector from "@/components/dashboard/StoreSelector";
import { kaevaTransition } from "@/hooks/useKaevaMotion";
import UniversalShell from "@/components/layout/UniversalShell";
import { SettingsRow } from "@/components/settings/SettingsRow";
import { QuickActionCard } from "@/components/settings/QuickActionCard";
import { ProfileEditSheet } from "@/components/settings/ProfileEditSheet";
import { DietarySheet } from "@/components/settings/DietarySheet";
import { BeautySheet } from "@/components/settings/BeautySheet";
import { GoalsSheet } from "@/components/settings/GoalsSheet";
import { AccountSheet } from "@/components/settings/AccountSheet";
import { ConversationHistorySheet } from "@/components/settings/ConversationHistorySheet";

const Settings = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string>("");
  const [userEmail, setUserEmail] = useState<string>("");
  const [userName, setUserName] = useState<string>("");
  const [userAge, setUserAge] = useState<number | null>(null);
  const [userWeight, setUserWeight] = useState<number | null>(null);
  const [userHeight, setUserHeight] = useState<number | null>(null);
  const [userGender, setUserGender] = useState<string>("");
  const [userActivityLevel, setUserActivityLevel] = useState<string>("");
  const [dietaryValues, setDietaryValues] = useState<string>("");
  const [allergies, setAllergies] = useState<string>("");
  const [skinType, setSkinType] = useState<string>("");
  const [hairType, setHairType] = useState<string>("");
  const [healthGoals, setHealthGoals] = useState<string>("");
  const [lifestyleGoals, setLifestyleGoals] = useState<string>("");
  const [selectedStore, setSelectedStore] = useState<{retailer_id: string; name: string} | null>(null);

  // Sheet states
  const [profileSheetOpen, setProfileSheetOpen] = useState(false);
  const [dietarySheetOpen, setDietarySheetOpen] = useState(false);
  const [beautySheetOpen, setBeautySheetOpen] = useState(false);
  const [goalsSheetOpen, setGoalsSheetOpen] = useState(false);
  const [accountSheetOpen, setAccountSheetOpen] = useState(false);
  const [historySheetOpen, setHistorySheetOpen] = useState(false);
  const [storeSelectorOpen, setStoreSelectorOpen] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        navigate('/auth');
        return;
      }

      setUserId(session.user.id);
      setUserEmail(session.user.email || "");

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (profile) {
        setUserName(profile.user_name || "");
        setUserAge(profile.user_age || null);
        setUserWeight(profile.user_weight || null);
        setUserHeight(profile.user_height || null);
        setUserGender(profile.user_gender || "");
        setUserActivityLevel(profile.user_activity_level || "");
        setDietaryValues(Array.isArray(profile.dietary_preferences) 
          ? profile.dietary_preferences.join(", ") 
          : "");
        setAllergies(Array.isArray(profile.allergies) 
          ? profile.allergies.join(", ") 
          : "");
        
        const beautyProfile = profile.beauty_profile as { skinType?: string; hairType?: string } | null;
        setSkinType(beautyProfile?.skinType || "");
        setHairType(beautyProfile?.hairType || "");
        
        setHealthGoals(Array.isArray(profile.health_goals) 
          ? profile.health_goals.join(", ") 
          : "");
        setLifestyleGoals(Array.isArray(profile.lifestyle_goals) 
          ? profile.lifestyle_goals.join(", ") 
          : "");
        
        setSelectedStore(profile.preferred_retailer_id ? {
          retailer_id: profile.preferred_retailer_id,
          name: profile.preferred_retailer_name || 'Selected Store'
        } : null);
      }
    } catch (error) {
      console.error("Error loading profile:", error);
      navigate('/app');
    }
  };

  const getTimeGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  return (
    <>
      <AuroraBackground vertical="food" />
      
      <UniversalShell className="overflow-x-hidden">
        {/* Simplified Header */}
        <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-secondary/10">
          <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
            <h1 className="text-lg font-medium text-secondary">My Account</h1>
            <Button variant="ghost" size="icon" onClick={() => navigate('/app')}>
              <X className="w-5 h-5" />
            </Button>
          </div>
        </header>

        <div className="max-w-3xl mx-auto px-4 py-6 space-y-6 pb-32">
          {/* 1. Greeting Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={kaevaTransition}
          >
            <p className="text-2xl text-muted-foreground">{getTimeGreeting()},</p>
            <p className="text-3xl font-semibold text-secondary">{userName || "User"}</p>
          </motion.div>

          {/* 2. Quick Action Cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...kaevaTransition, delay: 0.1 }}
            className="grid grid-cols-3 gap-3"
          >
            <QuickActionCard 
              icon={User}
              label="My Profile"
              onClick={() => setProfileSheetOpen(true)}
            />
            <QuickActionCard 
              icon={Users}
              label="Household"
              onClick={() => navigate('/household')}
            />
            <QuickActionCard 
              icon={BarChart3}
              label="Analytics"
              onClick={() => navigate('/analytics')}
            />
          </motion.div>

          {/* 3. Settings List */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...kaevaTransition, delay: 0.2 }}
            className="glass-card rounded-3xl overflow-hidden divide-y divide-secondary/10"
          >
            <SettingsRow 
              icon={Leaf}
              title="Dietary Preferences"
              description="Food values and allergies"
              onClick={() => setDietarySheetOpen(true)}
            />
            <SettingsRow 
              icon={Sparkles}
              title="Beauty Profile"
              description="Skin and hair preferences"
              onClick={() => setBeautySheetOpen(true)}
            />
            <SettingsRow 
              icon={Store}
              title="Preferred Store"
              description={selectedStore?.name || "Select your store"}
              onClick={() => setStoreSelectorOpen(true)}
            />
            <SettingsRow 
              icon={Heart}
              title="Health & Lifestyle Goals"
              description="Your wellness objectives"
              onClick={() => setGoalsSheetOpen(true)}
            />
            <SettingsRow 
              icon={Package}
              title="Inventory"
              description="View and manage your items"
              onClick={() => navigate('/inventory')}
            />
            <SettingsRow 
              icon={ChefHat}
              title="Recipe Book"
              description="Your saved recipes"
              onClick={() => navigate('/recipes')}
            />
          </motion.div>

          {/* 4. Additional Settings */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...kaevaTransition, delay: 0.3 }}
            className="glass-card rounded-3xl overflow-hidden divide-y divide-secondary/10"
          >
            <SettingsRow 
              icon={MessageSquare}
              title="Conversation History"
              description="Past conversations with KAEVA"
              onClick={() => setHistorySheetOpen(true)}
            />
            <SettingsRow 
              icon={Bell}
              title="Notification Settings"
              description="Manage alerts and preferences"
              onClick={() => {
                toast({
                  title: "Feature Coming Soon",
                  description: "Notification settings will be available in a future update",
                });
              }}
            />
            <SettingsRow 
              icon={Shield}
              title="Account & Security"
              description="Password, email, sign out"
              onClick={() => setAccountSheetOpen(true)}
            />
          </motion.div>

          {/* 5. App Info Footer */}
          <div className="text-center py-4">
            <p className="text-xs text-muted-foreground">KAEVA v1.0.0</p>
            <p className="text-xs text-muted-foreground mt-1">Your home, on autopilot</p>
          </div>
        </div>

        {/* All Sheet Components */}
        <ProfileEditSheet 
          open={profileSheetOpen}
          onClose={() => setProfileSheetOpen(false)}
          userId={userId}
          currentName={userName}
          currentAge={userAge}
          currentWeight={userWeight}
          currentHeight={userHeight}
          currentGender={userGender}
          currentActivityLevel={userActivityLevel}
          onSave={loadProfile}
        />
        
        <DietarySheet 
          open={dietarySheetOpen}
          onClose={() => setDietarySheetOpen(false)}
          userId={userId}
          currentDietaryValues={dietaryValues}
          currentAllergies={allergies}
          onSave={loadProfile}
        />
        
        <BeautySheet 
          open={beautySheetOpen}
          onClose={() => setBeautySheetOpen(false)}
          userId={userId}
          currentSkinType={skinType}
          currentHairType={hairType}
          onSave={loadProfile}
        />
        
        <GoalsSheet 
          open={goalsSheetOpen}
          onClose={() => setGoalsSheetOpen(false)}
          userId={userId}
          currentHealthGoals={healthGoals}
          currentLifestyleGoals={lifestyleGoals}
          onSave={loadProfile}
        />
        
        <AccountSheet 
          open={accountSheetOpen}
          onClose={() => setAccountSheetOpen(false)}
          userEmail={userEmail}
        />
        
        <ConversationHistorySheet 
          open={historySheetOpen}
          onClose={() => setHistorySheetOpen(false)}
        />

        <StoreSelector
          open={storeSelectorOpen}
          onClose={() => setStoreSelectorOpen(false)}
          userId={userId}
          onStoreSelected={(retailer) => {
            setSelectedStore({
              retailer_id: retailer.retailer_key,
              name: retailer.name
            });
            loadProfile();
          }}
        />
      </UniversalShell>
    </>
  );
};

export default Settings;
