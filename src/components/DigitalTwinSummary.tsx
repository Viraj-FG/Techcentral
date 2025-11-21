import { motion, useAnimation } from "framer-motion";

interface UserProfile {
  language: string;
  dietaryRestrictions: {
    values: string[];
    allergies: string[];
  };
  skinProfile: string[];
  household: {
    adults: number;
    kids: number;
    dogs: number;
    cats: number;
  };
  missions: {
    medical: string[];
    lifestyle: string[];
  };
  internalFlags: {
    enableToxicFoodWarnings: boolean;
  };
}

interface DigitalTwinSummaryProps {
  profile: UserProfile;
  onComplete: () => void;
}

const springTransition = {
  type: "spring" as const,
  stiffness: 100,
  damping: 20
};

const DigitalTwinSummary = ({ profile, onComplete }: DigitalTwinSummaryProps) => {
  const controls = useAnimation();

  const handleEnterKaeva = async () => {
    const dataToSave = {
      ...profile,
      onboardingCompletedAt: new Date().toISOString()
    };
    
    localStorage.setItem("kaeva_user_profile", JSON.stringify(dataToSave));
    localStorage.setItem("kaeva_onboarding_complete", "true");

    await controls.start({
      scale: 1.5,
      opacity: 0,
      filter: "blur(40px)",
      transition: { duration: 0.8, ease: "easeInOut" }
    });

    onComplete();
  };

  const ProfileItem = ({ label, value }: { label: string; value: string }) => (
    <div className="glass-card p-4">
      <div className="text-xs text-kaeva-slate-400 tracking-wide mb-1">{label}</div>
      <div className="text-sm text-kaeva-sage tracking-wide">{value || "None"}</div>
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={controls}
      className="glass-card p-8 max-w-2xl mx-auto"
    >
      <div className="text-center mb-8 space-y-2">
        <h2 className="text-3xl sm:text-4xl tracking-premium text-kaeva-sage">
          PROFILE GENERATED
        </h2>
        <div className="w-32 h-0.5 bg-kaeva-sage mx-auto" />
        <p className="text-sm text-kaeva-slate-400 tracking-wide">
          All systems calibrated
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <ProfileItem 
          label="Language" 
          value={profile.language} 
        />
        <ProfileItem 
          label="Dietary Focus" 
          value={profile.dietaryRestrictions.values.join(", ")} 
        />
        <ProfileItem 
          label="Allergies" 
          value={profile.dietaryRestrictions.allergies.join(", ")} 
        />
        <ProfileItem 
          label="Skin Profile" 
          value={profile.skinProfile.join(", ")} 
        />
        <ProfileItem 
          label="Household" 
          value={`${profile.household.adults}A ${profile.household.kids}K ${profile.household.dogs}D ${profile.household.cats}C`} 
        />
        <ProfileItem 
          label="Medical Goals" 
          value={profile.missions.medical.join(", ")} 
        />
        <ProfileItem 
          label="Lifestyle" 
          value={profile.missions.lifestyle.join(", ")} 
        />
      </div>

      {profile.internalFlags.enableToxicFoodWarnings && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mb-6 text-center text-xs text-kaeva-teal tracking-wide"
        >
          🛡️ Canine safety protocols active
        </motion.div>
      )}

      <motion.button
        onClick={handleEnterKaeva}
        className="w-full py-4 bg-kaeva-sage/20 border border-kaeva-sage rounded-full
                   hover:bg-kaeva-sage/30 transition-all tracking-wider text-kaeva-sage"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        transition={springTransition}
      >
        ENTER KAEVA
      </motion.button>
    </motion.div>
  );
};

export default DigitalTwinSummary;
