// Mapping entre (metodo HTTP + ruta) y controller. Sin logica de negocio.
//
// Permisos (opcional "registros propios", confirmado con el profe):
//   - Lectura: publica.
//   - Crear: cualquier usuario logueado (user o admin); la pelicula queda a su nombre.
//   - Editar / eliminar: el dueño o un admin. requireRole deja pasar a los dos roles y el
//     controller chequea la propiedad (canModifyMovie) → 403 si no es suya.
import { Router } from "express";
import {
  listMovies,
  getMovieById,
  createMovie,
  updateMovie,
  deleteMovie,
} from "../controllers/movies.controller.js";
import { validateBody, validateQuery } from "../middlewares/validate.js";
import { createMovieSchema, listMoviesSchema, replaceMovieSchema, updateMovieSchema } from "../schemas/movie.schema.js";
import { authMiddleware, optionalAuth, requireRole } from "../middlewares/auth.middleware.js";

const router = Router();
const loggedIn = [authMiddleware, requireRole("user", "admin")];

router.get("/", optionalAuth, validateQuery(listMoviesSchema), listMovies);
router.get("/:id", getMovieById);
router.post("/", loggedIn, validateBody(createMovieSchema), createMovie);
router.put("/:id", loggedIn, validateBody(replaceMovieSchema), updateMovie);
router.patch("/:id", loggedIn, validateBody(updateMovieSchema), updateMovie);
router.delete("/:id", loggedIn, deleteMovie);

export default router;
