import { MovieCard } from "./MovieCard";
import { Button } from "@/components/ui/button";
import { ArrowRight, Filter } from "lucide-react";
import { Movie } from "@/data/movies";

interface MovieSectionProps {
  title: string;
  movies: Movie[];
  showFilters?: boolean;
}

export const MovieSection = ({ title, movies, showFilters = false }: MovieSectionProps) => {
  return (
    <section className="py-12">
      <div className="container">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
              {title}
            </h2>
            <p className="text-muted-foreground">
              {movies.length} movies available
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            {showFilters && (
              <Button variant="outline" className="gap-2">
                <Filter className="w-4 h-4" />
                Filters
              </Button>
            )}
            <Button variant="ghost" className="gap-2 text-primary hover:text-primary">
              View All
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
          {movies.map((movie) => (
            <MovieCard key={movie.id} {...movie} />
          ))}
        </div>
      </div>
    </section>
  );
};