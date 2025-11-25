import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "./ui/button";
import { Mic, Volume2, AlertCircle, Loader2 } from "lucide-react";
import KaevaAperture from "./KaevaAperture";
import AuroraBackground from "./AuroraBackground";
interface PermissionRequestProps {
  onPermissionsGranted: () => void;
  onSkip?: () => void;
}
const PermissionRequest = ({
  onPermissionsGranted,
  onSkip
}: PermissionRequestProps) => {
  const [isRequesting, setIsRequesting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [audioReady, setAudioReady] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const isInAppBrowser = () => {
    const ua = navigator.userAgent || navigator.vendor;
    return /FBAN|FBAV|Instagram|LinkedIn|Twitter/i.test(ua);
  };

  const isMobile = () => {
    return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  };

  const getMobileErrorMessage = (errorName: string) => {
    const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
    const isAndroid = /Android/i.test(navigator.userAgent);

    if (errorName === 'NotAllowedError' || errorName === 'PermissionDeniedError') {
      if (isIOS) {
        return 'Access denied. Open Settings → Safari → Camera & Microphone → Allow for this site.';
      } else if (isAndroid) {
        return 'Access denied. Tap the lock icon in the address bar → Site Settings → Allow Camera & Microphone.';
      }
      return 'Access denied. Please enable microphone and camera permissions in your browser settings.';
    }
    return null;
  };

  const requestPermissions = async () => {
    console.log('🎯 Permission button clicked');
    setIsRequesting(true);
    setError(null);
    
    try {
      // Check for in-app browser
      if (isInAppBrowser()) {
        setError('Please open this page in Safari or Chrome for full functionality. Tap ⋯ menu → "Open in Safari/Chrome"');
        setIsRequesting(false);
        return;
      }

      // Check if mediaDevices API exists
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setError('Your browser does not support camera/microphone access. Please use Safari, Chrome, or Firefox.');
        setIsRequesting(false);
        return;
      }

      // Check for secure context (HTTPS)
      if (!window.isSecureContext) {
        setError('Permissions require a secure connection (HTTPS). Please access this site via HTTPS.');
        setIsRequesting(false);
        return;
      }

      // 1. IOS UNLOCK: Create & Resume AudioContext immediately (Top priority)
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const audioContext = new AudioContextClass();
      
      if (audioContext.state === 'suspended') {
        await audioContext.resume();
      }
      console.log('🔊 AudioContext unlocked, state:', audioContext.state);

      // 2. IOS UNLOCK: Play silent HTML5 audio immediately
      const silentAudio = new Audio();
      silentAudio.src = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=';
      try {
        await silentAudio.play();
        console.log('🎵 HTML5 Audio unlocked');
      } catch (audioErr) {
        console.warn("Silent audio play failed (non-critical):", audioErr);
      }

      // 3. PROGRESSIVE PERMISSION REQUEST with fallback
      let stream: MediaStream | null = null;
      let audioGranted = false;
      
      // Step 1: Try audio + video together
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          },
          video: true  // Simplified - let browser choose defaults
        });
        audioGranted = true;
        console.log('✅ Audio + Video granted');
      } catch (bothErr: any) {
        console.warn('⚠️ Audio + Video failed, trying audio only:', bothErr.name);
        
        // Step 2: Try audio only (most critical for voice)
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true
            }
          });
          audioGranted = true;
          console.log('✅ Audio only granted');
        } catch (audioErr: any) {
          console.error('❌ Audio failed:', audioErr);
          
          // Provide detailed error for audio failure
          const mobileMsg = getMobileErrorMessage(audioErr.name);
          if (mobileMsg) {
            setError(mobileMsg);
          } else if (audioErr.name === 'NotFoundError') {
            setError('No microphone found. Please check your device has a working microphone.');
          } else if (audioErr.name === 'NotReadableError') {
            setError('Microphone is busy. Close other apps and try again.');
          } else {
            setError(`Microphone access failed: ${audioErr.message}`);
          }
          
          setIsRequesting(false);
          return;
        }
      }

      if (!stream || !audioGranted) {
        setError('Unable to access microphone. Please check your device and browser settings.');
        setIsRequesting(false);
        return;
      }
      
      console.log('✅ getUserMedia successful');

      // 4. SUCCESS STATE
      setAudioReady(true);
      
      // 5. TRANSITION LOGIC
      setIsTransitioning(true);
      
      // Artificial delay to show "Success" state to user
      await new Promise(resolve => setTimeout(resolve, 800));

      console.log('🔄 Calling onPermissionsGranted...');

      try {
        // Call callback with 5-second timeout safety net
        await Promise.race([
          onPermissionsGranted(),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Transition timeout')), 5000)
          )
        ]);
        
        console.log('✅ Permission callback completed successfully');
      } catch (timeoutErr) {
        console.error('⏱️ Callback timeout or error:', timeoutErr);
        alert('Taking longer than expected. Continuing anyway...');
      } finally {
        setIsRequesting(false);
        setIsTransitioning(false);
      }

      // Clean up tracks after callback completes
      setTimeout(() => {
        if (stream) {
          stream.getTracks().forEach(track => track.stop());
          console.log('🛑 Tracks stopped (cleanup)');
        }
      }, 3000);

    } catch (err: any) {
      console.error("❌ Unexpected permission error:", err);
      
      const mobileMsg = getMobileErrorMessage(err.name);
      if (mobileMsg) {
        setError(mobileMsg);
      } else {
        setError(`Error: ${err.message || 'Unknown error occurred'}`);
      }
      
      setIsRequesting(false);
      setIsTransitioning(false);
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
          <Button onClick={requestPermissions} disabled={isRequesting || isTransitioning || audioReady} size="lg" className="bg-kaeva-mint hover:bg-kaeva-mint/90 text-kaeva-void font-semibold px-8 py-6 text-lg">
            {(isRequesting || isTransitioning) && <Loader2 className="w-5 h-5 mr-2 animate-spin" />}
            {isTransitioning ? "Loading Onboarding..." : 
             isRequesting ? "Initializing Audio..." : 
             audioReady ? "Permissions Granted ✓" : 
             "Grant Permissions"}
          </Button>

          {/* Skip to Dashboard */}
          {onSkip && (
            <button
              onClick={onSkip}
              className="text-sm text-kaeva-slate-400 hover:text-kaeva-mint transition-colors underline-offset-4 hover:underline"
            >
              Skip to Dashboard
            </button>
          )}

          {/* Developer Debug Button */}
          {import.meta.env.DEV && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                console.log('🔧 DEV: Force skip permissions');
                onPermissionsGranted();
              }}
              className="text-kaeva-slate-400 border-kaeva-slate-600"
            >
              DEV: Skip Permissions
            </Button>
          )}

          {/* Privacy Note */}
          <p className="text-xs text-kaeva-slate-400 text-center max-w-md">
            Your privacy is important. Audio is processed in real-time and not stored permanently.
          </p>
        </motion.div>
      </div>
    </motion.div>;
};
export default PermissionRequest;