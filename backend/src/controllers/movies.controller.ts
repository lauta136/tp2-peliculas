// Controller = capa HTTP: lee req, llama al service, traduce el resultado a status + JSON.
import { Request, Response } from "express";
import { isValidObjectId } from "mongoose";
import * as moviesService from "../services/movies.service.js";
import { CreateMovieInput, ListMoviesInput, UpdateMovieInput } from "../schemas/movie.schema.js";
import { canModifyMovie } from "../lib/permissions.js";

const fail = (res: Response, status: number, message: string) => res.status(status).json({ error: { message } });

// GET /api/movies — query ya validada por validateQuery(listMoviesSchema) → res.locals.query
export async function listMovies(req: Request, res: Response): Promise<void> {
  const query = res.locals.query as ListMoviesInput;

  // mine=true necesita saber quien es: optionalAuth deja req.user si hay sesion.
  if (query.mine && !req.user) {
    fail(res, 401, "Inicia sesion para ver tus peliculas");
    return;
  }

  try {
    res.status(200).json(await moviesService.listMovies(query, query.mine ? req.user!.id : undefined));
  } catch (error) {
    console.error("[movies] error listing:", error);
    fail(res, 500, "No se pudieron obtener las peliculas");
  }
}

export async function getMovieById(req: Request<{ id: string }>, res: Response): Promise<void> {
  const { id } = req.params;

  if (!isValidObjectId(id)) {
    fail(res, 400, "El id no es valido");
    return;
  }

  try {
    const movie = await moviesService.findMovieById(id);

    if (!movie) {
      fail(res, 404, "Pelicula no encontrada");
      return;
    }

    res.status(200).json(movie);
  } catch (error) {
    console.error("[movies] error fetching by id:", error);
    fail(res, 500, "No se pudo obtener la pelicula");
  }
}

export async function createMovie(req: Request<{}, {}, CreateMovieInput>, res: Response): Promise<void> {
  try {
    const user = req.user!;
    const movie = await moviesService.createMovie(req.body, { id: user.id, name: user.name });
    res.status(201).json(movie);
  } catch (error) {
    if (error instanceof Error && error.name === "ValidationError") {
      fail(res, 400, error.message);
      return;
    }

    console.error("[movies] error creating:", error);
    fail(res, 500, "No se pudo crear la pelicula");
  }
}

// PUT y PATCH comparten controller: cambia solo el schema que valida el body en la ruta.
export async function updateMovie(
  req: Request<{ id: string }, {}, UpdateMovieInput>,
  res: Response
): Promise<void> {
  const { id } = req.params;

  if (!isValidObjectId(id)) {
    fail(res, 400, "El id no es valido");
    return;
  }

  try {
    const movie = await moviesService.findMovieById(id);

    if (!movie) {
      fail(res, 404, "Pelicula no encontrada");
      return;
    }

    // Registros propios: 403 si no es el dueño ni admin.
    if (!canModifyMovie(req.user, movie)) {
      fail(res, 403, "Solo podes editar tus propias peliculas");
      return;
    }

    const updated = await moviesService.updateMovie(id, req.body);
    if (!updated) {
      fail(res, 404, "Pelicula no encontrada");
      return;
    }

    res.status(200).json(updated);
  } catch (error) {
    if (error instanceof Error && error.name === "ValidationError") {
      fail(res, 400, error.message);
      return;
    }

    console.error("[movies] error updating:", error);
    fail(res, 500, "No se pudo actualizar la pelicula");
  }
}

export async function deleteMovie(req: Request<{ id: string }>, res: Response): Promise<void> {
  const { id } = req.params;

  if (!isValidObjectId(id)) {
    fail(res, 400, "El id no es valido");
    return;
  }

  try {
    const movie = await moviesService.findMovieById(id);

    if (!movie) {
      fail(res, 404, "Pelicula no encontrada");
      return;
    }

    if (!canModifyMovie(req.user, movie)) {
      fail(res, 403, "Solo podes eliminar tus propias peliculas");
      return;
    }

    await moviesService.deleteMovie(id);
    res.status(204).send();
  } catch (error) {
    console.error("[movies] error deleting:", error);
    fail(res, 500, "No se pudo eliminar la pelicula");
  }
}
