import { z } from "zod";

// El limite de largo no es estetico: cada caracter son tokens que se pagan y gastan el rate limit.
export const chatSchema = z.object({
  message: z
    .string({ error: "El mensaje es obligatorio" })
    .trim()
    .min(1, { error: "El mensaje es obligatorio" })
    .max(1000, { error: "Maximo 1000 caracteres" }),
});

export type ChatInput = z.infer<typeof chatSchema>;
