import { z } from "zod";
import { GENRES } from "../models/Movie.js";

export const ALLOWED_SORT_FIELDS = ["createdAt", "title", "releaseDate", "rating", "durationMinutes"] as const;

// Los query params llegan siempre como texto ("true", "2"). Acepta tambien booleanos reales
// (asi el agente puede reusar el mismo schema).
const booleanish = z.preprocess(
  (value) => (value === "true" ? true : value === "false" ? false : value),
  z.boolean({ error: "Debe ser true o false" })
);

// GET /api/movies?search=&genre=&watched=&mine=&page=&limit=&sortBy=&sortOrder=
export const listMoviesSchema = z.object({
  page: z.coerce.number().int().min(1, { error: "La pagina minima es 1" }).default(1),
  limit: z.coerce.number().int().min(1).max(50, { error: "Maximo 50 resultados por pagina" }).default(12),
  sortBy: z.enum(ALLOWED_SORT_FIELDS).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
  search: z.string().trim().min(1).max(120).optional(),
  genre: z.enum(GENRES, { error: `El genero debe ser uno de: ${GENRES.join(", ")}` }).optional(),
  watched: booleanish.optional(),
  // mine=true → solo las peliculas del usuario logueado (requiere sesion).
  mine: booleanish.optional(),
});

// "2010-07-16" (input date del form) o ISO completo; no puede ser absurda.
const releaseDate = z.coerce
  .date({ error: "La fecha de estreno no es valida" })
  .min(new Date("1888-01-01"), { error: "La fecha de estreno es anterior al cine" })
  .max(new Date("2100-01-01"), { error: "La fecha de estreno es demasiado lejana" });

export const createMovieSchema = z.object({
  title: z.string({ error: "El titulo es obligatorio" }).trim().min(1, { error: "El titulo es obligatorio" }).max(150),
  director: z
    .string({ error: "El director es obligatorio" })
    .trim()
    .min(1, { error: "El director es obligatorio" })
    .max(100),
  genre: z.enum(GENRES, { error: `El genero debe ser uno de: ${GENRES.join(", ")}` }),
  releaseDate,
  durationMinutes: z
    .number({ error: "La duracion debe ser un numero" })
    .int({ error: "La duracion debe ser un numero entero" })
    .min(1, { error: "La duracion minima es 1 minuto" })
    .max(600, { error: "La duracion maxima es 600 minutos" }),
  rating: z
    .number({ error: "El puntaje debe ser un numero" })
    .min(0, { error: "El puntaje va de 0 a 10" })
    .max(10, { error: "El puntaje va de 0 a 10" }),
  watched: z.boolean({ error: "Vista debe ser true o false" }).default(false),
  synopsis: z.string().trim().max(1000, { error: "Maximo 1000 caracteres" }).default(""),
  posterUrl: z
    .union([z.url({ protocol: /^https?$/, error: "La URL del poster no es valida" }), z.literal("")])
    .optional(),
});

// PUT reemplaza el recurso: mismos campos obligatorios que crear.
export const replaceMovieSchema = createMovieSchema;

// PATCH actualiza parcialmente: sin defaults (si no, mandaria watched:false sin que se pida).
export const updateMovieSchema = z
  .object({
    ...createMovieSchema.shape,
    watched: z.boolean({ error: "Vista debe ser true o false" }),
    synopsis: z.string().trim().max(1000, { error: "Maximo 1000 caracteres" }),
  })
  .partial()
  .refine((data) => Object.keys(data).length > 0, { error: "Envia al menos un campo para actualizar" });

export type ListMoviesInput = z.infer<typeof listMoviesSchema>;
export type CreateMovieInput = z.infer<typeof createMovieSchema>;
export type UpdateMovieInput = z.infer<typeof updateMovieSchema>;
