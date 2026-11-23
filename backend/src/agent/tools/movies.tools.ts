// Las tools (las "manos" del agente). Una tool = funcion + nombre + descripcion + schema Zod.
// El LLM NO ejecuta nada: decide llamarla y devuelve los argumentos; LangChain valida y ejecuta.
// Cada tool llama al MISMO service que la API REST, y las de escritura chequean los permisos
// ADENTRO (canModifyMovie), igual que el controller: el prompt se puede saltear, este if no.
import { tool, type ToolRuntime } from "langchain";
import { z } from "zod";
import { isValidObjectId } from "mongoose";
import * as moviesService from "../../services/movies.service.js";
import { createMovieSchema, listMoviesSchema, updateMovieSchema, ALLOWED_SORT_FIELDS } from "../../schemas/movie.schema.js";
import { GENRES, IMovieDocument } from "../../models/Movie.js";
import { canModifyMovie } from "../../lib/permissions.js";
import { AgentContext } from "../context.js";
import { withoutNulls } from "./without-nulls.js";

const MAX_RESULTS = 20;
const FORBIDDEN = "Permiso denegado: solo el usuario que cargo la pelicula o un administrador pueden modificarla.";

// Solo lo que el modelo necesita: menos tokens y nada interno (__v, ownerId).
function toPublic(m: IMovieDocument, userId?: string) {
  return {
    id: m._id.toString(),
    title: m.title,
    director: m.director,
    genre: m.genre,
    releaseDate: m.releaseDate.toISOString().slice(0, 10),
    durationMinutes: m.durationMinutes,
    rating: m.rating,
    watched: m.watched,
    synopsis: m.synopsis,
    loadedBy: m.ownerName,
    isMine: m.ownerId === userId,
  };
}

// Los errores esperables se DEVUELVEN como texto (no se tiran): el LLM los lee y se los explica al usuario.
function validationMessage(error: unknown): string | null {
  if (error instanceof z.ZodError) return `Datos invalidos: ${error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ")}`;
  if (error instanceof Error && error.name === "ValidationError") return `Datos invalidos: ${error.message}`;
  return null;
}

export const listMoviesTool = tool(
  async (args, runtime: ToolRuntime<unknown, AgentContext>) => {
    const userId = runtime.context?.user.id;
    const { mine, ...filters } = withoutNulls(args);
    const input = listMoviesSchema.parse({ ...filters, limit: MAX_RESULTS });
    const { data, meta } = await moviesService.listMovies(input, mine ? userId : undefined);
    console.log(`[tool] list_movies ${JSON.stringify(args)} → ${data.length} de ${meta.total}`);
    return JSON.stringify({ total: meta.total, shown: data.length, movies: data.map((m) => toPublic(m, userId)) });
  },
  {
    name: "list_movies",
    description:
      "Lista peliculas del catalogo. Filtros opcionales: texto a buscar en titulo/director/sinopsis, genero, " +
      "si ya fue vista, solo las del usuario (mine) y orden. Devuelve el total y hasta 20 resultados.",
    // .optional() y no .nullish(): Gemini rechaza los tipos ["boolean","null"] que genera nullish.
    // Si igual manda null o "" en un filtro, withoutNulls lo descarta.
    schema: z.object({
      search: z.string().trim().max(120).optional().describe("Texto a buscar, ej: 'Nolan'"),
      genre: z.enum(GENRES).optional().describe("Genero exacto"),
      watched: z.boolean().optional().describe("true = solo vistas, false = solo pendientes"),
      mine: z.boolean().optional().describe("true = solo las peliculas que cargo el usuario actual"),
      sortBy: z.enum(ALLOWED_SORT_FIELDS).optional().describe("Campo de orden, ej: 'rating' para las mejores"),
      sortOrder: z.enum(["asc", "desc"]).optional(),
    }),
  }
);

export const getMovieTool = tool(
  async ({ id }, runtime: ToolRuntime<unknown, AgentContext>) => {
    if (!isValidObjectId(id)) return "El id no es valido.";
    const movie = await moviesService.findMovieById(id);
    return movie ? JSON.stringify(toPublic(movie, runtime.context?.user.id)) : "No existe una pelicula con ese id.";
  },
  {
    name: "get_movie",
    description: "Trae una pelicula por su id (obtenido con list_movies).",
    schema: z.object({ id: z.string().describe("El id de la pelicula") }),
  }
);

export const createMovieTool = tool(
  async (args, runtime: ToolRuntime<unknown, AgentContext>) => {
    const user = runtime.context?.user;
    if (!user) return "Hace falta iniciar sesion.";
    try {
      const movie = await moviesService.createMovie(createMovieSchema.parse(withoutNulls(args)), {
        id: user.id,
        name: user.name,
      });
      console.log(`[tool] create_movie → ${movie._id} por ${user.email}`);
      return `Pelicula creada: ${JSON.stringify(toPublic(movie, user.id))}`;
    } catch (error) {
      const message = validationMessage(error);
      if (message) return message;
      throw error;
    }
  },
  {
    name: "create_movie",
    description:
      "Agrega una pelicula a nombre del usuario actual. Usala SOLO si el usuario lo pide explicitamente y " +
      "dio titulo, director, genero, fecha de estreno, duracion y puntaje. Si falta alguno, pedile el dato.",
    schema: z.object({
      title: z.string().describe("Titulo"),
      director: z.string().describe("Director"),
      genre: z.enum(GENRES).describe("Genero"),
      releaseDate: z.string().describe("Fecha de estreno en formato AAAA-MM-DD"),
      durationMinutes: z.number().int().describe("Duracion en minutos"),
      rating: z.number().describe("Puntaje de 0 a 10"),
      watched: z.boolean().optional().describe("Si el usuario ya la vio"),
      synopsis: z.string().optional().describe("Sinopsis breve"),
    }),
  }
);

export const updateMovieTool = tool(
  async ({ id, ...changes }, runtime: ToolRuntime<unknown, AgentContext>) => {
    if (!isValidObjectId(id)) return "El id no es valido.";
    const movie = await moviesService.findMovieById(id);
    if (!movie) return "No existe una pelicula con ese id.";
    if (!canModifyMovie(runtime.context?.user, movie)) return FORBIDDEN;

    try {
      const updated = await moviesService.updateMovie(id, updateMovieSchema.parse(withoutNulls(changes)));
      console.log(`[tool] update_movie ${id} ${JSON.stringify(changes)}`);
      return updated ? `Pelicula actualizada: ${JSON.stringify(toPublic(updated, runtime.context?.user.id))}` : "No existe una pelicula con ese id.";
    } catch (error) {
      const message = validationMessage(error);
      if (message) return message;
      throw error;
    }
  },
  {
    name: "update_movie",
    description:
      "Modifica campos de una pelicula (ej: marcarla como vista o cambiar el puntaje). Usala SOLO si el usuario " +
      "lo pide. Primero obtene el id con list_movies. Manda solo los campos a cambiar.",
    schema: z.object({
      id: z.string().describe("El id de la pelicula"),
      title: z.string().optional(),
      director: z.string().optional(),
      genre: z.enum(GENRES).optional(),
      releaseDate: z.string().optional().describe("AAAA-MM-DD"),
      durationMinutes: z.number().int().optional(),
      rating: z.number().optional().describe("0 a 10"),
      watched: z.boolean().optional(),
      synopsis: z.string().optional(),
    }),
  }
);

export const deleteMovieTool = tool(
  async ({ id }, runtime: ToolRuntime<unknown, AgentContext>) => {
    if (!isValidObjectId(id)) return "El id no es valido.";
    const movie = await moviesService.findMovieById(id);
    if (!movie) return "No existe una pelicula con ese id.";
    if (!canModifyMovie(runtime.context?.user, movie)) return FORBIDDEN;

    await moviesService.deleteMovie(id);
    console.log(`[tool] delete_movie ${id} por ${runtime.context?.user.email}`);
    return `Pelicula eliminada: ${movie.title} (${movie.director}).`;
  },
  {
    name: "delete_movie",
    description:
      "Elimina una pelicula por su id. Usala SOLO si el usuario pide explicitamente eliminarla. Primero buscala " +
      "con list_movies; si coinciden varias, NO elimines: mostra las opciones y pedi que aclare cual.",
    schema: z.object({ id: z.string().describe("El id de la pelicula a eliminar") }),
  }
);

export const tools = [listMoviesTool, getMovieTool, createMovieTool, updateMovieTool, deleteMovieTool];
