import { motion } from "framer-motion";
import KaevaAperture from "../KaevaAperture";
import { useToast } from "@/hooks/use-toast";

const FloatingActionButton = () => {
  const { toast } = useToast();

  return (
    <motion.button
      className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 p-4 rounded-full bg-kaeva-void/80 backdrop-blur-sm border-2 border-kaeva-sage/50 shadow-[0_0_30px_rgba(112,224,152,0.3)]"
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: "spring", delay: 0.9 }}
      onClick={() => {
        toast({
          title: "Coming Soon",
          description: "QR scanning feature in development"
        });
      }}
    >
      <KaevaAperture state="idle" size="sm" />
    </motion.button>
  );
};

export default FloatingActionButton;
