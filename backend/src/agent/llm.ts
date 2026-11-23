// El modelo (el "cerebro"): Gemini via LangChain.
// temperature 0: respuestas deterministas, lo que queremos para elegir tools.
// streaming: true → Gemini manda la respuesta token por token en vez de toda junta al final.
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
  console.log(`[llm] Gemini listo: model=${MODEL} streaming=true`);
  // maxRetries 2: si Gemini esta saturado (503) el usuario ve el error en segundos, en vez de esperar
  // ~1 minuto de reintentos con espera creciente.
  return new ChatGoogleGenerativeAI({ model: MODEL, apiKey, temperature: 0, streaming: true, maxRetries: 2 });
}
