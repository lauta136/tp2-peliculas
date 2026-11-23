// Capa de servicio: logica de negocio y acceso a datos de peliculas, en UN solo lugar.
// No sabe nada de HTTP ni de LLMs. La consumen controllers/movies.controller.ts y agent/tools.
import { QueryFilter } from "mongoose";
import Movie, { IMovieDocument } from "../models/Movie.js";
import { escapeRegex } from "../lib/escape-regex.js";
import { CreateMovieInput, ListMoviesInput, UpdateMovieInput } from "../schemas/movie.schema.js";
import { Paginated } from "../types/pagination.types.js";

export interface Owner {
  id: string;
  name: string;
}

// El filtro se arma campo por campo desde input validado por Zod: nunca se pasa el input crudo
// a Mongo (eso permitiria inyectar operadores como { "$gt": "" }).
function buildFilter(
  { search, genre, watched }: ListMoviesInput,
  ownerId?: string
): QueryFilter<IMovieDocument> {
  const filter: QueryFilter<IMovieDocument> = {};
  if (genre) filter.genre = genre;
  if (watched !== undefined) filter.watched = watched;
  if (ownerId) filter.ownerId = ownerId;
  if (search) {
    const safe = escapeRegex(search);
    filter.$or = [
      { title: { $regex: safe, $options: "i" } },
      { director: { $regex: safe, $options: "i" } },
      { synopsis: { $regex: safe, $options: "i" } },
    ];
  }
  return filter;
}

export async function listMovies(input: ListMoviesInput, ownerId?: string): Promise<Paginated<IMovieDocument>> {
  const { page, limit, sortBy, sortOrder } = input;
  const filter = buildFilter(input, ownerId);

  const [data, total] = await Promise.all([
    Movie.find(filter)
      // _id como desempate: con sort por un campo repetido, la paginacion no saltea ni repite.
      .sort({ [sortBy]: sortOrder === "asc" ? 1 : -1, _id: 1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Movie.countDocuments(filter),
  ]);

  return { data, meta: { total, page, limit, totalPages: Math.max(1, Math.ceil(total / limit)) } };
}

export function findMovieById(id: string): Promise<IMovieDocument | null> {
  return Movie.findById(id);
}

// El dueño sale de la sesion, nunca del body: un cliente no puede crear a nombre de otro.
export function createMovie(input: CreateMovieInput, owner: Owner): Promise<IMovieDocument> {
  return Movie.create({ ...input, ownerId: owner.id, ownerName: owner.name });
}

export function updateMovie(id: string, input: UpdateMovieInput): Promise<IMovieDocument | null> {
  return Movie.findByIdAndUpdate(id, input, { new: true, runValidators: true });
}

export function deleteMovie(id: string): Promise<IMovieDocument | null> {
  return Movie.findByIdAndDelete(id);
}
