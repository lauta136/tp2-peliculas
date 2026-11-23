// Lee y escribe los filtros del listado en la URL (?page=2&genre=Drama...).
import { useSearchParams } from "react-router";
import { GENRES, SORT_OPTIONS, type Genre, type MovieListParams, type SortField } from "../types/movie";

export function useMovieParams(): [MovieListParams, (next: MovieListParams) => void] {
  const [searchParams, setSearchParams] = useSearchParams();

  const genre = searchParams.get("genre");
  const watched = searchParams.get("watched");
  const sortBy = searchParams.get("sortBy");
  const sortOrder = searchParams.get("sortOrder");

  // Valores invalidos en la URL (editada a mano) se ignoran en vez de mandarlos al back.
  const params: MovieListParams = {
    page: Math.max(1, Number(searchParams.get("page")) || 1),
    search: searchParams.get("search") || undefined,
    genre: GENRES.includes(genre as Genre) ? (genre as Genre) : undefined,
    watched: watched === "true" ? true : watched === "false" ? false : undefined,
    sortBy: sortBy && sortBy in SORT_OPTIONS ? (sortBy as SortField) : undefined,
    sortOrder: sortOrder === "asc" || sortOrder === "desc" ? sortOrder : undefined,
  };

  const setParams = (next: MovieListParams) => {
    const entries = Object.entries({ ...next, mine: undefined, limit: undefined })
      .filter(([key, v]) => v !== undefined && v !== "" && !(key === "page" && v === 1))
      .map(([k, v]) => [k, String(v)]);
    setSearchParams(new URLSearchParams(entries));
  };

  return [params, setParams];
}
