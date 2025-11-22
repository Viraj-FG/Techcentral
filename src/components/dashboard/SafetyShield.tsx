import { motion } from 'framer-motion';
import { ShieldCheck } from 'lucide-react';
import { kaevaEntranceVariants, kaevaTransition } from '@/hooks/useKaevaMotion';

interface SafetyShieldProps {
  profile: any;
}

const SafetyShield = ({ profile }: SafetyShieldProps) => {
  const getActiveFilters = () => {
    const filters: Array<{ label: string; abbreviation: string }> = [];

    // Dietary values
    if (profile.dietary_preferences && Array.isArray(profile.dietary_preferences)) {
      profile.dietary_preferences.forEach((value: string) => {
        const abbr = value === 'Halal' ? 'H' : value === 'Vegan' ? 'V' : value === 'Vegetarian' ? 'VG' : value.charAt(0).toUpperCase();
        filters.push({ label: value, abbreviation: abbr });
      });
    }

    // Allergies (convert to X-Free format)
    if (profile.allergies && Array.isArray(profile.allergies)) {
      profile.allergies.forEach((allergen: string) => {
        filters.push({ 
          label: `${allergen}-Free`, 
          abbreviation: allergen.charAt(0).toUpperCase() 
        });
      });
    }

    return filters.slice(0, 3); // Show max 3 badges
  };

  const activeFilters = getActiveFilters();

  if (activeFilters.length === 0) {
    return null;
  }

  return (
    <motion.div
      variants={kaevaEntranceVariants}
      initial="hidden"
      animate="visible"
      transition={kaevaTransition}
      className="w-full rounded-2xl bg-slate-800/40 border border-white/5 p-4 flex items-center justify-between backdrop-blur-sm"
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center relative">
          <ShieldCheck size={20} className="text-emerald-400" strokeWidth={1.5} />
          {/* Pulse Effect */}
          <motion.div 
            className="absolute inset-0 rounded-full bg-emerald-400/20"
            animate={{ 
              scale: [1, 1.5, 1],
              opacity: [0.5, 0, 0.5]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        </div>
        <div>
          <h3 className="text-sm font-medium text-slate-200">Values Shield Active</h3>
          <p className="text-xs text-slate-500">
            Scanning for {activeFilters.map(f => f.label).join(' & ')}
          </p>
        </div>
      </div>
      <div className="flex -space-x-2">
        {activeFilters.map((filter, idx) => (
          <div 
            key={idx} 
            className="w-6 h-6 rounded-full bg-slate-700 border border-slate-800 flex items-center justify-center text-[10px] text-slate-400 font-bold"
            title={filter.label}
          >
            {filter.abbreviation}
          </div>
        ))}
      </div>
    </motion.div>
  );
};

export default SafetyShield;
