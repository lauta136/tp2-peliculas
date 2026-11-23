// dotenv primero: lib/auth.ts lee las variables de entorno apenas se importa.
import "dotenv/config";
import express, { NextFunction, Request, Response } from "express";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./lib/auth.js";
import apiRouter from "./routes/index.js";
import { connectMongoDB } from "./config/db.js";

const app = express();
const PORT: number = Number(process.env.PORT) || 3000;

// Sin cors ni cookie-parser: el front llama a /api en su mismo origen (proxy de Vite en local,
// rewrite del Static Site en Render), asi que no hay requests cross-origin ni cookies de terceros.

// Better Auth ANTES de express.json(): el handler lee el body crudo del request.
app.all("/api/auth/*splat", toNodeHandler(auth));
app.use(express.json({ limit: "100kb" }));

app.use("/api", apiRouter);

app.get("/health", (_req: Request, res: Response) => {
  res.json({ status: "ok", uptimeSeconds: process.uptime(), timestamp: new Date().toISOString() });
});

// Ruta inexistente → 404 en JSON (no el HTML por defecto de Express).
app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: { message: "Ruta no encontrada" } });
});

// JSON mal formado en el body → 400 en vez de 500.
app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (error instanceof SyntaxError && "body" in error) {
    res.status(400).json({ error: { message: "El body no es un JSON valido" } });
    return;
  }
  console.error("[server] unhandled error:", error);
  res.status(500).json({ error: { message: "Error interno del servidor" } });
});

// Red de seguridad: por defecto Node MATA el proceso ante una promesa rechazada que nadie captura.
// El SDK de Gemini a veces deja una suelta cuando falla el streaming, y eso tiraba todo el backend
// (Render lo reiniciaba y el front veia 502). Asi queda en el log y el server sigue atendiendo.
process.on("unhandledRejection", (reason) => {
  console.error("[server] unhandled rejection (el server sigue corriendo):", reason);
});

async function startServer(): Promise<void> {
  await connectMongoDB();

  app.listen(PORT, () => {
    console.log(`listening on port ${PORT}`);
  });
}

startServer().catch((error: unknown) => {
  console.error("[server] failed to start:", error);
  process.exit(1);
});
