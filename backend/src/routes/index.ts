// Junta los routers de cada recurso. Las entidades nuevas se montan aca, no en server.ts.
import { Router } from "express";
import moviesRouter from "./movies.routes.js";
import { enabledSocialProviders } from "../lib/auth.js";

const router = Router();

router.use("/movies", moviesRouter);

// El front pregunta que logins sociales estan configurados para mostrar solo esos botones.
router.get("/config", (_req, res) => {
  res.json({ socialProviders: enabledSocialProviders });
});

export default router;
