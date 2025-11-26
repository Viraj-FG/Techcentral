import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { 
  User, Users, Heart, Sparkles, Store, BarChart3, 
  Leaf, MessageSquare, Bell, Shield, Package, ChefHat, ShieldCheck
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
import { NutritionGoalsSheet } from "@/components/settings/NutritionGoalsSheet";
import { AccountSheet } from "@/components/settings/AccountSheet";
import { ConversationHistorySheet } from "@/components/settings/ConversationHistorySheet";
import { NotificationSettingsSheet } from "@/components/settings/NotificationSettingsSheet";
import { PageHeader } from "@/components/layout/PageHeader";
import { BottomTabBar } from "@/components/layout/BottomTabBar";
import { useSwipeNavigation } from "@/hooks/useSwipeNavigation";
import { PageTransition } from "@/components/layout/PageTransition";
import { checkAdminStatus } from "@/lib/authUtils";
import { useModularOnboarding } from "@/hooks/useModularOnboarding";
import { OnboardingModuleSheet } from "@/components/onboarding/OnboardingModuleSheet";
import type { OnboardingModule } from "@/hooks/useModularOnboarding";
import { CheckCircle2, Circle } from "lucide-react";

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
  const [calorieGoal, setCalorieGoal] = useState<number>(2000);
  const [proteinGoal, setProteinGoal] = useState<number>(150);
  const [carbsGoal, setCarbsGoal] = useState<number>(200);
  const [fatGoal, setFatGoal] = useState<number>(65);
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
  const [nutritionGoalsSheetOpen, setNutritionGoalsSheetOpen] = useState(false);
  const [accountSheetOpen, setAccountSheetOpen] = useState(false);
  const [historySheetOpen, setHistorySheetOpen] = useState(false);
  const [notificationSheetOpen, setNotificationSheetOpen] = useState(false);
  const [storeSelectorOpen, setStoreSelectorOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  
  const { modules, isModuleComplete, completionPercentage } = useModularOnboarding();
  const [showModuleSheet, setShowModuleSheet] = useState<{
    module: OnboardingModule;
    open: boolean;
  } | null>(null);

  // Enable swipe navigation and get swipe state
  const swipeState = useSwipeNavigation();

  useEffect(() => {
    loadProfile();
    checkAdmin();
  }, []);

  const checkAdmin = async () => {
    const adminStatus = await checkAdminStatus();
    setIsAdmin(adminStatus);
  };

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
        
        setCalorieGoal(profile.daily_calorie_goal || 2000);
        setProteinGoal(profile.daily_protein_goal || 150);
        setCarbsGoal(profile.daily_carbs_goal || 200);
        setFatGoal(profile.daily_fat_goal || 65);
        
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
        <PageHeader title="My Account" showHomeButton />

        <PageTransition 
          swipeProgress={swipeState.progress}
          swipeDirection={swipeState.direction}
        >
          <div className="max-w-3xl mx-auto px-4 py-6 space-y-6 pb-24">
          {/* 1. Greeting Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={kaevaTransition}
          >
            <p className="text-2xl text-muted-foreground">{getTimeGreeting()},</p>
            <p className="text-3xl font-semibold text-secondary">{userName || "User"}</p>
          </motion.div>

          {/* 2. Profile Completion Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...kaevaTransition, delay: 0.1 }}
          >
            <h3 className="text-sm font-medium text-muted-foreground mb-3">Profile Completion</h3>
            <div className="glass-card rounded-3xl p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-lg font-semibold text-foreground">
                  {completionPercentage()}% Complete
                </span>
                <div className="h-2 flex-1 ml-4 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary transition-all duration-500"
                    style={{ width: `${completionPercentage()}%` }}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                {[
                  { module: 'core' as OnboardingModule, label: 'Core Profile', icon: User },
                  { module: 'nutrition' as OnboardingModule, label: 'Nutrition', icon: Heart },
                  { module: 'pantry' as OnboardingModule, label: 'Pantry', icon: Store },
                  { module: 'beauty' as OnboardingModule, label: 'Beauty', icon: Sparkles },
                  { module: 'pets' as OnboardingModule, label: 'Pets', icon: Heart },
                  { module: 'household' as OnboardingModule, label: 'Household', icon: Users },
                ].map(({ module, label, icon: Icon }) => {
                  const complete = isModuleComplete(module);
                  return (
                    <button
                      key={module}
                      onClick={() => setShowModuleSheet({ module, open: true })}
                      className="flex items-center gap-3 p-3 rounded-2xl bg-background/50 border border-border/50 hover:border-primary/50 transition-all"
                    >
                      {complete ? (
                        <CheckCircle2 className="w-5 h-5 text-secondary" />
                      ) : (
                        <Circle className="w-5 h-5 text-muted-foreground" />
                      )}
                      <Icon className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm text-foreground">{label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </motion.div>

          {/* 3. Quick Action Cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...kaevaTransition, delay: 0.15 }}
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

          {/* 4. Settings List */}
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
              icon={Heart}
              title="Nutrition Goals"
              description="Daily calorie and macro targets"
              onClick={() => setNutritionGoalsSheetOpen(true)}
            />
            <SettingsRow 
              icon={Sparkles}
              title="Beauty Profile"
              description="Skin and hair preferences"
              onClick={() => setBeautySheetOpen(true)}
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

          {/* 5. Additional Settings */}
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
              onClick={() => setNotificationSheetOpen(true)}
            />
            <SettingsRow 
              icon={Shield}
              title="Account & Security"
              description="Password, email, sign out"
              onClick={() => setAccountSheetOpen(true)}
            />
            {isAdmin && (
              <SettingsRow 
                icon={ShieldCheck}
                title="Admin Dashboard"
                description="System management & monitoring"
                onClick={() => navigate('/admin')}
                iconColor="text-primary"
              />
            )}
          </motion.div>

          {/* 6. App Info Footer */}
          <div className="text-center py-4">
            <p className="text-xs text-muted-foreground">KAEVA v1.0.0</p>
            <p className="text-xs text-muted-foreground mt-1">Your home, on autopilot</p>
          </div>
        </div>
        </PageTransition>

        {showModuleSheet && (
          <OnboardingModuleSheet
            open={showModuleSheet.open}
            module={showModuleSheet.module}
            onClose={() => setShowModuleSheet(null)}
            onComplete={() => {
              // Reload profile to refresh module completion state
              loadProfile();
            }}
          />
        )}

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

        <NutritionGoalsSheet
          open={nutritionGoalsSheetOpen}
          onOpenChange={setNutritionGoalsSheetOpen}
          currentGoals={{
            daily_calorie_goal: calorieGoal,
            daily_protein_goal: proteinGoal,
            daily_carbs_goal: carbsGoal,
            daily_fat_goal: fatGoal,
          }}
          userId={userId}
        />

        <NotificationSettingsSheet
          open={notificationSheetOpen}
          onClose={() => setNotificationSheetOpen(false)}
          userId={userId}
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
        
        <BottomTabBar />
      </UniversalShell>
    </>
  );
};

export default Settings;
