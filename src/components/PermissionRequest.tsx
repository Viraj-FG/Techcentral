import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "./ui/button";
import { Mic, Volume2, AlertCircle, TestTube2 } from "lucide-react";
import KaevaAperture from "./KaevaAperture";
import AuroraBackground from "./AuroraBackground";
interface PermissionRequestProps {
  onPermissionsGranted: () => void;
}
const PermissionRequest = ({
  onPermissionsGranted
}: PermissionRequestProps) => {
  const [isRequesting, setIsRequesting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [audioReady, setAudioReady] = useState(false);
  const [isTestingAudio, setIsTestingAudio] = useState(false);
  const playTestBeep = async () => {
    setIsTestingAudio(true);
    try {
      // Get saved volume preference or default to 0.7
      const savedVolume = localStorage.getItem('kaeva_volume');
      const volume = savedVolume ? parseFloat(savedVolume) : 0.7;

      // Create audio context
      const audioContext = new AudioContext();

      // Create oscillator for beep sound (pure tone at 800Hz)
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      // Configure the beep
      oscillator.frequency.value = 800; // 800Hz tone
      oscillator.type = 'sine'; // Pure sine wave

      // Set volume and create a fade in/out envelope
      gainNode.gain.setValueAtTime(0, audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(volume * 0.3, audioContext.currentTime + 0.05); // Fade in
      gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.3); // Fade out

      // Play the beep for 300ms
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);

      // Wait for beep to finish
      await new Promise(resolve => setTimeout(resolve, 400));
      console.log('🔔 Test beep played at volume:', volume);
    } catch (err) {
      console.error('Test audio error:', err);
      setError('Failed to play test sound. Please check your audio settings.');
    } finally {
      setIsTestingAudio(false);
    }
  };
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

      // Unlock audio playback - both Web Audio API and HTML5 Audio
      // Method 1: Unlock Web Audio API (AudioContext)
      const audioContext = new AudioContext();
      await audioContext.resume();
      const sampleRate = audioContext.sampleRate;
      const bufferLength = Math.floor(sampleRate * 0.01); // 10ms
      const buffer = audioContext.createBuffer(1, bufferLength, sampleRate);
      const source = audioContext.createBufferSource();
      source.buffer = buffer;
      source.connect(audioContext.destination);
      source.start(0);
      await new Promise(resolve => setTimeout(resolve, 100));

      // Method 2: Unlock HTML5 Audio element (what Kaeva's voice uses)
      const silentAudio = new Audio();
      silentAudio.src = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=';
      await silentAudio.play();
      console.log('Both audio systems unlocked successfully');
      setAudioReady(true);

      // All permissions granted
      onPermissionsGranted();
    } catch (err) {
      console.error("Permission error:", err);
      setError("We need microphone and speaker access to have a conversation with you. Please enable these permissions in your browser settings and try again.");
      setIsRequesting(false);
    }
  };
  return <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-kaeva-void relative flex justify-start px-4 sm:px-8 pt-4 sm:pt-8 pb-8 sm:pb-12 pb-safe overflow-y-auto"
    >
      <AuroraBackground />
      
      <div className="relative z-10 w-full max-w-2xl">
        <motion.div initial={{
        opacity: 0,
        y: 20
      }} animate={{
        opacity: 1,
        y: 0
      }} className="flex flex-col items-center space-y-4 sm:space-y-6 mb-8">
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
            <motion.div initial={{
            opacity: 0,
            x: -20
          }} animate={{
            opacity: 1,
            x: 0
          }} transition={{
            delay: 0.2
          }} className="flex flex-col items-center space-y-3">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-kaeva-mint/20 flex items-center justify-center">
                <Mic className="w-8 h-8 sm:w-10 sm:h-10 text-kaeva-mint" />
              </div>
              <p className="text-sm text-kaeva-slate-300">Microphone</p>
            </motion.div>

            <motion.div initial={{
            opacity: 0,
            x: 20
          }} animate={{
            opacity: 1,
            x: 0
          }} transition={{
            delay: 0.3
          }} className="flex flex-col items-center space-y-3">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-kaeva-cyan/20 flex items-center justify-center">
                <Volume2 className="w-8 h-8 sm:w-10 sm:h-10 text-kaeva-cyan" />
              </div>
              <p className="text-sm text-kaeva-slate-300">Speakers</p>
            </motion.div>
          </div>

          {/* Success Message */}
          {audioReady && <motion.div initial={{
          opacity: 0,
          scale: 0.9
        }} animate={{
          opacity: 1,
          scale: 1
        }} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-kaeva-mint/10 border border-kaeva-mint/20">
              <div className="w-2 h-2 rounded-full bg-kaeva-mint animate-pulse" />
              <p className="text-sm text-kaeva-mint font-medium">Audio system ready ✓</p>
            </motion.div>}

          {/* Test Audio Button */}
          

          {/* Error Message */}
          {error && <motion.div initial={{
          opacity: 0,
          y: 10
        }} animate={{
          opacity: 1,
          y: 0
        }} className="flex items-start gap-3 p-4 rounded-lg bg-red-500/10 border border-red-500/20 max-w-md">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-200">{error}</p>
            </motion.div>}

          {/* Request Button */}
          <Button onClick={requestPermissions} disabled={isRequesting} size="lg" className="bg-kaeva-mint hover:bg-kaeva-mint/90 text-kaeva-void font-semibold px-8 py-6 text-lg">
            {isRequesting ? "Initializing Audio..." : audioReady ? "Permissions Granted ✓" : "Grant Permissions"}
          </Button>

          {/* Privacy Note */}
          <p className="text-xs text-kaeva-slate-400 text-center max-w-md">
            Your privacy is important. Audio is processed in real-time and not stored permanently.
          </p>
        </motion.div>
      </div>
    </motion.div>;
};
export default PermissionRequest;