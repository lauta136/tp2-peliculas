// ABM de peliculas. Lo usan dos pantallas:
//   - /mis-peliculas (scope "mine"): un user gestiona solo las suyas.
//   - /admin         (scope "all"):  el admin gestiona todas, con su dueño a la vista.
import { useRef, useState } from "react";
import { Link } from "react-router";
import { getErrorMessage } from "../lib/api";
import { formatRating, yearOf } from "../lib/format";
import type { MovieFormValues } from "../schemas/movie.schema";
import {
  useCreateMovieMutation,
  useDeleteMovieMutation,
  useGetMoviesQuery,
  useUpdateMovieMutation,
} from "../store/api";
import { GENRE_LABELS, type Movie } from "../types/movie";
import { FormError } from "./Field";
import { MovieForm } from "./MovieForm";
import { Pagination } from "./Pagination";

interface MovieManagerProps {
  scope: "mine" | "all";
}

export const MovieManager = ({ scope }: MovieManagerProps) => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  // Estado de UI de esta pantalla: no es global, se queda en useState.
  const [editing, setEditing] = useState<Movie | null>(null);
  const formRef = useRef<HTMLDivElement>(null);

  const { data, isLoading, error: loadError } = useGetMoviesQuery({
    page,
    limit: 10,
    mine: scope === "mine" || undefined,
    search: query || undefined,
    sortBy: "createdAt",
    sortOrder: "desc",
  });
  const [createMovie] = useCreateMovieMutation();
  const [updateMovie] = useUpdateMovieMutation();
  const [deleteMovie, { error: deleteError }] = useDeleteMovieMutation();

  // unwrap() lanza el error para que lo muestre el form. Las mutations invalidan el tag "Movies"
  // y RTK Query vuelve a pedir el listado solo.
  const handleSave = async (values: MovieFormValues) => {
    if (editing) {
      await updateMovie({ id: editing._id, values }).unwrap();
      setEditing(null);
    } else {
      await createMovie(values).unwrap();
      setPage(1);
    }
  };

  const handleEdit = (movie: Movie) => {
    setEditing(movie);
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleDelete = async (movie: Movie) => {
    if (!window.confirm(`¿Eliminar “${movie.title}”? No se puede deshacer.`)) return;
    const result = await deleteMovie(movie._id);
    if (!result.error && editing?._id === movie._id) setEditing(null);
  };

  const movies = data?.data ?? [];
  const error = loadError ?? deleteError;

  return (
    <div className="flex flex-col gap-6">
      <div ref={formRef} className="scroll-mt-24">
        <MovieForm movie={editing} onSave={handleSave} onCancel={() => setEditing(null)} />
      </div>

      <section className="card flex flex-col gap-4 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="font-display text-xl font-semibold">
            {scope === "mine" ? "Tus películas" : "Todas las películas"}
            {data && <span className="ml-2 text-sm font-normal text-ink-400">({data.meta.total})</span>}
          </h3>
          <form
            role="search"
            onSubmit={(e) => {
              e.preventDefault();
              setQuery(search.trim());
              setPage(1);
            }}
            className="flex gap-2"
          >
            <input
              type="search"
              aria-label="Buscar"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar…"
              className="input w-48"
            />
            <button type="submit" className="btn-ghost">
              Buscar
            </button>
          </form>
        </div>

        <FormError message={error ? getErrorMessage(error) : undefined} />

        {isLoading ? (
          <p className="text-ink-400">Cargando…</p>
        ) : movies.length === 0 ? (
          <p className="text-ink-400">
            {query
              ? "No hay resultados para esa búsqueda."
              : scope === "mine"
                ? "Todavía no cargaste películas. Usá el formulario de arriba."
                : "Todavía no hay películas cargadas."}
          </p>
        ) : (
          <ul className="divide-y divide-ink-700/60">
            {movies.map((movie) => (
              <li
                key={movie._id}
                className={`flex flex-wrap items-center justify-between gap-3 py-3 ${editing?._id === movie._id ? "bg-gold-950/40" : ""}`}
              >
                <div className="min-w-0">
                  <Link to={`/peliculas/${movie._id}`} className="font-medium text-ink-100 hover:text-gold-300">
                    {movie.title}
                  </Link>
                  <p className="text-sm text-ink-400">
                    {yearOf(movie.releaseDate)} · {GENRE_LABELS[movie.genre]} · ★ {formatRating(movie.rating)} ·{" "}
                    {movie.watched ? "Vista" : "Pendiente"}
                    {scope === "all" && <> · cargada por {movie.ownerName}</>}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={() => handleEdit(movie)} className="btn-ghost px-3 py-1">
                    Editar
                  </button>
                  <button type="button" onClick={() => handleDelete(movie)} className="btn-danger px-3 py-1">
                    Eliminar
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}

        {data && (
          <Pagination
            page={data.meta.page}
            totalPages={data.meta.totalPages}
            total={data.meta.total}
            onChange={setPage}
          />
        )}
      </section>
    </div>
  );
};
