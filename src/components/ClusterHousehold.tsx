import { motion } from "framer-motion";
import { Minus, Plus } from "lucide-react";
import { useState } from "react";

interface ClusterHouseholdProps {
  onSubmit: (data: { adults: number; kids: number; dogs: number; cats: number }) => void;
}

const springTransition = {
  type: "spring" as const,
  stiffness: 100,
  damping: 20
};

const ClusterHousehold = ({ onSubmit }: ClusterHouseholdProps) => {
  const [adults, setAdults] = useState(1);
  const [kids, setKids] = useState(0);
  const [dogs, setDogs] = useState(0);
  const [cats, setCats] = useState(0);

  const handleContinue = () => {
    onSubmit({ adults, kids, dogs, cats });
  };

  const Counter = ({ 
    label, 
    subtitle, 
    value, 
    onChange, 
    min = 0 
  }: { 
    label: string; 
    subtitle: string; 
    value: number; 
    onChange: (v: number) => void; 
    min?: number;
  }) => (
    <div className="glass-card p-6 flex items-center justify-between">
      <div>
        <h3 className="text-lg tracking-wide text-foreground/90">{label}</h3>
        <p className="text-xs text-muted-foreground">{subtitle}</p>
      </div>
      <div className="flex items-center gap-4">
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => onChange(Math.max(min, value - 1))}
          className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center"
          transition={springTransition}
        >
          <Minus className="w-4 h-4 text-secondary" />
        </motion.button>
        <span className="text-2xl font-bold w-12 text-center text-secondary">{value}</span>
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => onChange(value + 1)}
          className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center"
          transition={springTransition}
        >
          <Plus className="w-4 h-4 text-secondary" />
        </motion.button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl sm:text-3xl tracking-premium text-secondary">
          HOUSEHOLD COMPOSITION
        </h2>
        <div className="w-32 h-0.5 bg-secondary/50 mx-auto" />
        <p className="text-sm text-muted-foreground tracking-wide">
          This defines portions and budget
        </p>
      </div>

      <div className="space-y-4">
        <Counter 
          label="Adults" 
          subtitle="Age 18+" 
          value={adults} 
          onChange={setAdults}
          min={1}
        />
        <Counter 
          label="Kids" 
          subtitle="Under 18" 
          value={kids} 
          onChange={setKids}
        />
        <Counter 
          label="Dogs" 
          subtitle="Canine family" 
          value={dogs} 
          onChange={setDogs}
        />
        <Counter 
          label="Cats" 
          subtitle="Feline family" 
          value={cats} 
          onChange={setCats}
        />
      </div>

      {dogs > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-xs text-accent text-center tracking-wide"
        >
          🛡️ Toxic food warnings enabled for canine safety
        </motion.div>
      )}

      <motion.button
        onClick={handleContinue}
        className="w-full py-4 bg-secondary/20 border border-secondary rounded-full
                   hover:bg-secondary/30 transition-all tracking-wider text-secondary"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        transition={springTransition}
      >
        CONTINUE
      </motion.button>
    </div>
  );
};

export default ClusterHousehold;
