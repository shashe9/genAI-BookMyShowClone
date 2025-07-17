import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, MapPin, Clock, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { featuredMovies } from "@/data/movies";

interface Theater {
  id: string;
  name: string;
  location: string;
  city: string;
  total_seats: number;
}

interface Showtime {
  id: string;
  theater_id: string;
  show_date: string;
  show_time: string;
  available_seats: number;
  ticket_price: number;
  theater: Theater;
}

const BookTickets = () => {
  const { movieId } = useParams();
  const navigate = useNavigate();
  const [showtimes, setShowtimes] = useState<Showtime[]>([]);
  const [loading, setLoading] = useState(true);

  const movie = featuredMovies.find(m => m.id === movieId);

  useEffect(() => {
    if (!movieId) return;
    
    fetchShowtimes();
  }, [movieId]);

  const fetchShowtimes = async () => {
    try {
      const { data, error } = await supabase
        .from('showtimes')
        .select(`
          *,
          theater:theaters(*)
        `)
        .eq('movie_id', movieId)
        .gte('show_date', new Date().toISOString().split('T')[0])
        .order('show_date')
        .order('show_time');

      if (error) {
        console.error('Error fetching showtimes:', error);
        return;
      }

      setShowtimes(data || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const groupedShowtimes = showtimes.reduce((acc, showtime) => {
    const theaterId = showtime.theater_id;
    if (!acc[theaterId]) {
      acc[theaterId] = {
        theater: showtime.theater,
        showtimes: []
      };
    }
    acc[theaterId].showtimes.push(showtime);
    return acc;
  }, {} as Record<string, { theater: Theater; showtimes: Showtime[] }>);

  const formatTime = (time: string) => {
    return new Date(`2000-01-01T${time}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  if (!movie) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container py-8">
          <p className="text-center text-muted-foreground">Movie not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container py-8">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">{movie.title}</h1>
          <div className="flex items-center gap-4 text-muted-foreground">
            <Badge variant="secondary">{movie.rating}/10</Badge>
            <span>{movie.duration}</span>
            <span>{movie.language}</span>
            <div className="flex gap-2">
              {movie.genres.map((genre) => (
                <Badge key={genre} variant="outline">
                  {genre}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        <h2 className="text-2xl font-bold mb-6">Theaters Showing {movie.title}</h2>

        {loading ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Loading theaters and showtimes...</p>
          </div>
        ) : Object.keys(groupedShowtimes).length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No showtimes available for this movie.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.values(groupedShowtimes).map(({ theater, showtimes }) => (
              <Card key={theater.id}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-semibold">{theater.name}</h3>
                      <div className="flex items-center gap-2 text-muted-foreground mt-1">
                        <MapPin className="w-4 h-4" />
                        <span>{theater.location}, {theater.city}</span>
                        <Users className="w-4 h-4 ml-4" />
                        <span>{theater.total_seats} seats</span>
                      </div>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Group by date */}
                    {Object.entries(
                      showtimes.reduce((acc, showtime) => {
                        const date = showtime.show_date;
                        if (!acc[date]) acc[date] = [];
                        acc[date].push(showtime);
                        return acc;
                      }, {} as Record<string, Showtime[]>)
                    ).map(([date, dateShowtimes]) => (
                      <div key={date}>
                        <h4 className="font-medium mb-3 flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          {formatDate(date)}
                        </h4>
                        <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                          {dateShowtimes.map((showtime) => (
                            <Button
                              key={showtime.id}
                              variant="outline"
                              className="flex flex-col h-auto py-2"
                              disabled={showtime.available_seats === 0}
                            >
                              <span className="font-medium">
                                {formatTime(showtime.show_time)}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                ₹{showtime.ticket_price}
                              </span>
                              <span className="text-xs text-green-600">
                                {showtime.available_seats} seats
                              </span>
                            </Button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default BookTickets;