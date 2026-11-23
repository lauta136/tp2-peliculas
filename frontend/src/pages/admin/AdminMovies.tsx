// /admin: estadisticas del catalogo (GET /api/movies/stats, solo admin) + ABM de TODAS las peliculas.
import { MovieManager } from "../../components/MovieManager";
import { formatRating } from "../../lib/format";
import { useGetMovieStatsQuery } from "../../store/api";
import { GENRE_LABELS } from "../../types/movie";

const Stat = ({ label, value }: { label: string; value: string | number }) => (
  <div className="card p-4">
    <p className="text-xs tracking-wide text-ink-400 uppercase">{label}</p>
    <p className="mt-1 font-display text-3xl font-extrabold text-gold-400">{value}</p>
  </div>
);

const CatalogStats = () => {
  const { data: stats } = useGetMovieStatsQuery();
  if (!stats) return null;

  const watchedPct = stats.total ? Math.round((stats.watched / stats.total) * 100) : 0;
  const maxGenre = Math.max(1, ...stats.byGenre.map((g) => g.count));

  return (
    <section aria-label="Estadísticas del catálogo" className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Películas" value={stats.total} />
        <Stat label="Vistas" value={`${watchedPct}%`} />
        <Stat label="Puntaje promedio" value={formatRating(stats.averageRating)} />
        <Stat label="Géneros" value={stats.byGenre.length} />
      </div>
      <div className="grid gap-3 md:grid-cols-[2fr_1fr]">
        <div className="card p-4">
          <h2 className="mb-3 text-sm font-medium text-ink-200">Películas por género</h2>
          <ul className="flex flex-col gap-1.5">
            {stats.byGenre.map(({ genre, count }) => (
              <li key={genre} className="grid grid-cols-[8rem_1fr_2rem] items-center gap-2 text-sm">
                <span className="truncate text-ink-400">{GENRE_LABELS[genre] ?? genre}</span>
                <span className="h-2 rounded-full bg-ink-800">
                  <span className="block h-2 rounded-full bg-gold-400" style={{ width: `${(count / maxGenre) * 100}%` }} />
                </span>
                <span className="text-right text-ink-200 tabular-nums">{count}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="card p-4">
          <h2 className="mb-3 text-sm font-medium text-ink-200">Quiénes más cargaron</h2>
          <ol className="flex flex-col gap-1.5 text-sm">
            {stats.topContributors.map(({ name, count }) => (
              <li key={name} className="flex justify-between gap-2">
                <span className="truncate text-ink-200">{name}</span>
                <span className="text-ink-400 tabular-nums">{count}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
};

export const AdminMovies = () => (
  <div className="flex flex-col gap-6">
    <CatalogStats />
    <MovieManager scope="all" />
  </div>
);
