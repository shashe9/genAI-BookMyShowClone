import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Star, Clock, Calendar } from "lucide-react";

interface MovieCardProps {
  id: string;
  title: string;
  poster: string;
  genres: string[];
  rating: number;
  duration: string;
  releaseDate: string;
  language: string;
}

export const MovieCard = ({ 
  title, 
  poster, 
  genres, 
  rating, 
  duration, 
  releaseDate, 
  language 
}: MovieCardProps) => {
  return (
    <Card className="group bg-gradient-card border-border/50 overflow-hidden hover:shadow-cinema transition-all duration-500 hover:scale-105 hover:border-primary/50">
      <div className="relative aspect-[3/4] overflow-hidden">
        <img
          src={poster}
          alt={title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-cinema-dark/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <div className="absolute top-4 right-4 bg-cinema-dark/80 backdrop-blur-sm rounded-lg px-2 py-1 flex items-center gap-1">
          <Star className="w-4 h-4 text-cinema-gold fill-cinema-gold" />
          <span className="text-sm font-medium text-foreground">{rating}</span>
        </div>
        <Badge className="absolute top-4 left-4 bg-primary text-primary-foreground">
          {language}
        </Badge>
      </div>
      
      <div className="p-4 space-y-3">
        <div>
          <h3 className="font-bold text-lg text-foreground line-clamp-1 group-hover:text-primary transition-colors">
            {title}
          </h3>
          <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>{duration}</span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              <span>{releaseDate}</span>
            </div>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-1">
          {genres.slice(0, 3).map((genre) => (
            <Badge 
              key={genre} 
              variant="secondary" 
              className="text-xs bg-secondary/50 text-secondary-foreground border-secondary"
            >
              {genre}
            </Badge>
          ))}
        </div>
        
        <Button 
          className="w-full bg-gradient-accent hover:shadow-glow transition-all duration-300"
          size="sm"
        >
          Book Now
        </Button>
      </div>
    </Card>
  );
};