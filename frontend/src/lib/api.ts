import axios from "axios";

// Ruta relativa: mismo origen que el front, el navegador manda la cookie de sesion solo.
// En local la resuelve el proxy de Vite; en Render, el rewrite /api/* del Static Site.
export const api = axios.create({
  baseURL: "/api",
});

// Forma en la que guardamos los errores del backend: { error: { message, details } }.
export interface ApiError {
  status?: number;
  message: string;
  // Errores por campo de Zod (400): { title: ["El titulo es obligatorio"] }
  details?: Record<string, string[] | undefined>;
}

export const toApiError = (err: unknown): ApiError => {
  if (axios.isAxiosError(err)) {
    const error = err.response?.data?.error;
    const message = typeof error === "string" ? error : (error?.message ?? err.message);
    return { status: err.response?.status, message, details: error?.details };
  }
  if (err instanceof Error) return { message: err.message };
  return { message: "Error desconocido" };
};

export const getErrorMessage = (err: unknown): string => {
  if (!err) return "Error desconocido";
  if (typeof err === "string") return err;
  if (typeof err === "object" && "message" in err && typeof err.message === "string") return err.message;
  return toApiError(err).message;
};
