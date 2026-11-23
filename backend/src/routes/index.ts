// Junta los routers de cada recurso. Las entidades nuevas se montan aca, no en server.ts.
import { Router } from "express";
import moviesRouter from "./movies.routes.js";
import agentRouter from "./agent.routes.js";
import { enabledSocialProviders } from "../lib/auth.js";
import { isAgentEnabled } from "../agent/agent.js";

const router = Router();

router.use("/movies", moviesRouter);
router.use("/agent", agentRouter);

// El front pregunta que logins sociales y si el asistente estan configurados, para mostrar solo eso.
router.get("/config", (_req, res) => {
  res.json({ socialProviders: enabledSocialProviders, agent: isAgentEnabled() });
});

export default router;
