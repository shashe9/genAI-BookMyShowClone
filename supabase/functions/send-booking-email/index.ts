import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.2';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface BookingEmailRequest {
  booking_id: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
    
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { booking_id }: BookingEmailRequest = await req.json();

    // Get booking details with related data
    const { data: booking, error } = await supabaseClient
      .from('bookings')
      .select(`
        *,
        profiles(full_name, email),
        showtimes(
          show_date,
          show_time,
          theaters(name, location, city),
          movies(title, genre, duration, language)
        )
      `)
      .eq('id', booking_id)
      .single();

    if (error || !booking) {
      throw new Error('Booking not found');
    }

    const movieTitle = booking.showtimes.movies.title;
    const theaterName = booking.showtimes.theaters.name;
    const theaterLocation = booking.showtimes.theaters.location;
    const showDate = new Date(booking.showtimes.show_date).toLocaleDateString();
    const showTime = booking.showtimes.show_time;
    const userName = booking.profiles.full_name || 'Movie Fan';
    const userEmail = booking.profiles.email;

    const emailResponse = await resend.emails.send({
      from: "BookMyShow <bookings@bookmyshow.com>",
      to: [userEmail],
      subject: `Booking Confirmation - ${movieTitle}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Booking Confirmation</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; margin: 0; padding: 20px; }
            .container { max-width: 600px; margin: 0 auto; background: #f9f9f9; padding: 30px; border-radius: 10px; }
            .header { background: #e53e3e; color: white; padding: 20px; border-radius: 10px; text-align: center; margin-bottom: 30px; }
            .content { background: white; padding: 20px; border-radius: 10px; }
            .booking-details { background: #f0f0f0; padding: 15px; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎬 Booking Confirmed!</h1>
              <p>Your tickets are ready</p>
            </div>
            
            <div class="content">
              <h2>Hi ${userName},</h2>
              <p>Your booking has been confirmed! Here are your ticket details:</p>
              
              <div class="booking-details">
                <h3>📋 Booking Details</h3>
                <p><strong>Booking Reference:</strong> ${booking.booking_reference}</p>
                <p><strong>Movie:</strong> ${movieTitle}</p>
                <p><strong>Theater:</strong> ${theaterName}, ${theaterLocation}</p>
                <p><strong>Date:</strong> ${showDate}</p>
                <p><strong>Time:</strong> ${showTime}</p>
                <p><strong>Seats:</strong> ${booking.seats_booked}</p>
                <p><strong>Total Amount:</strong> ₹${booking.total_amount}</p>
                <p><strong>Status:</strong> ${booking.booking_status.toUpperCase()}</p>
              </div>
              
              <p><strong>Important:</strong> Please carry a valid ID proof along with this confirmation.</p>
              
              <p>Thank you for choosing BookMyShow! 🍿</p>
            </div>
            
            <div class="footer">
              <p>This is an automated email. Please do not reply.</p>
              <p>© 2024 BookMyShow. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    console.log("Booking confirmation email sent:", emailResponse);

    return new Response(JSON.stringify({ 
      success: true, 
      email_id: emailResponse.data?.id 
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-booking-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);