// POST /api/agent/chat. authMiddleware obligatorio: cada mensaje gasta cuota de Gemini.
import { Router } from "express";
import { chat } from "../controllers/agent.controller.js";
import { validateBody } from "../middlewares/validate.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { chatSchema } from "../schemas/agent.schema.js";

const router = Router();

router.post("/chat", authMiddleware, validateBody(chatSchema), chat);

export default router;
