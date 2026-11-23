// Ruta publica "/peliculas/:id". El dueño (o un admin) ve ademas editar, eliminar y marcar como vista.
import { useState } from "react";
import { skipToken } from "@reduxjs/toolkit/query";
import { Link, useNavigate, useParams } from "react-router";
import { getErrorMessage } from "../lib/api";
import { useSession } from "../lib/auth-client";
import { formatDate, formatDuration, formatRating } from "../lib/format";
import { canModifyMovie } from "../lib/permissions";
import type { MovieFormValues } from "../schemas/movie.schema";
import {
  useDeleteMovieMutation,
  useGetMovieByIdQuery,
  usePatchMovieMutation,
  useUpdateMovieMutation,
} from "../store/api";
import { GENRE_LABELS } from "../types/movie";
import { Poster } from "../components/Poster";
import { MovieForm } from "../components/MovieForm";
import { FormError } from "../components/Field";

export const MovieDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: session } = useSession();
  // Cada id es una entrada distinta en la cache. skipToken = no pedir nada si no hay id.
  const { data: movie, isLoading, error } = useGetMovieByIdQuery(id ?? skipToken);
  const [updateMovie] = useUpdateMovieMutation();
  const [patchMovie, { isLoading: patching, error: patchError }] = usePatchMovieMutation();
  const [deleteMovie, { isLoading: deleting, error: deleteError }] = useDeleteMovieMutation();
  const [editing, setEditing] = useState(false);

  if (isLoading) return <p className="text-ink-400">Cargando película…</p>;

  if (error || !movie) {
    const notFound = error && "status" in error && error.status === 404;
    return (
      <section className="card mx-auto max-w-md p-8 text-center">
        <h2 className="text-xl font-semibold">{notFound ? "Película no encontrada" : "No se pudo cargar la película"}</h2>
        {!notFound && <p className="mt-2 text-ink-400">{getErrorMessage(error)}</p>}
        <Link to="/" className="btn-ghost mt-6">
          Volver al catálogo
        </Link>
      </section>
    );
  }

  const canModify = canModifyMovie(session?.user, movie);

  const handleSave = async (values: MovieFormValues) => {
    await updateMovie({ id: movie._id, values }).unwrap();
    setEditing(false);
  };

  const handleDelete = async () => {
    if (!window.confirm(`¿Eliminar “${movie.title}”? No se puede deshacer.`)) return;
    const result = await deleteMovie(movie._id);
    if (!result.error) navigate("/", { replace: true });
  };

  const facts = [
    ["Director", movie.director],
    ["Género", GENRE_LABELS[movie.genre]],
    ["Estreno", formatDate(movie.releaseDate)],
    ["Duración", formatDuration(movie.durationMinutes)],
    ["Estado", movie.watched ? "Vista" : "Pendiente"],
    ["Cargada por", movie.ownerName],
  ];

  return (
    <article className="flex flex-col gap-6">
      <Link to="/" className="text-sm text-ink-400 hover:text-ink-100">
        ← Volver al catálogo
      </Link>

      <div className="grid gap-8 md:grid-cols-[280px_1fr]">
        <div className="mx-auto w-full max-w-60 overflow-hidden rounded-2xl border border-ink-700/60 shadow-2xl shadow-black/50 md:max-w-none">
          <Poster movie={movie} />
        </div>

        <div className="flex flex-col gap-5">
          <div>
            <h1 className="font-display text-4xl font-extrabold tracking-tight">{movie.title}</h1>
            <p className="mt-1 text-ink-400">
              {new Date(movie.releaseDate).getUTCFullYear()} · {movie.director}
            </p>
          </div>

          <div className="flex items-end gap-2">
            <span className="font-display text-5xl font-extrabold text-gold-400">{formatRating(movie.rating)}</span>
            <span className="pb-1.5 text-ink-400">/ 10</span>
          </div>

          {movie.synopsis && <p className="max-w-2xl leading-relaxed text-ink-200">{movie.synopsis}</p>}

          <dl className="grid max-w-lg grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
            {facts.map(([label, value]) => (
              <div key={label} className="contents">
                <dt className="text-ink-400">{label}</dt>
                <dd className="text-ink-100">{value}</dd>
              </div>
            ))}
          </dl>

          {canModify && (
            <div className="flex flex-wrap gap-2 pt-2">
              <button
                type="button"
                disabled={patching}
                onClick={() => patchMovie({ id: movie._id, values: { watched: !movie.watched } })}
                className="btn-ghost"
              >
                {movie.watched ? "Marcar como pendiente" : "Marcar como vista"}
              </button>
              <button type="button" onClick={() => setEditing((v) => !v)} className="btn-ghost">
                {editing ? "Cerrar edición" : "Editar"}
              </button>
              <button type="button" disabled={deleting} onClick={handleDelete} className="btn-danger">
                Eliminar
              </button>
            </div>
          )}
          <FormError message={patchError || deleteError ? getErrorMessage(patchError ?? deleteError) : undefined} />
        </div>
      </div>

      {canModify && editing && <MovieForm movie={movie} onSave={handleSave} onCancel={() => setEditing(false)} />}
    </article>
  );
};
