/**
 * Convert base64-encoded PCM audio to WAV format for browser playback
 */
export function convertPCMtoWAV(base64PCM: string): Blob {
  // Decode base64 to binary
  const binaryString = atob(base64PCM);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  // Audio format parameters (16-bit PCM, 24kHz, mono)
  const sampleRate = 24000;
  const numChannels = 1;
  const bitsPerSample = 16;
  const byteRate = sampleRate * numChannels * (bitsPerSample / 8);
  const blockAlign = numChannels * (bitsPerSample / 8);
  const dataSize = bytes.length;

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

  return new Blob([wavData], { type: 'audio/wav' });
}

/**
 * Play audio blob and return promise that resolves when playback ends
 */
export function playAudio(audioBlob: Blob): Promise<HTMLAudioElement> {
  return new Promise((resolve, reject) => {
    const audio = new Audio(URL.createObjectURL(audioBlob));
    
    audio.addEventListener('ended', () => {
      URL.revokeObjectURL(audio.src);
      resolve(audio);
    });
    
    audio.addEventListener('error', (e) => {
      URL.revokeObjectURL(audio.src);
      reject(e);
    });
    
    audio.play().catch(reject);
  });
}
