import { motion } from "framer-motion";
import { User, Baby, Users, AlertTriangle } from "lucide-react";

export interface HouseholdMember {
  type: 'adult' | 'child' | 'elderly' | 'toddler';
  name?: string;
  ageGroup?: 'infant' | 'toddler' | 'child' | 'teen' | 'adult' | 'elderly';
  age?: number;
  biometrics?: {
    weight?: number;
    height?: number;
    gender?: string;
    activityLevel?: string;
  };
  allergies?: string[];
  dietaryRestrictions?: string[];
  healthConditions?: string[];
}

interface HouseholdMemberCardProps {
  member: HouseholdMember;
  index: number;
}

const HouseholdMemberCard = ({ member, index }: HouseholdMemberCardProps) => {
  const getIcon = () => {
    switch (member.type) {
      case 'elderly':
        return '👵';
      case 'child':
      case 'toddler':
        return '👶';
      case 'adult':
        return '👤';
      default:
        return '👤';
    }
  };

  const hasAlerts = 
    (member.allergies && member.allergies.length > 0) || 
    (member.healthConditions && member.healthConditions.length > 0) ||
    (member.dietaryRestrictions && member.dietaryRestrictions.length > 0);

  return (
    <motion.div
      initial={{ scale: 0, opacity: 0, y: 20 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      transition={{
        type: "spring",
        stiffness: 260,
        damping: 20,
        delay: index * 0.1
      }}
      className="glass-card px-6 py-4 rounded-2xl hover:bg-secondary/5 transition-all overflow-hidden"
    >
      <div className="flex items-center gap-4">
        {/* Avatar */}
        <div className="text-4xl">{getIcon()}</div>
        
        {/* Member Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-lg font-medium text-secondary truncate">
              {member.name || member.type.charAt(0).toUpperCase() + member.type.slice(1)}
            </span>
            {member.age && (
              <span className="text-xs text-secondary/50">Age {member.age}</span>
            )}
          </div>
          
          {/* Tags */}
          <div className="flex flex-wrap gap-2 mt-2">
            {member.dietaryRestrictions?.map((restriction, idx) => (
              <span 
                key={`diet-${idx}`}
                className="text-xs px-2 py-1 rounded-full bg-secondary/10 text-secondary/70"
              >
                {restriction}
              </span>
            ))}
            
            {member.allergies?.map((allergy, idx) => (
              <span 
                key={`allergy-${idx}`}
                className="text-xs px-2 py-1 rounded-full bg-destructive/20 text-destructive flex items-center gap-1"
              >
                <AlertTriangle className="w-3 h-3" />
                {allergy}
              </span>
            ))}
            
            {member.healthConditions?.map((condition, idx) => (
              <span 
                key={`health-${idx}`}
                className="text-xs px-2 py-1 rounded-full bg-accent/20 text-accent"
              >
                {condition}
              </span>
            ))}
          </div>
        </div>

        {/* Alert Badge */}
        {hasAlerts && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3 + index * 0.1 }}
            className="flex-shrink-0"
          >
            <div className="w-8 h-8 rounded-full bg-destructive/20 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4 text-destructive" />
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

export default HouseholdMemberCard;
