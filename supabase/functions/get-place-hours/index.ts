import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { validateRequest, placeHoursSchema } from "../_shared/schemas.ts";
import { getSecret } from "../_shared/secrets.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate request
    const body = await req.json();
    const validation = validateRequest(placeHoursSchema, body);
    
    if (!validation.success) {
      return new Response(
        JSON.stringify({ error: validation.error }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { name, address, city, state } = validation.data;
    const apiKey = getSecret('GOOGLE_PLACES_API_KEY');

    // Step 1: Search for the place using Text Search
    const searchQuery = `${name} ${address} ${city} ${state}`;
    console.log('Searching for place:', searchQuery);

    const searchResponse = await fetch('https://places.googleapis.com/v1/places:searchText', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress',
      },
      body: JSON.stringify({
        textQuery: searchQuery,
        maxResultCount: 1,
      }),
    });

    if (!searchResponse.ok) {
      const errorText = await searchResponse.text();
      console.error('Google Places search error:', searchResponse.status, errorText);
      throw new Error(`Places search failed: ${searchResponse.status}`);
    }

    const searchData = await searchResponse.json();
    console.log('Search results:', JSON.stringify(searchData, null, 2));

    if (!searchData.places || searchData.places.length === 0) {
      return new Response(
        JSON.stringify({ 
          available: false, 
          message: 'Store not found in Google Places' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const placeId = searchData.places[0].id;

    // Step 2: Get place details including opening hours
    const detailsResponse = await fetch(`https://places.googleapis.com/v1/${placeId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': 'regularOpeningHours,currentOpeningHours',
      },
    });

    if (!detailsResponse.ok) {
      const errorText = await detailsResponse.text();
      console.error('Google Places details error:', detailsResponse.status, errorText);
      throw new Error(`Places details failed: ${detailsResponse.status}`);
    }

    const detailsData = await detailsResponse.json();
    console.log('Place details:', JSON.stringify(detailsData, null, 2));

    // Parse opening hours
    const regularHours = detailsData.regularOpeningHours;
    const currentHours = detailsData.currentOpeningHours;

    if (!regularHours || !regularHours.weekdayDescriptions) {
      return new Response(
        JSON.stringify({ 
          available: false, 
          message: 'Hours not available for this store' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Format hours into a structured object
    const hours: Record<string, string> = {};
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    
    regularHours.weekdayDescriptions.forEach((desc: string, index: number) => {
      // Format: "Monday: 8:00 AM – 10:00 PM"
      const parts = desc.split(': ');
      if (parts.length === 2) {
        hours[days[index]] = parts[1];
      }
    });

    // Determine current status
    const isOpen = currentHours?.openNow ?? false;
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    const todayHours = hours[today] || 'Not available';

    let currentStatus = 'Closed';
    if (isOpen) {
      currentStatus = 'Open now';
    }

    return new Response(
      JSON.stringify({
        available: true,
        isOpen,
        currentStatus,
        todayHours,
        hours,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in get-place-hours:', error);
    return new Response(
      JSON.stringify({ 
        available: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
