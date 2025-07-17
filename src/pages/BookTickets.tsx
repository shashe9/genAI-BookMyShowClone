import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, MapPin, Clock, Users, Minus, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { featuredMovies } from "@/data/movies";
import { useToast } from "@/hooks/use-toast";

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
  const { toast } = useToast();
  const [showtimes, setShowtimes] = useState<Showtime[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedShowtime, setSelectedShowtime] = useState<Showtime | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [ticketCount, setTicketCount] = useState(1);
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const [bookedSeats, setBookedSeats] = useState<string[]>([]);

  const movie = featuredMovies.find(m => m.id === movieId);

  useEffect(() => {
    if (!movieId) return;
    
    // Set default date to today
    const today = new Date().toISOString().split('T')[0];
    setSelectedDate(today);
  }, [movieId]);

  useEffect(() => {
    if (selectedDate) {
      fetchShowtimes();
    }
  }, [selectedDate, movieId]);

  useEffect(() => {
    if (selectedShowtime) {
      fetchBookedSeats();
    }
  }, [selectedShowtime]);

  const fetchShowtimes = async () => {
    if (!selectedDate) return;
    
    try {
      setLoading(true);
      // For demonstration, create sample showtimes for all theaters
      const { data: theaters, error: theatersError } = await supabase
        .from('theaters')
        .select('*');

      if (theatersError) {
        console.error('Error fetching theaters:', theatersError);
        return;
      }

      // Generate sample showtimes for demonstration
      const sampleShowtimes: Showtime[] = [];
      const times = ['10:00', '13:30', '16:45', '20:00', '22:30'];
      
      theaters?.forEach((theater) => {
        times.forEach((time, index) => {
          sampleShowtimes.push({
            id: `${theater.id}-${time}-${selectedDate}`,
            theater_id: theater.id,
            show_date: selectedDate,
            show_time: time,
            available_seats: Math.floor(Math.random() * 50) + 20, // Random available seats 20-70
            ticket_price: 250 + (index * 50), // Varying prices
            theater: theater
          });
        });
      });

      setShowtimes(sampleShowtimes);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBookedSeats = async () => {
    if (!selectedShowtime) return;

    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('seats_booked')
        .eq('showtime_id', selectedShowtime.id)
        .eq('booking_status', 'confirmed');

      if (error) {
        console.error('Error fetching booked seats:', error);
        return;
      }

      // Extract seat numbers from bookings
      const allBookedSeats: string[] = [];
      data?.forEach(booking => {
        // Assuming seats_booked contains the number of seats, we'll generate seat IDs
        // In a real app, you'd store actual seat IDs
        for (let i = 1; i <= booking.seats_booked; i++) {
          allBookedSeats.push(`A${i}`); // Simplified seat generation
        }
      });

      setBookedSeats(allBookedSeats);
    } catch (error) {
      console.error('Error:', error);
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

  const generateDates = () => {
    const dates = [];
    const today = new Date();
    
    for (let i = 0; i < 14; i++) { // Show next 14 days
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push({
        full: date.toISOString().split('T')[0],
        day: date.toLocaleDateString('en-US', { weekday: 'short' }),
        date: date.getDate(),
        month: date.toLocaleDateString('en-US', { month: 'short' })
      });
    }
    return dates;
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
    setSelectedShowtime(null);
    setSelectedSeats([]);
  };

  const handleShowtimeSelect = (showtime: Showtime) => {
    setSelectedShowtime(showtime);
    setSelectedSeats([]);
  };
  const handleSeatSelect = (seatId: string) => {
    if (bookedSeats.includes(seatId)) return;

    if (selectedSeats.includes(seatId)) {
      setSelectedSeats(selectedSeats.filter(seat => seat !== seatId));
    } else if (selectedSeats.length < ticketCount) {
      setSelectedSeats([...selectedSeats, seatId]);
    } else {
      toast({
        title: "Maximum seats selected",
        description: `You can only select ${ticketCount} seat(s).`,
      });
    }
  };

  const generateSeats = (totalSeats: number) => {
    const seats = [];
    const rows = Math.ceil(totalSeats / 10);
    const seatsPerRow = 10;

    for (let row = 0; row < rows; row++) {
      const rowLetter = String.fromCharCode(65 + row); // A, B, C, etc.
      for (let seat = 1; seat <= seatsPerRow && seats.length < totalSeats; seat++) {
        seats.push(`${rowLetter}${seat}`);
      }
    }
    return seats;
  };

  const renderSeatMap = () => {
    if (!selectedShowtime) return null;

    const seats = generateSeats(selectedShowtime.theater.total_seats);
    const rows = Math.ceil(seats.length / 10);

    return (
      <div className="space-y-6">
        <div className="text-center">
          <div className="w-full h-3 bg-gradient-to-r from-transparent via-primary to-transparent rounded-lg mb-4"></div>
          <p className="text-sm text-muted-foreground">SCREEN</p>
        </div>

        <div className="space-y-2">
          {Array.from({ length: rows }, (_, rowIndex) => {
            const rowLetter = String.fromCharCode(65 + rowIndex);
            const rowSeats = seats.filter(seat => seat.startsWith(rowLetter));

            return (
              <div key={rowLetter} className="flex items-center justify-center gap-1">
                <span className="w-6 text-sm font-medium text-muted-foreground mr-2">
                  {rowLetter}
                </span>
                {rowSeats.map((seatId) => {
                  const isBooked = bookedSeats.includes(seatId);
                  const isSelected = selectedSeats.includes(seatId);

                  return (
                    <button
                      key={seatId}
                      onClick={() => handleSeatSelect(seatId)}
                      disabled={isBooked}
                      className={`
                        w-8 h-8 text-xs font-medium rounded border transition-all
                        ${isBooked 
                          ? 'bg-gray-400 border-gray-400 text-gray-600 cursor-not-allowed' 
                          : isSelected
                          ? 'bg-primary border-primary text-primary-foreground'
                          : 'bg-background border-green-500 text-green-600 hover:bg-green-50'
                        }
                      `}
                    >
                      {seatId.slice(1)}
                    </button>
                  );
                })}
                <span className="w-6 text-sm font-medium text-muted-foreground ml-2">
                  {rowLetter}
                </span>
              </div>
            );
          })}
        </div>

        <div className="flex justify-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-background border-green-500 border rounded"></div>
            <span>Available</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-primary border-primary border rounded"></div>
            <span>Selected</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gray-400 border-gray-400 border rounded"></div>
            <span>Booked</span>
          </div>
        </div>
      </div>
    );
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

        <h2 className="text-2xl font-bold mb-6">Book Tickets for {movie.title}</h2>

        {!selectedShowtime && (
          <>
            {/* Ticket Count Selection */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Select Number of Tickets</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <span className="text-sm font-medium">Tickets:</span>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setTicketCount(Math.max(1, ticketCount - 1))}
                      disabled={ticketCount <= 1}
                    >
                      <Minus className="w-4 h-4" />
                    </Button>
                    <span className="w-8 text-center font-medium">{ticketCount}</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setTicketCount(Math.min(6, ticketCount + 1))}
                      disabled={ticketCount >= 6}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    (Maximum 6 tickets per booking)
                  </span>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {/* Date Selection Row */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Select Date</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
              {generateDates().map((dateObj) => {
                const isSelected = selectedDate === dateObj.full;
                const isToday = dateObj.full === new Date().toISOString().split('T')[0];
                
                return (
                  <Button
                    key={dateObj.full}
                    variant={isSelected ? "default" : "outline"}
                    className={`
                      flex-shrink-0 flex flex-col h-auto py-3 px-4 min-w-[80px]
                      ${isSelected ? 'bg-primary text-primary-foreground' : ''}
                      ${isToday && !isSelected ? 'border-primary text-primary' : ''}
                    `}
                    onClick={() => handleDateSelect(dateObj.full)}
                  >
                    <span className="text-xs font-normal">
                      {isToday ? 'Today' : dateObj.day}
                    </span>
                    <span className="text-lg font-bold">{dateObj.date}</span>
                    <span className="text-xs font-normal">{dateObj.month}</span>
                  </Button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {loading ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Loading theaters and showtimes...</p>
          </div>
        ) : !selectedDate ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Please select a date to view showtimes.</p>
          </div>
        ) : showtimes.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No showtimes available for {formatDate(selectedDate)}.</p>
          </div>
        ) : selectedShowtime ? (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-semibold">{selectedShowtime.theater.name}</h3>
                    <p className="text-muted-foreground">
                      {formatDate(selectedShowtime.show_date)} at {formatTime(selectedShowtime.show_time)}
                    </p>
                  </div>
                  <Button variant="outline" onClick={() => setSelectedShowtime(null)}>
                    Change Showtime
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mb-6">
                  <h4 className="font-medium mb-4">Select {ticketCount} Seat(s)</h4>
                  {renderSeatMap()}
                </div>
                
                {selectedSeats.length === ticketCount && (
                  <div className="border-t pt-4">
                    <div className="flex justify-between items-center mb-4">
                      <div>
                        <p className="font-medium">Selected Seats: {selectedSeats.join(', ')}</p>
                        <p className="text-sm text-muted-foreground">
                          {ticketCount} ticket(s) × ₹{selectedShowtime.ticket_price} = ₹{ticketCount * selectedShowtime.ticket_price}
                        </p>
                      </div>
                      <Button size="lg" className="bg-primary hover:bg-primary/90">
                        Proceed to Payment
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold">Available Theaters & Showtimes</h3>
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
                    <div>
                      <h4 className="font-medium mb-3 flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        Showtimes for {formatDate(selectedDate)}
                      </h4>
                      <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                        {showtimes
                          .filter(showtime => showtime.theater_id === theater.id)
                          .map((showtime) => (
                            <Button
                              key={showtime.id}
                              variant="outline"
                              className="flex flex-col h-auto py-2"
                              disabled={showtime.available_seats === 0}
                              onClick={() => handleShowtimeSelect(showtime)}
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