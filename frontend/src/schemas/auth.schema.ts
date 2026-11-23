import { z } from "zod";

export const loginSchema = z.object({
  email: z.email({ error: "El email no tiene un formato valido" }).trim().toLowerCase(),
  password: z.string().min(1, { error: "La contraseña es obligatoria" }),
});

export type LoginFormValues = z.infer<typeof loginSchema>;

export const registerSchema = z
  .object({
    name: z.string().trim().min(2, { error: "Minimo 2 caracteres" }).max(80, { error: "Maximo 80 caracteres" }),
    email: z.email({ error: "El email no tiene un formato valido" }).trim().toLowerCase(),
    // Better Auth exige minimo 8 por defecto: validarlo aca evita un viaje al servidor.
    password: z.string().min(8, { error: "Minimo 8 caracteres" }).max(128),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    error: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  });

export type RegisterFormValues = z.infer<typeof registerSchema>;

// Alta de usuario desde el panel de admin (authClient.admin.createUser).
export const createUserSchema = z.object({
  name: z.string().trim().min(2, { error: "Minimo 2 caracteres" }).max(80),
  email: z.email({ error: "El email no tiene un formato valido" }).trim().toLowerCase(),
  password: z.string().min(8, { error: "Minimo 8 caracteres" }).max(128),
  role: z.enum(["user", "admin"]),
});

export type CreateUserFormValues = z.infer<typeof createUserSchema>;
