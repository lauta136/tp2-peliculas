// Protege rutas: Better Auth lee la cookie de sesion y la busca en Mongo.
import { Request, Response, NextFunction } from "express";
import { fromNodeHeaders } from "better-auth/node";
import { auth } from "../lib/auth.js";
import { UserRole } from "../types/auth.types.js";

async function readSession(req: Request) {
  return auth.api.getSession({ headers: fromNodeHeaders(req.headers) });
}

// Sin sesion → 401.
export async function authMiddleware(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const session = await readSession(req);

    if (!session) {
      res.status(401).json({ error: { message: "Sesion requerida" } });
      return;
    }

    req.user = session.user;
    next();
  } catch (error) {
    console.error("[auth] error reading session:", error);
    res.status(500).json({ error: { message: "No se pudo verificar la sesion" } });
  }
}

// Para rutas publicas que cambian si hay sesion (ej: GET /api/movies?mine=true).
// Si hay sesion setea req.user; si no, sigue igual sin cortar el request.
export async function optionalAuth(req: Request, _res: Response, next: NextFunction): Promise<void> {
  try {
    const session = await readSession(req);
    if (session) req.user = session.user;
  } catch (error) {
    console.error("[auth] error reading optional session:", error);
  }
  next();
}

// requireRole: siempre DESPUES de authMiddleware, asume que req.user ya esta seteado.
// Rol fuera de la lista → 403.
export function requireRole(...allowedRoles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: { message: "Sesion requerida" } });
      return;
    }

    if (!allowedRoles.includes(req.user.role as UserRole)) {
      res.status(403).json({ error: { message: "No tenes permisos para realizar esta accion" } });
      return;
    }

    next();
  };
}
