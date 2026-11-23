// Cliente de Better Auth. Sin baseURL: el front y la API comparten origen
// (proxy de Vite en local, rewrite de Render en produccion).
import { createAuthClient } from "better-auth/react";
import { adminClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  plugins: [adminClient()],
});

// useSession es estado del SERVIDOR: pide /api/auth/get-session y lo cachea. Al recargar la
// pagina vuelve a pedirlo con la cookie, por eso la sesion se mantiene con F5.
export const { useSession, signIn, signUp, signOut } = authClient;
