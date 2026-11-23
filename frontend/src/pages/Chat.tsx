// Ruta privada "/chat": chat con el agente de peliculas (LangChain + Gemini). La respuesta llega por SSE: el texto aparece a medida
// que el modelo lo genera, y mientras corre una tool se muestra que esta consultando.
// No usa RTK Query: RTK Query espera UNA respuesta por request, y aca llegan muchos eventos.
import { useRef, useState, type FormEvent } from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { readSSE } from "../lib/sse";

// El modelo responde en Markdown (**negrita**, listas). react-markdown lo convierte a elementos React
// y NO interpreta HTML crudo: si el modelo devolviera <script>, se muestra como texto (sin XSS).
// Tailwind resetea listas y margenes (preflight), por eso se reponen aca con variantes [&_tag].
const MARKDOWN_STYLES =
  "[&_p:not(:last-child)]:mb-2 [&_ul]:my-1 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:my-1 [&_ol]:list-decimal [&_ol]:pl-5 " +
  "[&_strong]:font-semibold [&_strong]:text-gold-300 [&_code]:rounded [&_code]:bg-ink-700 [&_code]:px-1 [&_a]:underline " +
  // Tablas (necesitan remark-gfm): bordes, padding y encabezado marcado.
  "[&_table]:my-2 [&_table]:border-collapse [&_table]:text-sm [&_th]:border [&_th]:border-ink-700 " +
  "[&_th]:bg-ink-800 [&_th]:px-2 [&_th]:py-1 [&_th]:text-left [&_th]:font-semibold " +
  "[&_td]:border [&_td]:border-ink-700 [&_td]:px-2 [&_td]:py-1 [&_td]:align-top";

// tools: que tools pidio el agente para armar ESTA respuesta (llegan por el evento SSE "tool").
type ToolCall = { name: string; args: Record<string, unknown> };
type ChatMessage = { role: "user" | "assistant"; text: string; tools: ToolCall[] };

// Nombre tecnico de la tool → lo que ve el usuario.
const TOOL_LABELS: Record<string, string> = {
  list_movies: "Buscando películas…",
  get_movie: "Buscando la película…",
  create_movie: "Agregando la película…",
  update_movie: "Actualizando la película…",
  delete_movie: "Eliminando la película…",
};

export const Chat = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const loading = status !== null;

  // Actualiza el ultimo mensaje (el del asistente) sin mutar el array.
  const updateAssistant = (update: (m: ChatMessage) => ChatMessage) =>
    setMessages((prev) => prev.map((m, i) => (i === prev.length - 1 ? update(m) : m)));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const message = input.trim();
    if (!message || loading) return;

    setInput("");
    setError(null);
    setStatus("Pensando…");
    // El mensaje del asistente arranca vacio y se va llenando con cada evento "token".
    setMessages((prev) => [
      ...prev,
      { role: "user", text: message, tools: [] },
      { role: "assistant", text: "", tools: [] },
    ]);

    const abort = new AbortController();
    abortRef.current = abort;

    try {
      const response = await fetch("/api/agent/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
        signal: abort.signal,
      });

      // Auth (401) y validacion (400) fallan ANTES de abrir el stream: llegan como JSON normal.
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.error?.message ?? `Error ${response.status}`);
      }

      await readSSE(response, ({ event, data }) => {
        const payload = data as { text?: string; name?: string; args?: ToolCall["args"]; message?: string };
        if (event === "tool" && payload.name) {
          const call: ToolCall = { name: payload.name, args: payload.args ?? {} };
          setStatus(TOOL_LABELS[call.name] ?? "Consultando…");
          updateAssistant((m) => ({ ...m, tools: [...m.tools, call] }));
        }
        if (event === "token" && payload.text) {
          const text = payload.text;
          setStatus(null);
          updateAssistant((m) => ({ ...m, text: m.text + text }));
        }
        if (event === "error") setError(payload.message ?? "El asistente no pudo responder");
      });
    } catch (err) {
      // Si el usuario cancelo, no es un error que haya que mostrar.
      if (!abort.signal.aborted) setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setStatus(null);
      abortRef.current = null;
    }
  };

  return (
    <section className="card mx-auto flex max-w-3xl flex-col gap-4 p-6">
      <h1 className="font-display text-2xl font-semibold">Asistente de películas</h1>
      <p className="text-sm text-ink-400">
        Buscá películas, pedí recomendaciones o cargá y editá las tuyas escribiendo. Cada mensaje es independiente: no recuerda los anteriores.
      </p>

      <ul className="flex flex-col gap-3" aria-live="polite">
        {messages.map((m, i) =>
          m.role === "user" ? (
            <li key={i} className="max-w-[85%] self-end rounded-2xl rounded-br-sm bg-gold-400 px-3 py-2 text-ink-950">
              {m.text}
            </li>
          ) : (
            <li key={i} className="flex max-w-full flex-col gap-1 self-start">
              {/* Las tools aparecen ANTES del texto: el agente primero consulta y despues responde. */}
              {m.tools.length > 0 && (
                <div className="flex flex-wrap items-center gap-1 text-xs text-ink-500">
                  <span>Tools usadas:</span>
                  {m.tools.map((t, j) => (
                    <code
                      key={j}
                      title={`El agente llamo a ${t.name} con estos argumentos`}
                      className="rounded border border-ink-700 bg-ink-850 px-1.5 py-0.5 font-mono text-ink-200"
                    >
                      {t.name}({Object.keys(t.args).length ? JSON.stringify(t.args) : ""})
                    </code>
                  ))}
                </div>
              )}
              {/* overflow-x-auto: una tabla ancha scrollea adentro de la burbuja en el celular */}
              <div className={`max-w-full overflow-x-auto rounded-2xl rounded-bl-sm bg-ink-800 px-3 py-2 text-ink-100 ${MARKDOWN_STYLES}`}>
                {m.text ? (
                  // Se re-renderiza con cada token: el Markdown a medio llegar (ej: "**Nomb") se ve
                  // como texto plano un instante y se corrige cuando llega el cierre.
                  // remarkGfm: suma lo de GitHub que no es Markdown basico (tablas, ~~tachado~~, checklists).
                  <Markdown remarkPlugins={[remarkGfm]}>{m.text}</Markdown>
                ) : (
                  loading && i === messages.length - 1 && "…"
                )}
              </div>
            </li>
          )
        )}
      </ul>

      {status && <p className="text-sm text-ink-400 italic">{status}</p>}
      {error && (
        <p role="alert" className="text-sm text-red-300">
          {error}
        </p>
      )}

      <form onSubmit={handleSubmit} className="flex gap-2">
        <label htmlFor="chat-input" className="sr-only">
          Mensaje
        </label>
        <input
          id="chat-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          maxLength={1000}
          placeholder="¿Cuáles son las 3 mejores películas de ciencia ficción?"
          className="input flex-1"
        />
        {loading ? (
          <button
            type="button"
            onClick={() => abortRef.current?.abort()}
            className="btn-ghost"
          >
            Cancelar
          </button>
        ) : (
          <button
            type="submit"
            disabled={!input.trim()}
            className="btn-primary"
          >
            Enviar
          </button>
        )}
      </form>
    </section>
  );
};
