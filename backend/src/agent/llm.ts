// El modelo (el "cerebro"): Gemini via LangChain.
// temperature 0: respuestas deterministas, lo que queremos para elegir tools.
//
//
// Sin streaming: cada respuesta de Gemini llega completa (ver agent.ts: por que no token por token).
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";

// Se puede cambiar con GEMINI_MODEL sin tocar codigo (cualquier modelo de Gemini con tool calling).
const MODEL = process.env.GEMINI_MODEL || "gemini-3.5-flash-lite";

// null si falta la key: el server arranca igual y /api/agent/chat responde 503 en vez de romper todo.
export function createLlm(): ChatGoogleGenerativeAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn("[llm] GEMINI_API_KEY vacia: el asistente queda deshabilitado");
    return null;
  }
  console.log(`[llm] Gemini listo: model=${MODEL}`);
  // maxRetries 4: los 503 ("high demand") de Gemini suelen durar segundos y se resuelven reintentando
  // con espera creciente. Si se agota la cuota diaria (429) reintentar no sirve: el controller lo explica.
  return new ChatGoogleGenerativeAI({ model: MODEL, apiKey, temperature: 0, maxRetries: 4 });
}
