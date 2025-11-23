import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useConversation } from "@11labs/react";
import { getSignedUrl } from "@/lib/elevenLabsAudio";
import { supabase } from "@/integrations/supabase/client";
import KaevaAperture from "./KaevaAperture";
import DigitalTwinCard from "./DigitalTwinCard";
import AuroraBackground from "./AuroraBackground";
import PermissionRequest from "./PermissionRequest";
import TutorialOverlay from "./TutorialOverlay";
import { useToast } from "@/hooks/use-toast";
import { Mic, Brain, Volume2, Leaf, PawPrint, Sparkles } from "lucide-react";
import HouseholdMemberCard from "./HouseholdMemberCard";
import { ELEVENLABS_CONFIG } from "@/config/agent";
import { calculateTDEE } from '@/lib/tdeeCalculator';

export interface BiometricData {
  age: number;
  weight: number; // kg
  height: number; // cm
  gender: 'male' | 'female' | 'other';
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
}

export interface HouseholdMember {
  type: 'adult' | 'child' | 'elderly' | 'toddler';
  name?: string;
  ageGroup?: 'infant' | 'toddler' | 'child' | 'teen' | 'adult' | 'elderly';
  age?: number;
  biometrics?: Partial<BiometricData>;
  allergies?: string[];
  dietaryRestrictions?: string[];
  healthConditions?: string[];
}

interface ConversationState {
  // User's own data
  userName: string | null;
  userBiometrics: BiometricData | null;
  dietaryValues: string[];
  allergies: string[];
  
  // Household roster - new detailed system
  householdMembers: HouseholdMember[];
  
  // Legacy fields for backward compatibility
  beautyProfile: {
    skinType: string | null;
    hairType: string | null;
  } | null;
  household: {
    adults: number;
    kids: number;
    dogs: number;
    cats: number;
    petDetails?: string;
  } | null;
  
  healthGoals: string[];
  lifestyleGoals: string[];
  isComplete: boolean;
}
interface VoiceOnboardingProps {
  onComplete: (profile: any) => void;
  onExit?: () => void;
}
type ApertureState = "idle" | "wakeword" | "listening" | "thinking" | "speaking";
const VoiceOnboarding = ({ onComplete, onExit }: VoiceOnboardingProps) => {
  const { toast } = useToast();
  const [showTutorial, setShowTutorial] = useState(() => {
    return !localStorage.getItem("kaeva_tutorial_seen");
  });
  const [permissionsGranted, setPermissionsGranted] = useState(false);
  const [apertureState, setApertureState] = useState<ApertureState>("idle");
  const [isAdmin, setIsAdmin] = useState(false);
  const [userTranscript, setUserTranscript] = useState("");
  const [aiTranscript, setAiTranscript] = useState("");
  const [showSubtitles, setShowSubtitles] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [activeVertical, setActiveVertical] = useState<"food" | "beauty" | "pets" | null>(null);
  const [detectedKeywords, setDetectedKeywords] = useState<string[]>([]);
  const [conversationState, setConversationState] = useState<ConversationState>({
    userName: null,
    userBiometrics: null,
    dietaryValues: [],
    allergies: [],
    householdMembers: [],
    beautyProfile: null,
    household: null,
    healthGoals: [],
    lifestyleGoals: [],
    isComplete: false
  });

  // Ref to track latest state (fixes stale closure in clientTools)
  const stateRef = useRef(conversationState);

  // Sync ref with state updates
  useEffect(() => {
    stateRef.current = conversationState;
  }, [conversationState]);

  // ElevenLabs Conversational AI
  const conversation = useConversation({
    onConnect: () => {
      console.log("ElevenLabs connected");
      setApertureState("listening");
      toast({
        title: "Connected",
        description: "Kaeva is ready to guide you",
      });
    },
    onDisconnect: () => {
      console.log("ElevenLabs disconnected");
      setApertureState("idle");
    },
    onMessage: (message) => {
      console.log("ElevenLabs message:", message);
      
      // Handle user transcripts
      if (message.source === "user") {
        setUserTranscript(message.message || "");
        setShowSubtitles(true);
        setApertureState("thinking");
      }
      
      // Handle assistant responses
      if (message.source === "ai") {
        const text = message.message?.toLowerCase() || "";
        
        // Detect conversation context
        if (text.includes("skin") || text.includes("hair") || text.includes("beauty")) {
          setActiveVertical("beauty");
        } else if (text.includes("pet") || text.includes("dog") || text.includes("cat")) {
          setActiveVertical("pets");
        } else if (text.includes("diet") || text.includes("food") || text.includes("allergy")) {
          setActiveVertical("food");
        }
        
        // Detect specific keywords for icon animation
        const keywords = [];
        if (text.includes("vegan")) keywords.push("vegan");
        if (text.includes("halal")) keywords.push("halal");
        if (text.includes("dog")) keywords.push("dog");
        if (text.includes("cat")) keywords.push("cat");
        if (text.includes("skin") || text.includes("hair")) keywords.push("beauty");
        setDetectedKeywords(keywords);
        
        setAiTranscript(message.message || "");
        setShowSubtitles(true);
      }
    },
    onError: (error) => {
      console.error("ElevenLabs error:", error);
      toast({
        title: "Connection Error",
        description: "Failed to connect to voice service",
        variant: "destructive"
      });
    },
    clientTools: {
      updateProfile: (parameters: { field: string; value: any }) => {
        console.log("✅ Profile field update:", parameters.field, parameters.value);
        
        // Handle biometrics with TDEE calculation
        if (parameters.field === 'userBiometrics') {
          const tdee = calculateTDEE(parameters.value);
          setConversationState(prev => ({
            ...prev,
            userBiometrics: { ...parameters.value, calculatedTDEE: tdee }
          }));
          return `Biometrics saved. Your baseline is ${tdee} calories per day.`;
        }
        
        // Handle household members
        if (parameters.field === 'householdMembers') {
          setConversationState(prev => ({
            ...prev,
            householdMembers: parameters.value
          }));
          return `Household roster updated. ${parameters.value.length} members registered.`;
        }
        
        // Standard field update
        setConversationState(prev => ({
          ...prev,
          [parameters.field]: parameters.value
        }));
        return "Profile updated";
      },
      completeConversation: async (parameters: { reason: string }) => {
        const logError = async (step: string, error: any, data?: any) => {
          const { data: { user } } = await supabase.auth.getUser();
          const errorLog = {
            timestamp: new Date().toISOString(),
            step,
            error: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
            data,
            userId: user?.id
          };
          console.error(`❌ ONBOARDING ERROR [${step}]:`, errorLog);
          
          // Save to conversation_history for admin viewing
          const { error: logInsertError } = await supabase.from('conversation_history').insert({
            user_id: user?.id || 'unknown',
            conversation_id: crypto.randomUUID(),
            role: 'system',
            message: `[${step}] ${errorLog.error}`,
            metadata: errorLog
          });
          
          if (logInsertError) {
            console.error("Failed to log error to DB:", logInsertError);
          }
        };

        console.log("🎉 Step 1: Completing onboarding:", parameters.reason);
        
        try {
          // Stop ElevenLabs session
          if (conversation.status === "connected") {
            console.log("💾 Step 2: Ending ElevenLabs session");
            await conversation.endSession();
            console.log("✅ Step 2: Session ended");
          }
          
          // Clean up UI state
          console.log("💾 Step 3: Cleaning up UI state");
          setApertureState("idle");
          setShowSubtitles(false);
          setUserTranscript("");
          setAiTranscript("");
          console.log("✅ Step 3: UI cleaned");
          
          // Use REF to get latest state (fixes stale closure)
          const currentState = stateRef.current;
          console.log("💾 Step 4: Retrieved state from ref:", JSON.stringify(currentState, null, 2));
          
          // Save to database with current state
          console.log("💾 Step 5: Calling saveOnboardingData");
          const saveSuccess = await saveOnboardingData(currentState);
          console.log(`✅ Step 5: Save result: ${saveSuccess}`);
          
          if (saveSuccess) {
            console.log("💾 Step 6: Building profile object");
            
            // Build profile object using current state
            const transformedData = transformProfileData(currentState);
            const { data: { session } } = await supabase.auth.getSession();
            
            const profile = {
              id: session?.user?.id,
              language: "English",
              userName: transformedData.user_name,
              dietaryRestrictions: transformedData.dietary_preferences,
              allergies: transformedData.allergies,
              beautyProfile: transformedData.beauty_profile,
              household: currentState.household,
              medicalGoals: transformedData.health_goals,
              lifestyleGoals: transformedData.lifestyle_goals,
              enableToxicFoodWarnings: (currentState.household?.dogs || 0) > 0 || 
                                       (currentState.household?.cats || 0) > 0,
              onboarding_completed: true
            };
            console.log("✅ Step 6: Profile built:", profile);
            
            // Auto-navigate after delay
            console.log("💾 Step 7: Scheduling navigation");
            setTimeout(() => {
              onComplete(profile);
            }, 1500);
            
            console.log("✅ ALL STEPS COMPLETED SUCCESSFULLY");
            return "SUCCESS: Onboarding complete, navigating to dashboard";
          } else {
            await logError("save-failed", new Error("saveOnboardingData returned false"), currentState);
            setShowSummary(true);
            return "ERROR: Failed to save profile, please review and try again";
          }
        } catch (error) {
          await logError("completeConversation-catch", error, stateRef.current);
          return `ERROR: ${error instanceof Error ? error.message : "Unknown error"}`;
        }
      }
    }
  });

  // Track speaking state
  useEffect(() => {
    if (conversation.isSpeaking) {
      setApertureState("speaking");
    } else if (conversation.status === "connected") {
      setApertureState("listening");
    }
  }, [conversation.isSpeaking, conversation.status]);

  // Fetch permission status and check admin on mount
  useEffect(() => {
    const fetchPermissionStatus = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      // Check admin status
      const { data: adminData } = await supabase.functions.invoke("check-admin", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (adminData?.isAdmin) {
        setIsAdmin(true);
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('permissions_granted')
        .eq('id', session.user.id)
        .single();

      if (profile?.permissions_granted) {
        console.log("✅ Permissions already granted, skipping request");
        setPermissionsGranted(true);
      }
    };

    fetchPermissionStatus();
  }, []);

  // Initialize ElevenLabs conversation
  useEffect(() => {
    if (!permissionsGranted) return;

    const initConversation = async () => {
      try {
        setApertureState("thinking");
        
        const agentId = ELEVENLABS_CONFIG.agentId;
        
        console.log("Getting signed URL...");
        const signedUrl = await getSignedUrl(agentId);
        
        console.log("Starting conversation...");
        await conversation.startSession({ signedUrl });
      } catch (error) {
        console.error("Error starting conversation:", error);
        setApertureState("idle");
        toast({
          title: "Connection Error",
          description: "Failed to start conversation. Please try again.",
          variant: "destructive"
        });
      }
    };

    initConversation();

    return () => {
      // Cleanup: ensure ElevenLabs is disconnected when component unmounts
      if (conversation.status === "connected") {
        console.log("🧹 Cleanup: Disconnecting ElevenLabs on unmount");
        conversation.endSession();
      }
    };
  }, [permissionsGranted]);
  const handleProfileUpdate = () => {
    setShowSummary(false);
    setConversationState(prev => ({
      ...prev,
      isComplete: false
    }));
    setApertureState("listening");
  };

  const handlePermissionsGranted = async () => {
    console.log('📋 handlePermissionsGranted called');
    
    try {
      setPermissionsGranted(true);
      console.log('✅ permissionsGranted state set to true');
      
      // Save to database
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        console.log('👤 User session found, saving to database...');
        const { error } = await supabase
          .from('profiles')
          .update({ permissions_granted: true })
          .eq('id', session.user.id);

        if (error) {
          console.error("❌ Failed to save permissions:", error);
          // Don't block transition - permissions are already granted locally
        } else {
          console.log("✅ Permissions saved to database");
        }
      } else {
        console.warn('⚠️ No session found, skipping database save');
      }
      
      console.log('🎬 Transition to voice onboarding should happen now');
    } catch (err) {
      console.error('❌ handlePermissionsGranted error:', err);
      // Still set permissions granted - don't block user
      setPermissionsGranted(true);
    }
  };

  const transformProfileData = (state: ConversationState) => {
    // Use top-level import (no require)
    
    // Ensure dietary values is an array
    const dietaryPreferences = Array.isArray(state.dietaryValues) 
      ? state.dietaryValues 
      : [];

    // Ensure allergies is an array  
    const allergies = Array.isArray(state.allergies)
      ? state.allergies
      : [];

    // Ensure health goals is an array
    const healthGoals = Array.isArray(state.healthGoals)
      ? state.healthGoals
      : [];

    // Ensure lifestyle goals is an array
    const lifestyleGoals = Array.isArray(state.lifestyleGoals)
      ? state.lifestyleGoals
      : [];

    // Ensure beauty profile is a proper object
    const beautyProfile = state.beautyProfile || { skinType: null, hairType: null };

    return {
      user_name: state.userName || null,
      
      // New biometric fields
      user_age: state.userBiometrics?.age || null,
      user_weight: state.userBiometrics?.weight || null,
      user_height: state.userBiometrics?.height || null,
      user_gender: state.userBiometrics?.gender || null,
      user_activity_level: state.userBiometrics?.activityLevel || null,
      calculated_tdee: state.userBiometrics ? calculateTDEE(state.userBiometrics) : null,
      
      dietary_preferences: dietaryPreferences,
      allergies: allergies,
      beauty_profile: beautyProfile,
      health_goals: healthGoals,
      lifestyle_goals: lifestyleGoals,
      
      // Calculate household size from both old and new systems
      household_adults: state.household?.adults || 
        state.householdMembers?.filter(m => m.type === 'adult').length || 1,
      household_kids: state.household?.kids || 
        state.householdMembers?.filter(m => m.type === 'child' || m.type === 'toddler').length || 0,
      
      onboarding_completed: true
    };
  };

  const saveOnboardingData = async (state?: ConversationState): Promise<boolean> => {
    const logStep = async (step: string, error: any, data?: any) => {
      const { data: { user } } = await supabase.auth.getUser();
      const errorLog = {
        timestamp: new Date().toISOString(),
        step,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        data,
        userId: user?.id
      };
      console.error(`❌ SAVE ERROR [${step}]:`, errorLog);
      
      const { error: logInsertError } = await supabase.from('conversation_history').insert({
        user_id: user?.id || 'unknown',
        conversation_id: crypto.randomUUID(),
        role: 'system',
        message: `[${step}] ${errorLog.error}`,
        metadata: errorLog
      });
      
      if (logInsertError) {
        console.error("Failed to log error to DB:", logInsertError);
      }
    };

    console.log("💾 SAVE Step 1: Starting database save...");
    
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      await logStep("auth-check", new Error("No authenticated user"), null);
      toast({
        title: "Error",
        description: "Not authenticated",
        variant: "destructive"
      });
      return false;
    }
    console.log("✅ SAVE Step 1: User authenticated:", session.user.id);

    const userId = session.user.id;

    try {
      // Use provided state OR fall back to ref (for manual retry)
      const currentState = state || stateRef.current;
      
      // Log raw state
      console.log("💾 SAVE Step 2: Raw conversationState:", JSON.stringify(currentState, null, 2));
      
      // Transform data
      console.log("💾 SAVE Step 3: Transforming profile data");
      const transformedData = transformProfileData(currentState);
      console.log("✅ SAVE Step 3: Transformed data:", JSON.stringify(transformedData, null, 2));

      // Update profile
      console.log("💾 SAVE Step 4: Updating profile in database");
      const { error: profileError } = await supabase
        .from('profiles')
        .update(transformedData)
        .eq('id', userId);

      if (profileError) {
        await logStep("profile-update", profileError, { transformedData, userId });
        toast({
          title: "Error",
          description: `Failed to save profile: ${profileError.message}`,
          variant: "destructive"
        });
        return false;
      }

      console.log("✅ SAVE Step 4: Profile saved successfully");

      // Save household members
      if (currentState.householdMembers && currentState.householdMembers.length > 0) {
        console.log(`💾 SAVE Step 5: Preparing ${currentState.householdMembers.length} household members`);
        const membersToInsert = currentState.householdMembers.map(member => ({
          user_id: userId,
          member_type: member.type,
          name: member.name || null,
          age: member.age || null,
          age_group: member.ageGroup || null,
          weight: member.biometrics?.weight || null,
          height: member.biometrics?.height || null,
          gender: member.biometrics?.gender || null,
          activity_level: member.biometrics?.activityLevel || null,
          dietary_restrictions: member.dietaryRestrictions || [],
          allergies: member.allergies || [],
          health_conditions: member.healthConditions || []
        }));
        console.log("✅ SAVE Step 5: Members prepared:", membersToInsert);

        console.log("💾 SAVE Step 6: Inserting household members");
        const { error: membersError } = await supabase
          .from('household_members')
          .insert(membersToInsert);

        if (membersError) {
          await logStep("household-insert", membersError, { membersToInsert, userId });
        } else {
          console.log(`✅ SAVE Step 6: Saved ${membersToInsert.length} household members`);
        }
      } else {
        console.log("ℹ️ SAVE Step 5-6: No household members to save");
      }

      // Save pets (legacy support)
      if (currentState.household?.dogs || currentState.household?.cats) {
        const pets = [];

        for (let i = 0; i < (currentState.household.dogs || 0); i++) {
          pets.push({
            user_id: userId,
            species: 'Dog',
            name: `Dog ${i + 1}`,
            toxic_flags_enabled: true
          });
        }

        for (let i = 0; i < (currentState.household.cats || 0); i++) {
          pets.push({
            user_id: userId,
            species: 'Cat',
            name: `Cat ${i + 1}`,
            toxic_flags_enabled: true
          });
        }

        if (pets.length > 0) {
          const { error: petsError } = await supabase.from('pets').insert(pets);
          if (petsError) {
            console.error("❌ Pets insert error:", petsError);
          } else {
            console.log(`✅ Saved ${pets.length} pets`);
          }
        }
      }

      return true;
    } catch (error) {
      console.error("❌ Error saving onboarding data:", error);
      toast({
        title: "Error",
        description: "Failed to complete onboarding",
        variant: "destructive"
      });
      return false;
    }
  };

  const handleEnterKaeva = async () => {
    // This function is now for manual retry only
    const currentState = stateRef.current;
    const success = await saveOnboardingData(currentState);
    
    if (success) {
      const transformedData = transformProfileData(currentState);
      const { data: { session } } = await supabase.auth.getSession();
      
      const profile = {
        id: session?.user?.id,
        language: "English",
        userName: transformedData.user_name,
        dietaryRestrictions: transformedData.dietary_preferences,
        allergies: transformedData.allergies,
        beautyProfile: transformedData.beauty_profile,
        household: currentState.household,
        medicalGoals: transformedData.health_goals,
        lifestyleGoals: transformedData.lifestyle_goals,
        enableToxicFoodWarnings: (currentState.household?.dogs || 0) > 0 || 
                                 (currentState.household?.cats || 0) > 0,
        onboarding_completed: true
      };
      
      console.log("🎉 Calling onComplete with profile");
      onComplete(profile);
    }
  };

  const handleDismissTutorial = () => {
    setShowTutorial(false);
    localStorage.setItem("kaeva_tutorial_seen", "true");
  };

  if (showTutorial) {
    return <TutorialOverlay isOpen={showTutorial} onDismiss={handleDismissTutorial} />;
  }

  if (!permissionsGranted) {
    return <PermissionRequest onPermissionsGranted={handlePermissionsGranted} />;
  }

  return <motion.div initial={{
    opacity: 0
  }} animate={{
    opacity: 1
  }} exit={{
    opacity: 0
  }} className="fixed inset-0 bg-kaeva-void overflow-hidden">
      {/* Admin Exit Button */}
      {isAdmin && onExit && (
        <motion.button
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => {
            // Clean up ElevenLabs session
            if (conversation.status === "connected") {
              console.log("🔌 Admin exit: Disconnecting ElevenLabs");
              conversation.endSession();
            }
            onExit();
          }}
          className="absolute top-4 right-4 z-50 px-4 py-2 bg-destructive/20 hover:bg-destructive/30 border border-destructive/50 rounded-lg text-destructive text-sm font-medium transition-colors backdrop-blur-sm"
        >
          Exit to Dashboard
        </motion.button>
      )}

      <AuroraBackground vertical={activeVertical} />

      <div className="relative z-10 h-full flex flex-col items-center justify-center">
        <AnimatePresence mode="wait">
          {!showSummary ? <motion.div key="conversation" initial={{
          scale: 0.8,
          opacity: 0
        }} animate={{
          scale: 1,
          opacity: 1
        }} exit={{
          scale: 0.8,
          opacity: 0
        }} className="flex flex-col items-center">
              <KaevaAperture 
                state={apertureState} 
                size="lg" 
                audioElement={null}
                isDetectingSound={false}
              />

              {/* Household Member Cards */}
              <AnimatePresence>
                {conversationState.householdMembers.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="mt-8 max-w-2xl w-full space-y-3 px-4"
                  >
                    <div className="text-center text-sm text-kaeva-sage/70 mb-4">
                      Your Household Roster
                    </div>
                    {conversationState.householdMembers.map((member, idx) => (
                      <HouseholdMemberCard key={idx} member={member} index={idx} />
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Keyword Icon Feedback */}
              <AnimatePresence>
                {detectedKeywords.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="mt-8 flex gap-4"
                  >
                    {detectedKeywords.includes("vegan") && (
                      <motion.div
                        animate={{ 
                          scale: [1, 1.2, 1],
                          rotate: [0, 5, -5, 0]
                        }}
                        transition={{ duration: 0.6 }}
                        className="p-3 rounded-full bg-emerald-400/20 backdrop-blur-sm border border-emerald-400/30"
                      >
                        <Leaf className="w-6 h-6 text-emerald-400" strokeWidth={1.5} />
                      </motion.div>
                    )}
                    {(detectedKeywords.includes("dog") || detectedKeywords.includes("cat")) && (
                      <motion.div
                        animate={{ 
                          scale: [1, 1.2, 1],
                          rotate: [0, 5, -5, 0]
                        }}
                        transition={{ duration: 0.6 }}
                        className="p-3 rounded-full bg-sky-400/20 backdrop-blur-sm border border-sky-400/30"
                      >
                        <PawPrint className="w-6 h-6 text-sky-400" strokeWidth={1.5} />
                      </motion.div>
                    )}
                    {detectedKeywords.includes("beauty") && (
                      <motion.div
                        animate={{ 
                          scale: [1, 1.2, 1],
                          rotate: [0, 5, -5, 0]
                        }}
                        transition={{ duration: 0.6 }}
                        className="p-3 rounded-full bg-orange-400/20 backdrop-blur-sm border border-orange-400/30"
                      >
                        <Sparkles className="w-6 h-6 text-orange-400" strokeWidth={1.5} />
                      </motion.div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              <AnimatePresence mode="wait">
                {apertureState === "listening" && (
                  <motion.div
                    key="listening"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="mt-6 sm:mt-8 flex flex-col items-center gap-2"
                  >
                    <motion.div
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="p-3 rounded-full bg-primary/20"
                    >
                      <Mic className="w-5 h-5 text-primary" />
                    </motion.div>
                    <p className="text-primary text-xs sm:text-sm tracking-widest font-medium">
                      LISTENING
                    </p>
                    <p className="text-muted-foreground text-xs">Speak now...</p>
                  </motion.div>
                )}
                
                {apertureState === "thinking" && (
                  <motion.div
                    key="thinking"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="mt-6 sm:mt-8 flex flex-col items-center gap-2"
                  >
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      className="p-3 rounded-full bg-accent/20"
                    >
                      <Brain className="w-5 h-5 text-accent" />
                    </motion.div>
                    <p className="text-accent text-xs sm:text-sm tracking-widest font-medium">
                      PROCESSING
                    </p>
                    <p className="text-muted-foreground text-xs">Analyzing your response...</p>
                  </motion.div>
                )}
                
                {apertureState === "speaking" && (
                  <motion.div
                    key="speaking"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="mt-6 sm:mt-8 flex flex-col items-center gap-2"
                  >
                    <motion.div
                      animate={{ scale: [1, 1.15, 1] }}
                      transition={{ duration: 0.8, repeat: Infinity }}
                      className="p-3 rounded-full bg-secondary/20"
                    >
                      <Volume2 className="w-5 h-5 text-secondary-foreground" />
                    </motion.div>
                    <p className="text-secondary-foreground text-xs sm:text-sm tracking-widest font-medium">
                      SPEAKING
                    </p>
                    <p className="text-muted-foreground text-xs">Kaeva is responding...</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div> : <DigitalTwinCard key="summary" profile={conversationState} onUpdate={handleProfileUpdate} onComplete={handleEnterKaeva} />}
        </AnimatePresence>
      </div>
    </motion.div>;
};
export default VoiceOnboarding;