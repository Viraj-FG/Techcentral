import { motion } from "framer-motion";

interface ClusterLanguageProps {
  onSelect: (language: string) => void;
  selectedLanguage?: string;
}

const languages = [
  { code: "en", label: "English", flag: "🇺🇸" },
  { code: "es", label: "Español", flag: "🇪🇸" },
  { code: "fr", label: "Français", flag: "🇫🇷" },
  { code: "hi", label: "हिन्दी", flag: "🇮🇳" },
  { code: "zh", label: "中文", flag: "🇨🇳" },
  { code: "ar", label: "العربية", flag: "🇸🇦" },
  { code: "de", label: "Deutsch", flag: "🇩🇪" },
  { code: "ja", label: "日本語", flag: "🇯🇵" }
];

const springTransition = {
  type: "spring" as const,
  stiffness: 100,
  damping: 20
};

const ClusterLanguage = ({ onSelect, selectedLanguage }: ClusterLanguageProps) => {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl sm:text-3xl tracking-premium text-kaeva-sage">
          SELECT YOUR LANGUAGE
        </h2>
        <div className="w-32 h-0.5 bg-kaeva-sage/50 mx-auto" />
      </div>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {languages.map((lang) => (
          <motion.button
            key={lang.code}
            onClick={() => onSelect(lang.code)}
            className={`glass-chip ${
              selectedLanguage === lang.code ? 'glass-chip-active' : ''
            } flex-col py-4`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={springTransition}
          >
            <span className="text-3xl mb-1">{lang.flag}</span>
            <span className="text-sm tracking-wide">{lang.label}</span>
          </motion.button>
        ))}
      </div>
    </div>
  );
};

export default ClusterLanguage;
