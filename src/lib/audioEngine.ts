/**
 * Convert base64-encoded audio to Blob for browser playback
 */
export function base64ToAudioBlob(base64Audio: string, mimeType: string = 'audio/mp3'): Blob {
  // Decode base64 to binary
  const binaryString = atob(base64Audio);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  
  return new Blob([bytes], { type: mimeType });
}

/**
 * Play audio blob and return promise that resolves when playback ends
 */
export function playAudio(audioBlob: Blob): Promise<HTMLAudioElement> {
  return new Promise((resolve, reject) => {
    console.log('🔊 Creating audio element, blob size:', audioBlob.size, 'type:', audioBlob.type);
    
    const audio = new Audio(URL.createObjectURL(audioBlob));
    audio.volume = 1.0; // Ensure max volume
    
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
