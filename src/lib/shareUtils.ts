/**
 * Generate a shareable image from progress data
 */
export const generateShareImage = (
  canvas: HTMLCanvasElement,
  data: {
    streak?: number;
    weeklyCalories?: number;
    avgDaily?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
  }
): string => {
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // Set canvas size
  canvas.width = 800;
  canvas.height = 600;

  // Background gradient
  const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  gradient.addColorStop(0, '#D69E2E20'); // Primary/20
  gradient.addColorStop(1, '#70E09820'); // Secondary/20
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Background
  ctx.fillStyle = '#0F172A';
  ctx.fillRect(50, 50, canvas.width - 100, canvas.height - 100);

  // Border
  ctx.strokeStyle = '#FFFFFF20';
  ctx.lineWidth = 2;
  ctx.strokeRect(50, 50, canvas.width - 100, canvas.height - 100);

  // Fire emoji (as text since we can't load external images easily)
  ctx.font = 'bold 100px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('🔥', canvas.width / 2, 200);

  // Streak number
  ctx.font = 'bold 72px Space Grotesk, sans-serif';
  ctx.fillStyle = '#FFFFFF';
  ctx.fillText(`${data.streak || 0} Day Streak!`, canvas.width / 2, 290);

  // Weekly stats
  ctx.font = '24px Inter, sans-serif';
  ctx.fillStyle = '#94A3B8';
  ctx.fillText(`This week: ${data.weeklyCalories || 0} cal`, canvas.width / 2, 350);
  ctx.fillText(`Avg: ${data.avgDaily || 0}/day`, canvas.width / 2, 390);

  // Macros
  ctx.font = '20px JetBrains Mono, monospace';
  const macrosY = 450;
  ctx.fillStyle = '#D69E2E';
  ctx.fillText(`P: ${data.protein || 0}g`, canvas.width / 2 - 120, macrosY);
  ctx.fillStyle = '#70E098';
  ctx.fillText(`C: ${data.carbs || 0}g`, canvas.width / 2, macrosY);
  ctx.fillStyle = '#38BDF8';
  ctx.fillText(`F: ${data.fat || 0}g`, canvas.width / 2 + 120, macrosY);

  // Footer
  ctx.font = '16px Inter, sans-serif';
  ctx.fillStyle = '#64748B';
  ctx.fillText('Tracked with KAEVA', canvas.width / 2, 530);

  return canvas.toDataURL('image/png');
};

/**
 * Share to social media using Web Share API or fallback
 */
export const shareToSocial = async (
  data: {
    streak?: number;
    weeklyCalories?: number;
    avgDaily?: number;
  },
  imageUrl?: string
): Promise<boolean> => {
  const text = `🔥 ${data.streak || 0} Day Streak! This week: ${data.weeklyCalories || 0} cal, Avg: ${data.avgDaily || 0}/day. Tracked with KAEVA`;
  const url = window.location.origin;

  // Check if Web Share API is available
  if (navigator.share) {
    try {
      // If we have an image URL, try to share it as a file
      if (imageUrl) {
        const blob = await (await fetch(imageUrl)).blob();
        const file = new File([blob], 'kaeva-progress.png', { type: 'image/png' });
        
        await navigator.share({
          title: 'My KAEVA Progress',
          text: text,
          files: [file],
        });
      } else {
        await navigator.share({
          title: 'My KAEVA Progress',
          text: text,
          url: url,
        });
      }
      return true;
    } catch (error) {
      // User cancelled or share failed
      console.error('Share failed:', error);
      return false;
    }
  }

  // Fallback: copy to clipboard
  try {
    await navigator.clipboard.writeText(`${text}\n${url}`);
    return true;
  } catch (error) {
    console.error('Clipboard write failed:', error);
    return false;
  }
};