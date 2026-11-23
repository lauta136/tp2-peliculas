// Misma forma que IMovie en el backend (backend/src/models/Movie.ts).
export const GENRES = [
  "Accion",
  "Animacion",
  "Ciencia ficcion",
  "Comedia",
  "Documental",
  "Drama",
  "Fantasia",
  "Romance",
  "Suspenso",
  "Terror",
  "Otro",
] as const;

export type Genre = (typeof GENRES)[number];

// El backend guarda el genero sin tildes (valor del enum); aca va como se muestra.
export const GENRE_LABELS: Record<Genre, string> = {
  Accion: "Acción",
  Animacion: "Animación",
  "Ciencia ficcion": "Ciencia ficción",
  Comedia: "Comedia",
  Documental: "Documental",
  Drama: "Drama",
  Fantasia: "Fantasía",
  Romance: "Romance",
  Suspenso: "Suspenso",
  Terror: "Terror",
  Otro: "Otro",
};

export interface Movie {
  _id: string;
  title: string;
  director: string;
  genre: Genre;
  releaseDate: string;
  durationMinutes: number;
  rating: number;
  watched: boolean;
  synopsis: string;
  posterUrl?: string;
  ownerId: string;
  ownerName: string;
  createdAt: string;
  updatedAt: string;
}

export const SORT_OPTIONS = {
  createdAt: "Agregadas recientemente",
  rating: "Puntaje",
  releaseDate: "Fecha de estreno",
  title: "Título",
  durationMinutes: "Duración",
} as const;

export type SortField = keyof typeof SORT_OPTIONS;

export interface MovieListParams {
  page?: number;
  limit?: number;
  search?: string;
  genre?: Genre;
  watched?: boolean;
  mine?: boolean;
  sortBy?: SortField;
  sortOrder?: "asc" | "desc";
}

// Envelope de los listados paginados del backend: { data, meta }.
export interface Paginated<T> {
  data: T[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}
