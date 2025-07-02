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

    console.log('Starting scheduled movie data update...');

    // Sample movie data updates (in real app, this would fetch from external APIs)
    const movieUpdates = [
      {
        title: 'Avatar: The Way of Water',
        description: 'Set more than a decade after the events of the first film, Avatar: The Way of Water begins to tell the story of the Sully family.',
        genre: 'Action',
        duration: 192,
        rating: 7.6,
        language: 'English',
        poster_url: '/movie1.jpg',
        release_date: '2024-01-15',
        is_active: true
      },
      {
        title: 'RRR',
        description: 'A fictional story about two legendary revolutionaries and their journey away from home before they started fighting for their country.',
        genre: 'Action',
        duration: 187,
        rating: 8.8,
        language: 'Telugu',
        poster_url: '/movie2.jpg',
        release_date: '2024-01-20',
        is_active: true
      },
      {
        title: 'The Batman',
        description: 'When a sadistic serial killer begins murdering key political figures in Gotham, Batman is forced to investigate the citys hidden corruption.',
        genre: 'Action',
        duration: 176,
        rating: 7.8,
        language: 'English',
        poster_url: '/movie3.jpg',
        release_date: '2024-02-01',
        is_active: true
      },
      {
        title: 'Spider-Man: No Way Home',
        description: 'With Spider-Mans identity now revealed, Peter asks Doctor Strange for help. When a spell goes wrong, dangerous foes from other worlds start to appear.',
        genre: 'Action',
        duration: 148,
        rating: 8.4,
        language: 'English',
        poster_url: '/movie4.jpg',
        release_date: '2024-02-10',
        is_active: true
      },
      {
        title: 'Pushpa: The Rise',
        description: 'Violence erupts between red sandalwood smugglers and the police charged with bringing down their organization.',
        genre: 'Action',
        duration: 179,
        rating: 7.6,
        language: 'Telugu',
        poster_url: '/movie5.jpg',
        release_date: '2024-02-15',
        is_active: true
      },
      {
        title: 'Dune',
        description: 'Feature adaptation of Frank Herberts science fiction novel about the son of a noble family entrusted with the protection of the most valuable asset.',
        genre: 'Sci-Fi',
        duration: 155,
        rating: 8.0,
        language: 'English',
        poster_url: '/movie6.jpg',
        release_date: '2024-02-20',
        is_active: true
      }
    ];

    // Check if movies exist, if not insert them
    const { data: existingMovies } = await supabaseClient
      .from('movies')
      .select('title');

    const existingTitles = new Set(existingMovies?.map(m => m.title) || []);

    const newMovies = movieUpdates.filter(movie => !existingTitles.has(movie.title));

    if (newMovies.length > 0) {
      const { error: insertError } = await supabaseClient
        .from('movies')
        .insert(newMovies);

      if (insertError) {
        throw insertError;
      }

      console.log(`Inserted ${newMovies.length} new movies`);
    }

    // Get theaters for showtime creation
    const { data: theaters } = await supabaseClient
      .from('theaters')
      .select('id, name');

    const { data: movies } = await supabaseClient
      .from('movies')
      .select('id, title')
      .eq('is_active', true);

    // Generate showtimes for the next 7 days
    const today = new Date();
    const showtimes = [];

    for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
      const showDate = new Date(today);
      showDate.setDate(today.getDate() + dayOffset);
      
      const showTimes = ['09:00', '12:30', '16:00', '19:30', '22:00'];
      
      for (const movie of movies || []) {
        for (const theater of theaters || []) {
          for (const showTime of showTimes) {
            // Check if showtime already exists
            const { data: existingShowtime } = await supabaseClient
              .from('showtimes')
              .select('id')
              .eq('movie_id', movie.id)
              .eq('theater_id', theater.id)
              .eq('show_date', showDate.toISOString().split('T')[0])
              .eq('show_time', showTime)
              .single();

            if (!existingShowtime) {
              showtimes.push({
                movie_id: movie.id,
                theater_id: theater.id,
                show_date: showDate.toISOString().split('T')[0],
                show_time: showTime,
                available_seats: Math.floor(Math.random() * 50) + 100, // 100-150 seats
                ticket_price: Math.floor(Math.random() * 200) + 150 // ₹150-350
              });
            }
          }
        }
      }
    }

    if (showtimes.length > 0) {
      // Insert showtimes in batches of 100
      const batchSize = 100;
      for (let i = 0; i < showtimes.length; i += batchSize) {
        const batch = showtimes.slice(i, i + batchSize);
        const { error: showtimeError } = await supabaseClient
          .from('showtimes')
          .insert(batch);

        if (showtimeError) {
          console.error('Error inserting showtimes batch:', showtimeError);
        }
      }

      console.log(`Generated ${showtimes.length} new showtimes`);
    }

    // Clean up old showtimes (older than yesterday)
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    const { error: cleanupError } = await supabaseClient
      .from('showtimes')
      .delete()
      .lt('show_date', yesterday.toISOString().split('T')[0]);

    if (cleanupError) {
      console.error('Error cleaning up old showtimes:', cleanupError);
    } else {
      console.log('Cleaned up old showtimes');
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Updated movie data: ${newMovies.length} new movies, ${showtimes.length} new showtimes`,
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error: any) {
    console.error('Error in update-movie-data function:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});