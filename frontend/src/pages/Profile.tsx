// Ruta privada "/perfil": datos de la sesion y conexion de cuentas sociales.
import { useEffect, useState } from "react";
import { authClient, useSession } from "../lib/auth-client";
import { useGetConfigQuery } from "../store/api";
import { ROLE_LABELS, type UserRole } from "../types/auth";
import { FormError } from "../components/Field";

const PROVIDER_LABELS: Record<string, string> = { credential: "Email y contraseña", github: "GitHub", google: "Google" };

export const Profile = () => {
  const { data: session } = useSession();
  const { data: config } = useGetConfigQuery();
  const [accounts, setAccounts] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    authClient.listAccounts().then(({ data }) => setAccounts((data ?? []).map((a) => a.providerId)));
  }, []);

  if (!session) return null;
  const { user } = session;

  // Link EXPLICITO: el usuario ya probo que es dueño de la cuenta (esta logueado).
  // Redirige al proveedor y vuelve aca con las cuentas unidas.
  const link = async (provider: "github" | "google") => {
    const { error } = await authClient.linkSocial({ provider, callbackURL: "/perfil" });
    if (error) setError(error.message ?? "No se pudo conectar la cuenta");
  };

  const linkable = (["github", "google"] as const).filter(
    (p) => config?.socialProviders[p] && !accounts.includes(p)
  );

  return (
    <section className="card mx-auto flex max-w-lg flex-col gap-5 p-6">
      <div className="flex items-center gap-4">
        {user.image ? (
          <img src={user.image} alt="" className="size-16 rounded-full" />
        ) : (
          <span className="grid size-16 place-items-center rounded-full bg-ink-800 font-display text-2xl font-bold text-gold-300">
            {user.name.charAt(0).toUpperCase()}
          </span>
        )}
        <div>
          <h1 className="font-display text-2xl font-semibold">{user.name}</h1>
          <p className="text-ink-400">{user.email}</p>
          <span className="mt-1 inline-block rounded-md bg-ink-800 px-2 py-0.5 text-xs text-gold-300">
            {ROLE_LABELS[(user.role as UserRole) ?? "user"] ?? user.role}
          </span>
        </div>
      </div>

      <div>
        <h2 className="mb-2 text-sm font-medium text-ink-200">Formas de ingresar</h2>
        <ul className="flex flex-wrap gap-2">
          {accounts.map((p) => (
            <li key={p} className="rounded-md border border-ink-700 px-2 py-1 text-xs text-ink-200">
              {PROVIDER_LABELS[p] ?? p}
            </li>
          ))}
        </ul>
      </div>

      {linkable.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {linkable.map((p) => (
            <button key={p} type="button" onClick={() => link(p)} className="btn-ghost">
              Conectar {PROVIDER_LABELS[p]}
            </button>
          ))}
        </div>
      )}
      <FormError message={error ?? undefined} />
    </section>
  );
};
