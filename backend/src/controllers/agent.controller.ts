// Controller: HTTP <-> agente, respondiendo con Server-Sent Events (SSE).
// La respuesta queda ABIERTA y se van escribiendo eventos:
//   event: tool    data: {"name":"list_movies"}
//   event: token   data: {"text":"Hay "}
//   event: done    data: {}
import { Request, Response } from "express";
import { isAgentEnabled, streamAgent } from "../agent/agent.js";
import { ChatInput } from "../schemas/agent.schema.js";

// El detalle tecnico queda en el log; al usuario se le explica que paso y que puede hacer.
function friendlyError(error: unknown): string {
  const status = typeof error === "object" && error !== null && "status" in error ? error.status : undefined;
  if (status === 429) return "Se agotó la cuota diaria gratuita del asistente. Probá de nuevo mañana.";
  if (status === 503) return "Gemini está saturado en este momento. Probá de nuevo en unos segundos.";
  return "El asistente no pudo responder. Probá de nuevo.";
}

function sendEvent(res: Response, event: string, data: unknown): void {
  res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
}

export async function chat(req: Request<{}, {}, ChatInput>, res: Response): Promise<void> {
  if (!isAgentEnabled()) {
    res.status(503).json({ error: { message: "El asistente no esta configurado en este servidor" } });
    return;
  }

  // Si el usuario cierra la pestaña o cancela, se corta el agente (y la llamada a Gemini).
  const abort = new AbortController();
  res.on("close", () => abort.abort());

  // A partir de aca el status ya es 200: los errores se mandan como evento, no como 500.
  // (Auth y validacion corren ANTES, en la ruta: esos si responden 401/400 con JSON normal.)
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no",
  });
  res.flushHeaders();

  try {
    // El usuario sale de la SESION (authMiddleware), nunca del body: el cliente no puede decir "soy admin".
    const user = req.user!;
    const context = { user: { id: user.id, name: user.name, email: user.email, role: user.role ?? "user" } };

    for await (const event of streamAgent(req.body.message, context, abort.signal)) {
      sendEvent(res, event.type, event);
    }
    sendEvent(res, "done", {});
  } catch (error) {
    if (!abort.signal.aborted) {
      // El detalle (rate limit, etc.) queda en el log, no se le muestra al usuario.
      console.error("[agent] error:", error);
      sendEvent(res, "error", { message: friendlyError(error) });
    }
  } finally {
    res.end();
  }
}
