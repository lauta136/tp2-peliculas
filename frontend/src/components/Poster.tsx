// Poster de la pelicula. Sin posterUrl (o si la imagen falla) arma uno tipografico con el titulo,
// con un color por genero: el catalogo se ve completo aunque nadie cargue imagenes.
import { useState } from "react";
import type { Genre, Movie } from "../types/movie";

const GENRE_GRADIENTS: Record<Genre, string> = {
  Accion: "from-orange-600 to-red-900",
  Animacion: "from-sky-500 to-indigo-800",
  "Ciencia ficcion": "from-cyan-500 to-blue-950",
  Comedia: "from-yellow-400 to-orange-700",
  Documental: "from-stone-400 to-stone-800",
  Drama: "from-rose-700 to-slate-900",
  Fantasia: "from-fuchsia-500 to-violet-900",
  Romance: "from-pink-400 to-rose-800",
  Suspenso: "from-slate-500 to-zinc-950",
  Terror: "from-red-800 to-black",
  Otro: "from-emerald-600 to-teal-900",
};

interface PosterProps {
  movie: Pick<Movie, "title" | "genre" | "posterUrl" | "director">;
  className?: string;
}

export const Poster = ({ movie, className = "" }: PosterProps) => {
  const [failed, setFailed] = useState(false);

  if (movie.posterUrl && !failed) {
    return (
      <img
        src={movie.posterUrl}
        alt={`Poster de ${movie.title}`}
        loading="lazy"
        onError={() => setFailed(true)}
        className={`aspect-[2/3] w-full object-cover ${className}`}
      />
    );
  }

  return (
    <div
      aria-hidden="true"
      className={`relative flex aspect-[2/3] w-full flex-col justify-end overflow-hidden bg-gradient-to-br p-4 ${GENRE_GRADIENTS[movie.genre]} ${className}`}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.18),transparent_55%)]" />
      <p className="relative font-display text-xl leading-tight font-extrabold text-white drop-shadow line-clamp-4">
        {movie.title}
      </p>
      <p className="relative mt-1 text-xs tracking-wide text-white/70 uppercase">{movie.director}</p>
    </div>
  );
};
