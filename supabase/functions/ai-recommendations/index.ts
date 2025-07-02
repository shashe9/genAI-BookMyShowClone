import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get user from JWT
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user } } = await supabaseClient.auth.getUser(token);

    if (!user) {
      throw new Error('Unauthorized');
    }

    // Get user preferences
    const { data: preferences } = await supabaseClient
      .from('user_preferences')
      .select('*')
      .eq('user_id', user.id)
      .single();

    // Get user's booking history for better recommendations
    const { data: bookings } = await supabaseClient
      .from('bookings')
      .select(`
        *,
        showtimes(
          movie_id,
          movies(genre, language)
        )
      `)
      .eq('user_id', user.id)
      .limit(10);

    // Extract user's favorite genres and languages from history
    const watchedGenres = bookings?.flatMap(b => b.showtimes?.movies?.genre || []) || [];
    const watchedLanguages = bookings?.flatMap(b => b.showtimes?.movies?.language || []) || [];

    // Combine with stored preferences
    const preferredGenres = [
      ...(preferences?.preferred_genres || []),
      ...watchedGenres
    ];
    const preferredLanguages = [
      ...(preferences?.preferred_languages || []),
      ...watchedLanguages
    ];

    // Get movies matching user preferences
    let query = supabaseClient
      .from('movies')
      .select('*')
      .eq('is_active', true);

    if (preferredGenres.length > 0) {
      query = query.in('genre', preferredGenres);
    }

    if (preferredLanguages.length > 0) {
      query = query.in('language', preferredLanguages);
    }

    const { data: recommendedMovies } = await query.limit(10);

    // Create a simple recommendation score based on user preferences
    const scoredMovies = recommendedMovies?.map(movie => {
      let score = 0;
      
      // Higher score for preferred genres
      if (preferredGenres.includes(movie.genre)) {
        score += 3;
      }
      
      // Higher score for preferred languages
      if (preferredLanguages.includes(movie.language)) {
        score += 2;
      }
      
      // Boost highly rated movies
      if (movie.rating >= 4.0) {
        score += 2;
      }
      
      // Boost newer movies
      const releaseDate = new Date(movie.release_date);
      const monthsOld = (Date.now() - releaseDate.getTime()) / (1000 * 60 * 60 * 24 * 30);
      if (monthsOld <= 3) {
        score += 1;
      }

      return { ...movie, recommendation_score: score };
    }).sort((a, b) => b.recommendation_score - a.recommendation_score);

    console.log(`Generated ${scoredMovies?.length} recommendations for user ${user.id}`);

    return new Response(
      JSON.stringify({ 
        recommendations: scoredMovies || [],
        user_preferences: preferences,
        recommendation_reason: "Based on your viewing history and preferences"
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error: any) {
    console.error('Error in ai-recommendations function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});