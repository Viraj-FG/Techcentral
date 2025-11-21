import { motion } from "framer-motion";
import { User, Shield, Users, Heart, Clock, Award, Leaf, Ban, ShieldAlert } from "lucide-react";
import { Button } from "./ui/button";

interface ProfileData {
  userName: string | null;
  dietaryValues: string[];
  allergies: string[];
  household: {
    adults: number;
    kids: number;
    dogs: number;
    cats: number;
  } | null;
  healthGoals: string[];
  lifestyleGoals: string[];
}

interface DigitalTwinCardProps {
  profile: ProfileData;
  onUpdate: () => void;
  onComplete: () => void;
}

const DigitalTwinCard = ({ profile, onUpdate, onComplete }: DigitalTwinCardProps) => {
  const getDietaryIcon = (value: string) => {
    const normalized = value.toLowerCase();
    if (normalized.includes("halal") || normalized.includes("kosher")) {
      return <Award className="text-emerald-400" strokeWidth={1.5} size={20} />;
    }
    if (normalized.includes("vegan") || normalized.includes("vegetarian")) {
      return <Leaf className="text-emerald-400" strokeWidth={1.5} size={20} />;
    }
    if (normalized.includes("beef")) {
      return <Ban className="text-emerald-400" strokeWidth={1.5} size={20} />;
    }
    return <Shield className="text-emerald-400" strokeWidth={1.5} size={20} />;
  };

  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", duration: 0.6 }}
      className="w-full max-w-2xl mx-4 sm:mx-6 md:mx-8"
    >
      <div className="glass-card p-4 sm:p-6 md:p-8 backdrop-blur-xl bg-white/5 border border-white/10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-center mb-8"
        >
          <h2 className="text-xl sm:text-2xl font-light tracking-wider text-white mb-2">
            Digital Twin Constructed
          </h2>
          <p className="text-emerald-400 text-sm tracking-widest">PROFILE SUMMARY</p>
        </motion.div>

        {/* Profile Grid */}
        <div className="space-y-6 mb-8">
          {/* Name */}
          {profile.userName && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="flex items-center gap-4 p-3 sm:p-4 bg-white/5 rounded-lg border border-white/10"
            >
              <User className="text-emerald-400" strokeWidth={1.5} size={20} />
              <div>
                <p className="text-xs text-emerald-400 uppercase tracking-wider mb-1">Name</p>
                <p className="text-white font-light">{profile.userName}</p>
              </div>
            </motion.div>
          )}

          {/* Dietary Values */}
          {profile.dietaryValues.length > 0 && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="p-3 sm:p-4 bg-white/5 rounded-lg border border-white/10"
            >
              <div className="flex items-center gap-2 mb-3">
                <Shield className="text-emerald-400" strokeWidth={1.5} size={20} />
                <p className="text-xs text-emerald-400 uppercase tracking-wider">Dietary Values</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {profile.dietaryValues.map((value, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-full border border-emerald-400/30"
                  >
                    {getDietaryIcon(value)}
                    <span className="text-white text-sm">{value}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Allergies */}
          {profile.allergies.length > 0 && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.45 }}
              className="p-3 sm:p-4 bg-white/5 rounded-lg border border-white/10"
            >
              <div className="flex items-center gap-2 mb-3">
                <ShieldAlert className="text-emerald-400" strokeWidth={1.5} size={20} />
                <p className="text-xs text-emerald-400 uppercase tracking-wider">Allergies</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {profile.allergies.map((allergy, index) => (
                  <div
                    key={index}
                    className="px-3 py-1.5 bg-red-500/10 rounded-full border border-red-400/30"
                  >
                    <span className="text-red-300 text-sm">{allergy}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Household */}
          {profile.household && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
              className="p-3 sm:p-4 bg-white/5 rounded-lg border border-white/10"
            >
              <div className="flex items-center gap-2 mb-3">
                <Users className="text-emerald-400" strokeWidth={1.5} size={20} />
                <p className="text-xs text-emerald-400 uppercase tracking-wider">Household</p>
              </div>
              <div className="text-white space-y-1">
                {profile.household.adults > 0 && (
                  <p className="text-sm">Adults: {profile.household.adults}</p>
                )}
                {profile.household.kids > 0 && (
                  <p className="text-sm">Children: {profile.household.kids}</p>
                )}
                {profile.household.dogs > 0 && (
                  <p className="text-sm">Dogs: {profile.household.dogs}</p>
                )}
                {profile.household.cats > 0 && (
                  <p className="text-sm">Cats: {profile.household.cats}</p>
                )}
              </div>
            </motion.div>
          )}

          {/* Health Goals */}
          {profile.healthGoals.length > 0 && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.55 }}
              className="p-3 sm:p-4 bg-white/5 rounded-lg border border-white/10"
            >
              <div className="flex items-center gap-2 mb-3">
                <Heart className="text-emerald-400" strokeWidth={1.5} size={20} />
                <p className="text-xs text-emerald-400 uppercase tracking-wider">Health Goals</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {profile.healthGoals.map((goal, index) => (
                  <div
                    key={index}
                    className="px-3 py-1.5 bg-white/5 rounded-full border border-white/10"
                  >
                    <span className="text-white text-sm">{goal}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Lifestyle Goals */}
          {profile.lifestyleGoals.length > 0 && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 }}
              className="p-3 sm:p-4 bg-white/5 rounded-lg border border-white/10"
            >
              <div className="flex items-center gap-2 mb-3">
                <Clock className="text-emerald-400" strokeWidth={1.5} size={20} />
                <p className="text-xs text-emerald-400 uppercase tracking-wider">Lifestyle</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {profile.lifestyleGoals.map((goal, index) => (
                  <div
                    key={index}
                    className="px-3 py-1.5 bg-white/5 rounded-full border border-white/10"
                  >
                    <span className="text-white text-sm">{goal}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </div>

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="flex flex-col sm:flex-row gap-3 sm:gap-4"
        >
          <Button
            onClick={onUpdate}
            variant="outline"
            className="flex-1 min-h-[48px] text-base sm:text-sm border-emerald-400/30 text-emerald-400 hover:bg-emerald-400/10"
          >
            Update Profile
          </Button>
          <Button
            onClick={onComplete}
            className="flex-1 min-h-[48px] text-base sm:text-sm bg-emerald-400 text-kaeva-void hover:bg-emerald-500"
          >
            Enter KAEVA
          </Button>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default DigitalTwinCard;
