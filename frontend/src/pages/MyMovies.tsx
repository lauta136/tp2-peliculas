// Ruta privada "/mis-peliculas": cualquier usuario logueado gestiona SUS peliculas.
import { MovieManager } from "../components/MovieManager";

export const MyMovies = () => (
  <div className="flex flex-col gap-6">
    <header>
      <h1 className="font-display text-3xl font-extrabold">Mis películas</h1>
      <p className="text-ink-400">Lo que cargues acá aparece en el catálogo a tu nombre. Solo vos (o un admin) lo podés editar.</p>
    </header>
    <MovieManager scope="mine" />
  </div>
);
