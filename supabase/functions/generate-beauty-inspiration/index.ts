import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface BeautyProduct {
  name: string;
  brand: string;
  category?: string;
  ingredients?: string;
}

interface BeautyInspirationRequest {
  products: BeautyProduct[];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { products }: BeautyInspirationRequest = await req.json();

    if (!products || products.length === 0) {
      return new Response(JSON.stringify({ error: 'No products provided' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch user's beauty profile
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('beauty_profile')
      .eq('id', user.id)
      .single();

    const beautyProfile = profile?.beauty_profile as { skinType?: string; hairType?: string } || {};

    // Generate beauty inspiration using Gemini
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const productList = products.map(p => `${p.brand || ''} ${p.name}`.trim()).join(', ');
    const prompt = `Based on these beauty products: ${productList}

User's beauty profile:
- Skin Type: ${beautyProfile.skinType || 'unknown'}
- Hair Type: ${beautyProfile.hairType || 'unknown'}

Generate 3 personalized beauty inspirations in JSON format:

{
  "makeupLooks": [
    {
      "name": "Look name",
      "vibe": "natural|glam|professional|bold",
      "steps": ["step 1", "step 2"],
      "productsUsed": ["product names from the scanned list"],
      "occasion": "when to wear this"
    }
  ],
  "skincareRoutines": [
    {
      "name": "Routine name",
      "timeOfDay": "morning|evening|both",
      "steps": ["step 1", "step 2"],
      "productsUsed": ["product names"],
      "benefits": ["benefit 1", "benefit 2"]
    }
  ],
  "tips": [
    "Expert tip 1 based on their products",
    "Expert tip 2 based on their skin type"
  ]
}

Ensure productsUsed only includes items from the scanned products list.`;

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: 'You are a beauty expert. Return valid JSON only.' },
          { role: 'user', content: prompt }
        ],
      }),
    });

    if (!aiResponse.ok) {
      console.error('AI API error:', await aiResponse.text());
      throw new Error('Failed to generate beauty inspiration');
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content;
    
    // Extract JSON from markdown code blocks if present
    let jsonContent = content;
    if (content.includes('```json')) {
      jsonContent = content.split('```json')[1].split('```')[0].trim();
    } else if (content.includes('```')) {
      jsonContent = content.split('```')[1].split('```')[0].trim();
    }
    
    const inspiration = JSON.parse(jsonContent);

    // Search YouTube for tutorials
    const YOUTUBE_API_KEY = Deno.env.get('YOUTUBE_API_KEY');
    let youtubeVideos = [];

    if (YOUTUBE_API_KEY) {
      const searchQuery = `${beautyProfile.skinType || ''} ${products[0]?.name || 'makeup'} tutorial`;
      const youtubeUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(searchQuery)}&type=video&videoDuration=medium&maxResults=3&key=${YOUTUBE_API_KEY}`;

      try {
        const ytResponse = await fetch(youtubeUrl);
        if (ytResponse.ok) {
          const ytData = await ytResponse.json();
          youtubeVideos = ytData.items?.map((item: any) => ({
            videoId: item.id.videoId,
            title: item.snippet.title,
            thumbnail: item.snippet.thumbnails.medium.url,
            channelTitle: item.snippet.channelTitle,
            url: `https://www.youtube.com/watch?v=${item.id.videoId}`
          })) || [];
        }
      } catch (error) {
        console.error('YouTube API error:', error);
      }
    }

    return new Response(JSON.stringify({
      ...inspiration,
      youtubeVideos,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error generating beauty inspiration:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
