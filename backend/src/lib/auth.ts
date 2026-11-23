// Better Auth: usuarios, sesiones y cuentas sociales (GitHub y Google) viven en NUESTRO Mongo
// (colecciones user, session, account). El plugin admin agrega user.role y la gestion de usuarios.
import { betterAuth } from "better-auth";
import { admin } from "better-auth/plugins";
import { mongodbAdapter } from "@better-auth/mongo-adapter";
import { MongoClient } from "mongodb";
import { requireEnv } from "./env.js";

// Better Auth usa el driver nativo de Mongo. Pasar `client` habilita transacciones (Atlas = replica set).
const client = new MongoClient(requireEnv("MONGODB_URI"));

// Un proveedor social solo se activa si tiene sus dos variables: asi se puede correr en local
// sin configurar Google (o GitHub) y el server arranca igual.
function socialProvider(prefix: "GITHUB" | "GOOGLE") {
  const clientId = process.env[`${prefix}_CLIENT_ID`];
  const clientSecret = process.env[`${prefix}_CLIENT_SECRET`];
  if (!clientId || !clientSecret) {
    console.warn(`[auth] ${prefix}_CLIENT_ID / ${prefix}_CLIENT_SECRET vacios: login con ${prefix.toLowerCase()} deshabilitado`);
    return undefined;
  }
  return { clientId, clientSecret };
}

const github = socialProvider("GITHUB");
const google = socialProvider("GOOGLE");

export const auth = betterAuth({
  // URL publica que ve el navegador: la del FRONT, porque /api llega al back a traves del proxy
  // (Vite en local, rewrite del Static Site en Render). El secret se lee de BETTER_AUTH_SECRET.
  baseURL: requireEnv("BETTER_AUTH_URL"),
  database: mongodbAdapter(client.db(), { client }),
  emailAndPassword: {
    enabled: true, // hashea con scrypt; minimo 8 caracteres
  },
  socialProviders: {
    ...(github && { github }),
    // prompt select_account: deja elegir cuenta de Google en vez de entrar directo con la ultima usada.
    ...(google && { google: { ...google, prompt: "select_account" as const } }),
  },
  // Si alguien registrado con email+password entra con GitHub o Google (mismo email), se unen las
  // cuentas en vez de tirar account_not_linked. Los dos proveedores solo devuelven emails verificados.
  account: {
    accountLinking: { enabled: true, trustedProviders: ["github", "google"] },
  },
  // admin(): user.role ("user" por defecto) + endpoints para listar usuarios, crearlos,
  // cambiarles el rol (setRole) y eliminarlos. Solo los puede usar quien tenga rol "admin".
  plugins: [admin({ defaultRole: "user", adminRoles: ["admin"] })],
});

export const enabledSocialProviders = { github: !!github, google: !!google };
