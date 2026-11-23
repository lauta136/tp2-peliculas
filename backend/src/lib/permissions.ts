// Regla de "registros propios": un user solo puede editar o eliminar las peliculas que creo;
// un admin puede con todas. La usan el controller (API REST) y las tools del agente.
import type { IMovie } from "../models/Movie.js";

export interface Actor {
  id: string;
  role?: string | null;
}

export const isAdmin = (actor: Actor | undefined): boolean => actor?.role === "admin";

export function canModifyMovie(actor: Actor | undefined, movie: Pick<IMovie, "ownerId">): boolean {
  if (!actor) return false;
  return isAdmin(actor) || movie.ownerId === actor.id;
}
