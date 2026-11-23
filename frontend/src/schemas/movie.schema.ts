import { z } from "zod";
import { GENRES, type Movie } from "../types/movie";

// Mismas reglas que createMovieSchema del backend: el form avisa antes de mandar,
// y si igual el back devuelve 400, los errores por campo se muestran en el mismo lugar.
export const movieSchema = z.object({
  title: z.string().trim().min(1, { error: "El título es obligatorio" }).max(150, { error: "Máximo 150 caracteres" }),
  director: z.string().trim().min(1, { error: "El director es obligatorio" }).max(100, { error: "Máximo 100 caracteres" }),
  genre: z.enum(GENRES, { error: "Elegí un género" }),
  // <input type="date"> devuelve "AAAA-MM-DD" o "" si esta vacio.
  releaseDate: z
    .string()
    .min(1, { error: "La fecha de estreno es obligatoria" })
    .refine((v) => v >= "1888-01-01" && v <= "2100-01-01", { error: "La fecha no es válida" }),
  // register(..., { valueAsNumber: true }): un input vacio llega como NaN → "debe ser un numero".
  durationMinutes: z
    .number({ error: "Ingresá la duración en minutos" })
    .int({ error: "Debe ser un número entero" })
    .min(1, { error: "Mínimo 1 minuto" })
    .max(600, { error: "Máximo 600 minutos" }),
  rating: z
    .number({ error: "Ingresá un puntaje" })
    .min(0, { error: "El puntaje va de 0 a 10" })
    .max(10, { error: "El puntaje va de 0 a 10" }),
  watched: z.boolean(),
  synopsis: z.string().trim().max(1000, { error: "Máximo 1000 caracteres" }),
  posterUrl: z.union([z.url({ protocol: /^https?$/, error: "La URL no es válida" }), z.literal("")]),
});

export type MovieFormValues = z.infer<typeof movieSchema>;

// defaultValues: los numericos arrancan en NaN (input vacio) para que el usuario los complete.
export const emptyMovie = {
  title: "",
  director: "",
  genre: "" as unknown as MovieFormValues["genre"],
  releaseDate: "",
  durationMinutes: Number.NaN,
  rating: Number.NaN,
  watched: false,
  synopsis: "",
  posterUrl: "",
} satisfies MovieFormValues;

export const toMovieFormValues = (m: Movie): MovieFormValues => ({
  title: m.title,
  director: m.director,
  genre: m.genre,
  releaseDate: m.releaseDate.slice(0, 10),
  durationMinutes: m.durationMinutes,
  rating: m.rating,
  watched: m.watched,
  synopsis: m.synopsis ?? "",
  posterUrl: m.posterUrl ?? "",
});
