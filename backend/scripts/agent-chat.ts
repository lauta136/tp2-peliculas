// Prueba el agente con Gemini desde la terminal, sin front ni HTTP:
//   npm run agent:chat -- "¿cuáles son las mejores películas de terror?"
// Corre como un usuario comun de mentira (no es dueño de ninguna pelicula): sirve para ver que
// las tools de escritura respetan los permisos.
import "dotenv/config";
import { connectMongoDB, disconnectMongoDB } from "../src/config/db.js";
import { streamAgent } from "../src/agent/agent.js";

const message = process.argv.slice(2).join(" ") || "Hola, ¿qué podés hacer?";
const context = { user: { id: "agent-chat", name: "Prueba", email: "prueba@local", role: "user" } };

await connectMongoDB();
try {
  for await (const event of streamAgent(message, context, new AbortController().signal)) {
    if (event.type === "token") process.stdout.write(event.text);
    else console.log(`\n[tool] ${event.name}(${JSON.stringify(event.args)})`);
  }
  console.log();
} finally {
  await disconnectMongoDB();
}
