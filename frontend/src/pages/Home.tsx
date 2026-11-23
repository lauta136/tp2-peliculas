// Ruta publica "/": el catalogo con busqueda, filtros y paginacion (estado en la URL).
import { useSession } from "../lib/auth-client";
import { getErrorMessage } from "../lib/api";
import { useMovieParams } from "../lib/use-movie-params";
import { useGetMoviesQuery } from "../store/api";
import { MovieCard } from "../components/MovieCard";
import { MovieFilters } from "../components/MovieFilters";
import { Pagination } from "../components/Pagination";

export const Home = () => {
  const [params, setParams] = useMovieParams();
  const { data: session } = useSession();
  // isFetching (no isLoading): al cambiar de pagina se atenua el listado viejo en vez de vaciarlo.
  const { data, isLoading, isFetching, error } = useGetMoviesQuery({ ...params, limit: 12 });

  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col gap-2">
        <h1 className="font-display text-4xl font-extrabold tracking-tight sm:text-5xl">
          Lo que vimos, <span className="text-gold-400">lo que falta ver</span>.
        </h1>
        <p className="max-w-2xl text-ink-400">
          Un catálogo colaborativo: cada usuario carga sus películas, las puntúa y lleva la cuenta de las que
          ya vio. Buscá por título o director y filtrá por género.
        </p>
      </section>

      <MovieFilters key={params.search ?? ""} value={params} onChange={setParams} />

      {isLoading ? (
        <p className="text-ink-400">Cargando películas…</p>
      ) : error ? (
        <p className="text-red-300">No se pudieron cargar las películas: {getErrorMessage(error)}</p>
      ) : !data || data.data.length === 0 ? (
        <div className="card p-8 text-center text-ink-400">No encontramos películas con esos filtros.</div>
      ) : (
        <>
          <section
            aria-busy={isFetching}
            className={`grid grid-cols-2 gap-4 transition sm:grid-cols-3 lg:grid-cols-4 ${isFetching ? "opacity-60" : ""}`}
          >
            {data.data.map((movie) => (
              <MovieCard key={movie._id} movie={movie} isMine={movie.ownerId === session?.user.id} />
            ))}
          </section>
          <Pagination
            page={data.meta.page}
            totalPages={data.meta.totalPages}
            total={data.meta.total}
            onChange={(page) => {
              setParams({ ...params, page });
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
          />
        </>
      )}
    </div>
  );
};
