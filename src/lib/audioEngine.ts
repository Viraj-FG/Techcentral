/**
 * Parse sample rate from mimeType string
 * Example: "audio/L16;codec=pcm;rate=24000" -> 24000
 */
function parseSampleRate(mimeType: string): number {
  const rateMatch = mimeType.match(/rate=(\d+)/);
  const rate = rateMatch ? parseInt(rateMatch[1], 10) : 24000;
  console.log('📊 Parsed sample rate:', rate, 'from mimeType:', mimeType);
  return rate;
}

/**
 * Convert base64-encoded PCM audio to WAV format for browser playback
 * @param base64PCM - Base64-encoded PCM audio data
 * @param mimeType - MIME type string containing audio format info (e.g., "audio/L16;codec=pcm;rate=24000")
 */
export function convertPCMtoWAV(base64PCM: string, mimeType: string = 'audio/L16;codec=pcm;rate=24000'): Blob {
  console.log('🎵 Converting PCM to WAV');
  console.log('📦 Input data length:', base64PCM.length);
  console.log('🎼 MimeType:', mimeType);
  
  // Decode base64 to binary
  const binaryString = atob(base64PCM);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  // Audio format parameters (16-bit PCM, mono)
  const sampleRate = parseSampleRate(mimeType);
  const numChannels = 1;
  const bitsPerSample = 16;
  const byteRate = sampleRate * numChannels * (bitsPerSample / 8);
  const blockAlign = numChannels * (bitsPerSample / 8);
  const dataSize = bytes.length;

  console.log('🎚️ Audio parameters:', {
    sampleRate,
    numChannels,
    bitsPerSample,
    byteRate,
    blockAlign,
    dataSize,
    durationSeconds: (dataSize / byteRate).toFixed(2)
  });

  // Create WAV header (44 bytes)
  const header = new ArrayBuffer(44);
  const view = new DataView(header);

  // "RIFF" chunk descriptor
  view.setUint32(0, 0x46464952, false); // "RIFF"
  view.setUint32(4, 36 + dataSize, true); // File size - 8
  view.setUint32(8, 0x45564157, false); // "WAVE"

  // "fmt " sub-chunk
  view.setUint32(12, 0x20746d66, false); // "fmt "
  view.setUint32(16, 16, true); // Subchunk size
  view.setUint16(20, 1, true); // Audio format (1 = PCM)
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);

  // "data" sub-chunk
  view.setUint32(36, 0x61746164, false); // "data"
  view.setUint32(40, dataSize, true);

  // Combine header and PCM data
  const wavData = new Uint8Array(44 + dataSize);
  wavData.set(new Uint8Array(header), 0);
  wavData.set(bytes, 44);

  const blob = new Blob([wavData], { type: 'audio/wav' });
  console.log('✅ WAV blob created, size:', blob.size, 'bytes');
  
  return blob;
}

/**
 * Play audio blob and return promise that resolves when playback ends
 * @param audioBlob - Audio blob to play
 * @param volume - Volume level (0.0 to 1.0), defaults to 1.0
 */
export function playAudio(audioBlob: Blob, volume: number = 1.0): Promise<HTMLAudioElement> {
  return new Promise((resolve, reject) => {
    console.log('🔊 Creating audio element, blob size:', audioBlob.size, 'type:', audioBlob.type);
    console.log('🔊 Volume setting:', volume);
    
    const audio = new Audio(URL.createObjectURL(audioBlob));
    audio.volume = Math.max(0, Math.min(1, volume)); // Clamp between 0 and 1
    
    console.log('🔊 Audio element created, src:', audio.src);
    
    audio.addEventListener('loadedmetadata', () => {
      console.log('🔊 Audio metadata loaded, duration:', audio.duration);
    });
    
    audio.addEventListener('canplay', () => {
      console.log('🔊 Audio can play');
    });
    
    audio.addEventListener('playing', () => {
      console.log('🔊 Audio is playing!');
    });
    
    audio.addEventListener('ended', () => {
      console.log('🔊 Audio playback ended');
      URL.revokeObjectURL(audio.src);
      resolve(audio);
    });
    
    audio.addEventListener('error', (e) => {
      console.error('🔊 Audio error:', e, audio.error);
      URL.revokeObjectURL(audio.src);
      reject(e);
    });
    
    console.log('🔊 Attempting to play audio...');
    audio.play()
      .then(() => console.log('🔊 Play promise resolved'))
      .catch((err) => {
        console.error('🔊 Play promise rejected:', err);
        reject(err);
      });
  });
}
