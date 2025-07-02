import movie1 from "@/assets/movie1.jpg";
import movie2 from "@/assets/movie2.jpg";
import movie3 from "@/assets/movie3.jpg";
import movie4 from "@/assets/movie4.jpg";
import movie5 from "@/assets/movie5.jpg";
import movie6 from "@/assets/movie6.jpg";

export interface Movie {
  id: string;
  title: string;
  poster: string;
  genres: string[];
  rating: number;
  duration: string;
  releaseDate: string;
  language: string;
  description: string;
}

export const featuredMovies: Movie[] = [
  {
    id: "1",
    title: "Dark Knight Returns",
    poster: movie1,
    genres: ["Action", "Thriller", "Superhero"],
    rating: 8.9,
    duration: "2h 45m",
    releaseDate: "2024-01-15",
    language: "English",
    description: "The ultimate superhero returns to save the city from darkness."
  },
  {
    id: "2",
    title: "Love Actually Forever",
    poster: movie2,
    genres: ["Romance", "Comedy", "Drama"],
    rating: 7.8,
    duration: "2h 10m",
    releaseDate: "2024-02-14",
    language: "English",
    description: "A heartwarming tale of love that transcends all boundaries."
  },
  {
    id: "3",
    title: "Galaxy Quest 2049",
    poster: movie3,
    genres: ["Sci-Fi", "Adventure", "Action"],
    rating: 8.5,
    duration: "2h 30m",
    releaseDate: "2024-03-22",
    language: "English",
    description: "An epic space adventure that takes you to distant galaxies."
  },
  {
    id: "4",
    title: "Midnight Terror",
    poster: movie4,
    genres: ["Horror", "Thriller", "Mystery"],
    rating: 7.2,
    duration: "1h 55m",
    releaseDate: "2024-04-05",
    language: "English",
    description: "A spine-chilling horror that will keep you on the edge."
  },
  {
    id: "5",
    title: "Wonder Pets Adventure",
    poster: movie5,
    genres: ["Animation", "Family", "Adventure"],
    rating: 8.1,
    duration: "1h 30m",
    releaseDate: "2024-05-01",
    language: "English",
    description: "Join the wonder pets on their most amazing adventure yet."
  },
  {
    id: "6",
    title: "The Last Stand",
    poster: movie6,
    genres: ["Drama", "Action", "Western"],
    rating: 8.3,
    duration: "2h 20m",
    releaseDate: "2024-06-10",
    language: "English",
    description: "A powerful drama about courage and standing up for what's right."
  }
];

export const recommendedMovies: Movie[] = [
  ...featuredMovies.slice(0, 4)
];