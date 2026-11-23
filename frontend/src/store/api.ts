// RTK Query: estado del SERVIDOR (peliculas). Cada endpoint genera un hook con cache incluida.
import { createApi, type BaseQueryFn } from "@reduxjs/toolkit/query/react";
import type { AxiosRequestConfig } from "axios";
import { api as http, toApiError, type ApiError } from "../lib/api";
import type { MovieFormValues } from "../schemas/movie.schema";
import type { Movie, MovieListParams, MovieStats, Paginated } from "../types/movie";

// Usa la instancia de axios con baseURL /api. El error se guarda como ApiError (message + details).
const axiosBaseQuery: BaseQueryFn<AxiosRequestConfig, unknown, ApiError> = async (config) => {
  try {
    const { data } = await http.request(config);
    return { data };
  } catch (err) {
    return { error: toApiError(err) };
  }
};

// Saca los filtros vacios: ?search=&genre= no aporta nada a la URL.
const cleanParams = (params: MovieListParams) =>
  Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== ""));

// posterUrl vacio no se manda: en un PUT, que falte significa "sin poster" (el back lo borra).
const toBody = ({ posterUrl, ...rest }: MovieFormValues) => (posterUrl ? { ...rest, posterUrl } : rest);

export interface AppConfig {
  socialProviders: { github: boolean; google: boolean };
  agent: boolean;
}

export const moviesApi = createApi({
  reducerPath: "moviesApi",
  baseQuery: axiosBaseQuery,
  // Las queries "proveen" el tag y las mutations lo "invalidan" → RTK Query vuelve a pedir solo.
  tagTypes: ["Movies"],
  endpoints: (build) => ({
    getMovies: build.query<Paginated<Movie>, MovieListParams>({
      query: (params) => ({ url: "/movies", params: cleanParams(params) }),
      providesTags: ["Movies"],
    }),
    getMovieById: build.query<Movie, string>({
      query: (id) => ({ url: `/movies/${id}` }),
      providesTags: ["Movies"],
    }),
    createMovie: build.mutation<Movie, MovieFormValues>({
      query: (values) => ({ url: "/movies", method: "POST", data: toBody(values) }),
      invalidatesTags: ["Movies"],
    }),
    // PUT: el form siempre manda todos los campos.
    updateMovie: build.mutation<Movie, { id: string; values: MovieFormValues }>({
      query: ({ id, values }) => ({ url: `/movies/${id}`, method: "PUT", data: toBody(values) }),
      invalidatesTags: ["Movies"],
    }),
    // PATCH: cambiar un solo campo (ej: marcar como vista desde el detalle).
    patchMovie: build.mutation<Movie, { id: string; values: Partial<MovieFormValues> }>({
      query: ({ id, values }) => ({ url: `/movies/${id}`, method: "PATCH", data: values }),
      invalidatesTags: ["Movies"],
    }),
    deleteMovie: build.mutation<void, string>({
      query: (id) => ({ url: `/movies/${id}`, method: "DELETE" }),
      invalidatesTags: ["Movies"],
    }),
    // Solo admin: el back responde 403 a cualquier otro rol.
    getMovieStats: build.query<MovieStats, void>({
      query: () => ({ url: "/movies/stats" }),
      providesTags: ["Movies"],
    }),
    getConfig: build.query<AppConfig, void>({
      query: () => ({ url: "/config" }),
    }),
  }),
});

export const {
  useGetMoviesQuery,
  useGetMovieByIdQuery,
  useCreateMovieMutation,
  useUpdateMovieMutation,
  usePatchMovieMutation,
  useDeleteMovieMutation,
  useGetConfigQuery,
  useGetMovieStatsQuery,
} = moviesApi;
