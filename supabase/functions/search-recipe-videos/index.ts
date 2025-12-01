import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { getSecret, getSupabaseSecrets, validateRequiredSecrets } from "../_shared/secrets.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface VideoResult {
  videoId: string;
  title: string;
  channelTitle: string;
  thumbnail: string;
  duration: string;
  viewCount: string;
  publishedAt: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate required secrets early
    validateRequiredSecrets(['YOUTUBE_API_KEY']);
    const authHeader = req.headers.get('Authorization');
    const { url: supabaseUrl, anonKey } = getSupabaseSecrets();
    const supabaseClient = createClient(
      supabaseUrl,
      anonKey,
      { global: { headers: { Authorization: authHeader! } } }
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const apiKey = getSecret('YOUTUBE_API_KEY');

    const { recipeName, maxResults = 3 } = await req.json();

    if (!recipeName) {
      return new Response(
        JSON.stringify({ error: 'recipeName is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const searchQuery = encodeURIComponent(`${recipeName} recipe cooking tutorial`);

    console.log(`Searching YouTube for: ${recipeName}`);

    // Step 1: Search for videos
    const searchResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/search?` +
      `part=snippet&q=${searchQuery}&type=video&videoDuration=medium&` +
      `maxResults=${maxResults}&key=${apiKey}`
    );

    if (!searchResponse.ok) {
      const error = await searchResponse.text();
      console.error('YouTube Search API error:', error);
      throw new Error(`YouTube API failed: ${searchResponse.status}`);
    }

    const searchData = await searchResponse.json();

    if (!searchData.items || searchData.items.length === 0) {
      return new Response(
        JSON.stringify({ videos: [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Step 2: Get video details (duration, views, etc.)
    const videoIds = searchData.items.map((item: any) => item.id.videoId).join(',');
    
    const detailsResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?` +
      `part=contentDetails,statistics&id=${videoIds}&key=${apiKey}`
    );

    if (!detailsResponse.ok) {
      const error = await detailsResponse.text();
      console.error('YouTube Videos API error:', error);
      throw new Error(`YouTube API failed: ${detailsResponse.status}`);
    }

    const detailsData = await detailsResponse.json();

    // Step 3: Merge search results with details
    const videos: VideoResult[] = searchData.items.map((item: any, index: number) => {
      const details = detailsData.items[index];
      
      // Parse ISO 8601 duration (PT15M30S -> 15:30)
      let duration = 'N/A';
      if (details?.contentDetails?.duration) {
        const match = details.contentDetails.duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
        if (match) {
          const hours = match[1] ? parseInt(match[1]) : 0;
          const minutes = match[2] ? parseInt(match[2]) : 0;
          const seconds = match[3] ? parseInt(match[3]) : 0;
          
          if (hours > 0) {
            duration = `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
          } else {
            duration = `${minutes}:${seconds.toString().padStart(2, '0')}`;
          }
        }
      }

      // Format view count
      let viewCount = 'N/A';
      if (details?.statistics?.viewCount) {
        const views = parseInt(details.statistics.viewCount);
        if (views >= 1000000) {
          viewCount = `${(views / 1000000).toFixed(1)}M views`;
        } else if (views >= 1000) {
          viewCount = `${(views / 1000).toFixed(1)}K views`;
        } else {
          viewCount = `${views} views`;
        }
      }

      return {
        videoId: item.id.videoId,
        title: item.snippet.title,
        channelTitle: item.snippet.channelTitle,
        thumbnail: item.snippet.thumbnails.medium.url,
        duration,
        viewCount,
        publishedAt: item.snippet.publishedAt
      };
    });

    console.log(`Found ${videos.length} videos for: ${recipeName}`);

    return new Response(
      JSON.stringify({ videos }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in search-recipe-videos:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});