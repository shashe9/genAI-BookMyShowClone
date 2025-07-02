import { Header } from "@/components/Header";
import { HeroSection } from "@/components/HeroSection";
import { MovieSection } from "@/components/MovieSection";
import { featuredMovies, recommendedMovies } from "@/data/movies";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <HeroSection />
      <MovieSection 
        title="Featured Movies" 
        movies={featuredMovies} 
        showFilters={true}
      />
      <MovieSection 
        title="Recommended for You" 
        movies={recommendedMovies}
      />
    </div>
  );
};

export default Index;
