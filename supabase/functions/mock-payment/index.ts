import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PaymentRequest {
  booking_id: string;
  amount: number;
  payment_method: 'card' | 'upi' | 'wallet';
}

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

    const { booking_id, amount, payment_method }: PaymentRequest = await req.json();

    // Simulate payment processing delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Mock payment success/failure (90% success rate)
    const isSuccess = Math.random() > 0.1;
    const payment_status = isSuccess ? 'completed' : 'failed';
    const booking_status = isSuccess ? 'confirmed' : 'pending';

    // Generate mock transaction ID
    const transaction_id = `TXN${Math.random().toString(36).substring(2, 15).toUpperCase()}`;

    if (isSuccess) {
      // Update booking status
      const { error: updateError } = await supabaseClient
        .from('bookings')
        .update({ 
          payment_status,
          booking_status
        })
        .eq('id', booking_id);

      if (updateError) {
        throw updateError;
      }

      // Get updated booking details
      const { data: booking } = await supabaseClient
        .from('bookings')
        .select(`
          *,
          showtimes(
            available_seats,
            movie_id,
            theater_id
          )
        `)
        .eq('id', booking_id)
        .single();

      // Update available seats
      if (booking) {
        const newAvailableSeats = booking.showtimes.available_seats - booking.seats_booked;
        await supabaseClient
          .from('showtimes')
          .update({ available_seats: newAvailableSeats })
          .eq('id', booking.showtime_id);
      }

      // Send booking confirmation email
      try {
        await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/send-booking-email`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ booking_id }),
        });
      } catch (emailError) {
        console.error('Failed to send email:', emailError);
        // Don't fail the payment if email fails
      }
    }

    console.log(`Payment ${isSuccess ? 'successful' : 'failed'} for booking ${booking_id}`);

    return new Response(
      JSON.stringify({
        success: isSuccess,
        transaction_id,
        payment_status,
        booking_status,
        amount,
        payment_method,
        message: isSuccess 
          ? 'Payment processed successfully!' 
          : 'Payment failed. Please try again.'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error: any) {
    console.error('Error in mock-payment function:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message,
        message: 'Payment processing failed'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});