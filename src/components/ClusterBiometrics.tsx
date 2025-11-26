import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Activity, User, Ruler, Weight } from "lucide-react";
import { calculateTDEE, BiometricData } from "@/lib/tdeeCalculator";

interface ClusterBiometricsProps {
  onSubmit: (biometrics: BiometricData) => void;
}

const springTransition = {
  type: "spring",
  stiffness: 260,
  damping: 20,
};

const ClusterBiometrics = ({ onSubmit }: ClusterBiometricsProps) => {
  const [age, setAge] = useState(30);
  const [weight, setWeight] = useState(70);
  const [height, setHeight] = useState(170);
  const [gender, setGender] = useState<'male' | 'female' | 'other'>('male');
  const [activityLevel, setActivityLevel] = useState<BiometricData['activityLevel']>('moderate');
  const [calculatedTDEE, setCalculatedTDEE] = useState(0);
  const [useImperial, setUseImperial] = useState(false);

  // Real-time TDEE calculation
  useEffect(() => {
    const tdee = calculateTDEE({ age, weight, height, gender, activityLevel });
    setCalculatedTDEE(tdee);
  }, [age, weight, height, gender, activityLevel]);

  const handleContinue = () => {
    onSubmit({ age, weight, height, gender, activityLevel });
  };

  const Counter = ({ 
    label, 
    value, 
    onChange, 
    min, 
    max, 
    unit,
    icon: Icon 
  }: { 
    label: string; 
    value: number; 
    onChange: (val: number) => void; 
    min: number; 
    max: number; 
    unit: string;
    icon: any;
  }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={springTransition}
      className="glass-card p-6 rounded-2xl"
    >
      <div className="flex items-center gap-3 mb-4">
        <Icon className="w-5 h-5 text-secondary" />
        <span className="text-sm text-secondary/70">{label}</span>
      </div>
      
      <div className="flex items-center justify-between gap-4">
        <button
          onClick={() => onChange(Math.max(min, value - 1))}
          className="glass-button w-12 h-12 rounded-full flex items-center justify-center text-2xl hover:scale-110 transition-transform"
        >
          −
        </button>
        
        <div className="flex-1 text-center">
          <div className="text-4xl font-light text-secondary">{value}</div>
          <div className="text-xs text-secondary/50 mt-1">{unit}</div>
        </div>
        
        <button
          onClick={() => onChange(Math.min(max, value + 1))}
          className="glass-button w-12 h-12 rounded-full flex items-center justify-center text-2xl hover:scale-110 transition-transform"
        >
          +
        </button>
      </div>
    </motion.div>
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen flex flex-col items-center justify-center p-8 relative z-10"
    >
      <div className="max-w-2xl w-full space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-4"
        >
          <h2 className="text-4xl font-light text-secondary">
            Calculating Your Baseline
          </h2>
          <p className="text-secondary/70 text-lg">
            To provide medical-grade nutritional guidance, I need some basic metrics. 
            This data stays encrypted and enables precise recommendations.
          </p>
        </motion.div>

        {/* TDEE Display */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="glass-card p-6 rounded-2xl text-center border-2 border-secondary/20"
        >
          <div className="text-sm text-secondary/70 mb-2">Your Baseline Energy Needs</div>
          <div className="text-5xl font-light text-accent">
            {calculatedTDEE.toLocaleString()}
          </div>
          <div className="text-sm text-secondary/50 mt-1">calories per day</div>
        </motion.div>

        {/* Biometric Inputs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Counter 
            label="Age"
            value={age}
            onChange={setAge}
            min={18}
            max={120}
            unit="years"
            icon={User}
          />
          
          <Counter 
            label="Weight"
            value={weight}
            onChange={setWeight}
            min={30}
            max={300}
            unit={useImperial ? 'lbs' : 'kg'}
            icon={Weight}
          />
          
          <Counter 
            label="Height"
            value={height}
            onChange={setHeight}
            min={100}
            max={250}
            unit={useImperial ? 'in' : 'cm'}
            icon={Ruler}
          />

          {/* Gender Selection */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={springTransition}
            className="glass-card p-6 rounded-2xl"
          >
            <div className="flex items-center gap-3 mb-4">
              <User className="w-5 h-5 text-secondary" />
              <span className="text-sm text-secondary/70">Gender</span>
            </div>
            
            <div className="grid grid-cols-3 gap-2">
              {(['male', 'female', 'other'] as const).map((g) => (
                <button
                  key={g}
                  onClick={() => setGender(g)}
                  className={`px-4 py-2 rounded-full text-sm transition-all ${
                    gender === g
                      ? 'bg-accent text-background'
                      : 'glass-button hover:bg-secondary/10'
                  }`}
                >
                  {g === 'male' ? 'M' : g === 'female' ? 'F' : 'Other'}
                </button>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Activity Level */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-card p-6 rounded-2xl"
        >
          <div className="flex items-center gap-3 mb-6">
            <Activity className="w-5 h-5 text-secondary" />
            <span className="text-sm text-secondary/70">Activity Level</span>
          </div>
          
          <div className="space-y-2">
            {[
              { value: 'sedentary', label: 'Sedentary', desc: 'Little to no exercise' },
              { value: 'light', label: 'Lightly Active', desc: '1-3 days/week' },
              { value: 'moderate', label: 'Moderately Active', desc: '3-5 days/week' },
              { value: 'active', label: 'Very Active', desc: '6-7 days/week' },
              { value: 'very_active', label: 'Extremely Active', desc: 'Physical job + training' }
            ].map((level) => (
              <button
                key={level.value}
                onClick={() => setActivityLevel(level.value as BiometricData['activityLevel'])}
                className={`w-full p-4 rounded-xl text-left transition-all ${
                  activityLevel === level.value
                    ? 'bg-accent/20 border-2 border-accent'
                    : 'glass-button hover:bg-secondary/5'
                }`}
              >
                <div className="font-medium text-secondary">{level.label}</div>
                <div className="text-xs text-secondary/50 mt-1">{level.desc}</div>
              </button>
            ))}
          </div>
        </motion.div>

        {/* Continue Button */}
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          onClick={handleContinue}
          className="w-full glass-button py-4 rounded-full text-lg font-medium text-secondary hover:bg-accent/20 transition-all"
        >
          CONTINUE
        </motion.button>
      </div>
    </motion.div>
  );
};

export default ClusterBiometrics;
