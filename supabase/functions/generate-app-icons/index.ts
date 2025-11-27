import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!LOVABLE_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Missing required environment variables');
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Icon configurations
    const icons = [
      { size: 192, name: 'icon-192.png', maskable: false },
      { size: 512, name: 'icon-512.png', maskable: false },
      { size: 192, name: 'icon-maskable-192.png', maskable: true },
      { size: 512, name: 'icon-maskable-512.png', maskable: true },
    ];

    const generatedUrls: Record<string, string> = {};

    for (const icon of icons) {
      console.log(`Generating ${icon.name}...`);

      const prompt = `Create a minimalist app icon with these exact specifications:
- A stylized letter "K" in the center with clean geometric lines and rounded ends
- Background: solid dark color #08080A (Deep Slate, almost black)
- K color: smooth gradient from gold #D69E2E to sage green #70E098
- Add subtle corner brackets like a camera viewfinder in the same gradient at each corner
- Add a small circular dot in the center below the K in the gradient color
- Modern, tech-inspired aesthetic with clean edges
- ${icon.maskable ? 'Include 20% padding safe zone around all edges for maskable icon' : 'No padding, full bleed design'}
- Size: ${icon.size}x${icon.size} pixels
- High quality, crisp edges suitable for an app icon`;

      // Generate image using Lovable AI
      const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash-image-preview',
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ],
          modalities: ['image', 'text']
        }),
      });

      if (!aiResponse.ok) {
        const errorText = await aiResponse.text();
        console.error(`AI generation failed for ${icon.name}:`, errorText);
        throw new Error(`AI generation failed: ${errorText}`);
      }

      const aiData = await aiResponse.json();
      const imageUrl = aiData.choices?.[0]?.message?.images?.[0]?.image_url?.url;

      if (!imageUrl) {
        throw new Error(`No image returned for ${icon.name}`);
      }

      // Extract base64 data
      const base64Data = imageUrl.split(',')[1];
      const imageBuffer = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));

      // Upload to storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('app-assets')
        .upload(icon.name, imageBuffer, {
          contentType: 'image/png',
          upsert: true,
        });

      if (uploadError) {
        console.error(`Upload failed for ${icon.name}:`, uploadError);
        throw uploadError;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('app-assets')
        .getPublicUrl(icon.name);

      generatedUrls[icon.name] = urlData.publicUrl;
      console.log(`Generated ${icon.name}: ${urlData.publicUrl}`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        icons: generatedUrls,
        message: 'All PWA icons generated successfully'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error generating icons:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        details: error
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});