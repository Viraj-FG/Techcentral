import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "./ui/button";
import { Mic, Volume2, AlertCircle } from "lucide-react";
import KaevaAperture from "./KaevaAperture";
import AuroraBackground from "./AuroraBackground";

interface PermissionRequestProps {
  onPermissionsGranted: () => void;
}

const PermissionRequest = ({ onPermissionsGranted }: PermissionRequestProps) => {
  const [isRequesting, setIsRequesting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requestPermissions = async () => {
    setIsRequesting(true);
    setError(null);

    try {
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          sampleRate: 24000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      
      // Stop the test stream immediately after permission is granted
      stream.getTracks().forEach(track => track.stop());

      // Check if audio playback is available
      const audioContext = new AudioContext();
      await audioContext.resume();
      audioContext.close();

      // All permissions granted
      onPermissionsGranted();
    } catch (err) {
      console.error("Permission error:", err);
      setError(
        "We need microphone and speaker access to have a conversation with you. Please enable these permissions in your browser settings and try again."
      );
      setIsRequesting(false);
    }
  };

  return (
    <div className="min-h-screen bg-kaeva-void relative flex items-center justify-center p-4 sm:p-8">
      <AuroraBackground />
      
      <div className="relative z-10 w-full max-w-2xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center space-y-8"
        >
          {/* Kaeva Aperture */}
          <KaevaAperture state={isRequesting ? "thinking" : "idle"} size="lg" />

          {/* Title */}
          <div className="text-center space-y-4">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-kaeva-slate-100 tracking-tight">
              Audio Permissions Required
            </h1>
            <p className="text-lg sm:text-xl text-kaeva-slate-300 max-w-xl mx-auto">
              Kaeva needs access to your microphone and speakers to communicate with you during the onboarding process.
            </p>
          </div>

          {/* Permission Icons */}
          <div className="flex gap-8 sm:gap-12">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="flex flex-col items-center space-y-3"
            >
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-kaeva-mint/20 flex items-center justify-center">
                <Mic className="w-8 h-8 sm:w-10 sm:h-10 text-kaeva-mint" />
              </div>
              <p className="text-sm text-kaeva-slate-300">Microphone</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="flex flex-col items-center space-y-3"
            >
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-kaeva-cyan/20 flex items-center justify-center">
                <Volume2 className="w-8 h-8 sm:w-10 sm:h-10 text-kaeva-cyan" />
              </div>
              <p className="text-sm text-kaeva-slate-300">Speakers</p>
            </motion.div>
          </div>

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-start gap-3 p-4 rounded-lg bg-red-500/10 border border-red-500/20 max-w-md"
            >
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-200">{error}</p>
            </motion.div>
          )}

          {/* Request Button */}
          <Button
            onClick={requestPermissions}
            disabled={isRequesting}
            size="lg"
            className="bg-kaeva-mint hover:bg-kaeva-mint/90 text-kaeva-void font-semibold px-8 py-6 text-lg"
          >
            {isRequesting ? "Requesting Access..." : "Grant Permissions"}
          </Button>

          {/* Privacy Note */}
          <p className="text-xs text-kaeva-slate-400 text-center max-w-md">
            Your privacy is important. Audio is processed in real-time and not stored permanently.
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default PermissionRequest;
