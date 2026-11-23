// El agente: modelo + prompt + tools. createAgent arma el loop ReAct (Reason + Act):
//   1. manda los mensajes al LLM
//   2. si el LLM pide una tool → la ejecuta y agrega el resultado como ToolMessage
//   3. vuelve a 1 hasta que el LLM responde texto sin pedir tools
import { createAgent, type BaseMessage } from "langchain";
import { createLlm } from "./llm.js";
import { SYSTEM_PROMPT } from "./prompts.js";
import { tools } from "./tools/movies.tools.js";
import { AgentContext, agentContextSchema } from "./context.js";

// Lo que el agente le cuenta al controller mientras trabaja. No sabe nada de SSE ni de HTTP.
export type AgentEvent =
  | { type: "token"; text: string } // un pedazo de la respuesta final
  | { type: "tool"; name: string; args: Record<string, unknown> }; // el modelo pidio esta tool

function buildAgent() {
  const llm = createLlm();
  if (!llm) return null;
  // contextSchema: el usuario logueado llega a cada tool en runtime.context. No va en los
  // mensajes: el LLM no lo ve ni lo puede falsificar.
  return createAgent({ model: llm, tools, systemPrompt: SYSTEM_PROMPT, contextSchema: agentContextSchema });
}

const agent = buildAgent();

export const isAgentEnabled = (): boolean => agent !== null;

// async generator: va entregando eventos a medida que llegan (for await ... of de quien llama).
export async function* streamAgent(
  message: string,
  context: AgentContext,
  signal: AbortSignal
): AsyncGenerator<AgentEvent> {
  if (!agent) throw new Error("Agente deshabilitado: falta GEMINI_API_KEY");

  // Dos modos de streaming a la vez; cada item llega como [modo, payload]:
  //   "messages" → cada TOKEN apenas lo genera el modelo     → texto en vivo
  //   "updates"  → cada MENSAJE COMPLETO al terminar un paso → que tools pidio y con que args
  // recursionLimit corta el loop si el modelo se queda llamando tools sin parar.
  const stream = await agent.stream(
    { messages: [{ role: "user", content: message }] },
    { streamMode: ["messages", "updates"], recursionLimit: 10, signal, context }
  );

  for await (const [mode, payload] of stream) {
    if (mode === "messages") {
      const [chunk] = payload as [BaseMessage, unknown];
      // Solo el texto del modelo va al usuario. Los ToolMessage (resultado crudo) los lee el modelo.
      if (chunk.type === "ai" && chunk.text) yield { type: "token", text: chunk.text };
      continue;
    }

    for (const update of Object.values(payload as Record<string, { messages?: BaseMessage[] }>)) {
      for (const msg of update?.messages ?? []) {
        if (msg.type !== "ai") continue;
        const calls = "tool_calls" in msg && Array.isArray(msg.tool_calls) ? msg.tool_calls : [];
        for (const call of calls) yield { type: "tool", name: call.name, args: call.args };
      }
    }
  }
}
