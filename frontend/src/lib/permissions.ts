// Misma regla que backend/src/lib/permissions.ts. Aca solo decide que botones mostrar:
// quien protege de verdad es el backend (403 si no corresponde).
import type { Movie } from "../types/movie";

type SessionUser = { id: string; role?: string | null } | undefined;

export const isAdmin = (user: SessionUser): boolean => user?.role === "admin";

export const canModifyMovie = (user: SessionUser, movie: Pick<Movie, "ownerId">): boolean =>
  !!user && (isAdmin(user) || movie.ownerId === user.id);
