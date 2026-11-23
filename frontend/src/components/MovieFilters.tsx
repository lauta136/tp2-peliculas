// Buscador + filtros. El estado vive en la URL (?search=&genre=...): se puede compartir el link
// y F5 mantiene los filtros. El texto se aplica al enviar (Enter), no en cada tecla.
import { useState, type FormEvent } from "react";
import { GENRES, GENRE_LABELS, SORT_OPTIONS, type MovieListParams } from "../types/movie";

interface MovieFiltersProps {
  value: MovieListParams;
  onChange: (next: MovieListParams) => void;
}

export const MovieFilters = ({ value, onChange }: MovieFiltersProps) => {
  const [search, setSearch] = useState(value.search ?? "");

  const submit = (e: FormEvent) => {
    e.preventDefault();
    onChange({ ...value, search: search.trim() || undefined });
  };

  const watchedValue = value.watched === undefined ? "" : String(value.watched);
  const hasFilters = !!(value.search || value.genre || value.watched !== undefined);

  return (
    <div className="flex flex-col gap-3">
      <form onSubmit={submit} role="search" className="flex gap-2">
        <label htmlFor="search" className="sr-only">
          Buscar por título, director o sinopsis
        </label>
        <input
          id="search"
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por título, director o sinopsis…"
          className="input"
          maxLength={120}
        />
        <button type="submit" className="btn-primary shrink-0">
          Buscar
        </button>
      </form>

      <div className="flex flex-wrap items-center gap-2 text-sm">
        <select
          aria-label="Género"
          value={value.genre ?? ""}
          onChange={(e) => onChange({ ...value, genre: (e.target.value || undefined) as MovieListParams["genre"] })}
          className="input w-auto"
        >
          <option value="">Todos los géneros</option>
          {GENRES.map((g) => (
            <option key={g} value={g}>
              {GENRE_LABELS[g]}
            </option>
          ))}
        </select>

        <select
          aria-label="Vistas"
          value={watchedValue}
          onChange={(e) =>
            onChange({ ...value, watched: e.target.value === "" ? undefined : e.target.value === "true" })
          }
          className="input w-auto"
        >
          <option value="">Vistas y pendientes</option>
          <option value="true">Solo vistas</option>
          <option value="false">Solo pendientes</option>
        </select>

        <select
          aria-label="Ordenar por"
          value={`${value.sortBy ?? "createdAt"}:${value.sortOrder ?? "desc"}`}
          onChange={(e) => {
            const [sortBy, sortOrder] = e.target.value.split(":") as [MovieListParams["sortBy"], "asc" | "desc"];
            onChange({ ...value, sortBy, sortOrder });
          }}
          className="input w-auto"
        >
          {Object.entries(SORT_OPTIONS).map(([field, label]) => (
            <optgroup key={field} label={label}>
              <option value={`${field}:desc`}>
                {label} {field === "title" ? "(Z → A)" : "(mayor primero)"}
              </option>
              <option value={`${field}:asc`}>
                {label} {field === "title" ? "(A → Z)" : "(menor primero)"}
              </option>
            </optgroup>
          ))}
        </select>

        {hasFilters && (
          <button
            type="button"
            onClick={() => {
              setSearch("");
              onChange({ sortBy: value.sortBy, sortOrder: value.sortOrder, mine: value.mine });
            }}
            className="px-2 text-ink-400 underline-offset-4 hover:text-ink-100 hover:underline"
          >
            Limpiar filtros
          </button>
        )}
      </div>
    </div>
  );
};
