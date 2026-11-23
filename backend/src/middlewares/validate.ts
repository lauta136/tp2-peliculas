// Middlewares genericos: validan req.body o req.query contra un schema de Zod. Si falla → 400
// con el detalle por campo, listo para mostrar en el formulario.
import { Request, Response, NextFunction } from "express";
import { z } from "zod";

function badRequest(res: Response, error: z.ZodError): void {
  res.status(400).json({
    error: {
      message: "Los datos enviados no son validos",
      details: z.flattenError(error).fieldErrors,
    },
  });
}

export function validateBody(schema: z.ZodType) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) return badRequest(res, result.error);

    // Reemplaza el body por la version parseada: con defaults aplicados y tipos ya coercionados.
    req.body = result.data;
    next();
  };
}

// En Express 5 req.query es de solo lectura: el resultado parseado queda en res.locals.query.
export function validateQuery(schema: z.ZodType) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.query);
    if (!result.success) return badRequest(res, result.error);

    res.locals.query = result.data;
    next();
  };
}
