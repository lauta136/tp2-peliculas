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

  // streamMode "updates": un evento por cada paso TERMINADO del loop, con los mensajes completos.
  //   - Si el modelo pidio tools → se avisa cada una (el front muestra "Buscando películas…").
  //   - Si respondio texto → se manda el texto entero como un solo "token".
  // No se usa el modo "messages" (token por token): obliga a LangChain a pedirle streaming a Gemini, y
  // el SDK que usa @langchain/google-genai a veces no puede parsear el final de ese stream con los
  // modelos 3.x ("Failed to parse stream"). Sin streaming, cada llamada es un request normal.
  // recursionLimit corta el loop si el modelo se queda llamando tools sin parar.
  const stream = await agent.stream(
    { messages: [{ role: "user", content: message }] },
    { streamMode: "updates", recursionLimit: 10, signal, context }
  );

  for await (const update of stream) {
    for (const step of Object.values(update as Record<string, { messages?: BaseMessage[] }>)) {
      for (const msg of step?.messages ?? []) {
        // Solo los mensajes del modelo. Los ToolMessage (resultado crudo de la tool) los lee el modelo.
        if (msg.type !== "ai") continue;
        const calls = "tool_calls" in msg && Array.isArray(msg.tool_calls) ? msg.tool_calls : [];
        for (const call of calls) yield { type: "tool", name: call.name, args: call.args };
        if (msg.text) yield { type: "token", text: msg.text };
      }
    }
  }
}
