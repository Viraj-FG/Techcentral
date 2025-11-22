/**
 * Audio Monitoring System for Voice Activity Detection (VAD) and Barge-in
 */

export class VoiceActivityDetector {
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private stream: MediaStream | null = null;
  private silenceTimer: number | null = null;
  private animationFrameId: number | null = null;
  private isRunning = false;

  /**
   * Start VAD monitoring
   * @param onSilence - Callback when 2s of silence detected
   * @param onActivity - Callback with audio level (0-255)
   * @param silenceThreshold - dB threshold for silence detection (default -40dB)
   */
  async start(
    onSilence: () => void,
    onActivity: (level: number) => void,
    silenceThreshold: number = -40
  ): Promise<void> {
    try {
      console.log('🎤 Starting VAD monitoring...');
      
      this.stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          sampleRate: 24000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      
      this.audioContext = new AudioContext({ sampleRate: 24000 });
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 2048;
      this.analyser.smoothingTimeConstant = 0.8;
      
      const source = this.audioContext.createMediaStreamSource(this.stream);
      source.connect(this.analyser);
      
      const bufferLength = this.analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      
      this.isRunning = true;
      
      const checkAudioLevel = () => {
        if (!this.isRunning || !this.analyser) return;
        
        this.analyser.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((a, b) => a + b) / bufferLength;
        const db = average > 0 ? 20 * Math.log10(average / 255) : -100;
        
        // Send amplitude to UI (0-255 range)
        onActivity(average);
        
        // Check if user is speaking (above threshold)
        if (db > silenceThreshold) {
          // User is speaking - reset silence timer
          if (this.silenceTimer) {
            clearTimeout(this.silenceTimer);
          }
          this.silenceTimer = window.setTimeout(() => {
            console.log('🔇 Silence detected after 2s');
            onSilence();
          }, 2000);
        }
        
        this.animationFrameId = requestAnimationFrame(checkAudioLevel);
      };
      
      checkAudioLevel();
      console.log('✅ VAD monitoring started');
    } catch (error) {
      console.error('❌ Failed to start VAD:', error);
      throw error;
    }
  }

  /**
   * Stop VAD monitoring and clean up resources
   */
  stop(): void {
    console.log('🛑 Stopping VAD monitoring');
    this.isRunning = false;
    
    if (this.silenceTimer) {
      clearTimeout(this.silenceTimer);
      this.silenceTimer = null;
    }
    
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    
    this.analyser = null;
  }
}

export class BargeInDetector {
  private vad: VoiceActivityDetector | null = null;
  private isActive = false;

  /**
   * Start barge-in detection during AI speaking
   * @param onBargeIn - Callback when user interrupts
   * @param threshold - Amplitude threshold for barge-in (default 30 = ~-30dB)
   */
  async start(onBargeIn: () => void, threshold: number = 30): Promise<void> {
    if (this.isActive) {
      console.warn('⚠️ Barge-in already active');
      return;
    }

    try {
      console.log('👂 Starting barge-in detection...');
      this.isActive = true;
      this.vad = new VoiceActivityDetector();
      
      await this.vad.start(
        () => {}, // Ignore silence during speaking
        (level) => {
          // Trigger barge-in on loud user input
          if (level > threshold) {
            console.log('🛑 BARGE-IN DETECTED! User speaking at level:', level);
            onBargeIn();
          }
        },
        -35 // Lower threshold for barge-in (more sensitive)
      );
      
      console.log('✅ Barge-in detection started');
    } catch (error) {
      console.error('❌ Failed to start barge-in detection:', error);
      this.isActive = false;
    }
  }

  /**
   * Stop barge-in detection
   */
  stop(): void {
    if (!this.isActive) return;
    
    console.log('🛑 Stopping barge-in detection');
    this.isActive = false;
    
    if (this.vad) {
      this.vad.stop();
      this.vad = null;
    }
  }

  isRunning(): boolean {
    return this.isActive;
  }
}
