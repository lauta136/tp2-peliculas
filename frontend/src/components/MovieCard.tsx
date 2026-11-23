// Presentacional: toda la card es un <Link> al detalle (/peliculas/:id).
import { Link } from "react-router";
import { GENRE_LABELS, type Movie } from "../types/movie";
import { formatRating, yearOf } from "../lib/format";
import { Poster } from "./Poster";

export const RatingBadge = ({ rating }: { rating: number }) => (
  <span className="inline-flex items-center gap-1 rounded-md bg-ink-950/80 px-1.5 py-0.5 text-xs font-semibold text-gold-400 backdrop-blur">
    <span aria-hidden="true">★</span>
    <span className="sr-only">Puntaje</span>
    {formatRating(rating)}
  </span>
);

export const MovieCard = ({ movie, isMine }: { movie: Movie; isMine?: boolean }) => (
  <Link
    to={`/peliculas/${movie._id}`}
    className="group flex flex-col overflow-hidden rounded-xl border border-ink-700/60 bg-ink-900 transition hover:-translate-y-1 hover:border-gold-400/50 hover:shadow-lg hover:shadow-black/40"
  >
    <div className="relative">
      <Poster movie={movie} className="transition duration-300 group-hover:scale-[1.03]" />
      <div className="absolute top-2 left-2 flex gap-1">
        <RatingBadge rating={movie.rating} />
      </div>
      {movie.watched && (
        <span className="absolute top-2 right-2 rounded-md bg-emerald-500/90 px-1.5 py-0.5 text-xs font-medium text-ink-950">
          Vista
        </span>
      )}
    </div>
    <div className="flex flex-1 flex-col gap-1 p-3">
      <h3 className="line-clamp-2 font-semibold text-ink-100 group-hover:text-gold-300">{movie.title}</h3>
      <p className="text-xs text-ink-400">
        {yearOf(movie.releaseDate)} · {GENRE_LABELS[movie.genre]}
      </p>
      {isMine && <p className="mt-auto pt-1 text-xs text-gold-400/80">Cargada por vos</p>}
    </div>
  </Link>
);
