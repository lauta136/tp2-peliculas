// /admin/usuarios: gestion de usuarios con el plugin admin de Better Auth. No hay codigo propio en el
// backend: listUsers, createUser, setRole y removeUser ya chequean que quien llama sea admin.
import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { authClient, useSession } from "../../lib/auth-client";
import { createUserSchema, type CreateUserFormValues } from "../../schemas/auth.schema";
import { ROLE_LABELS, type UserRole } from "../../types/auth";
import { Field, FormError } from "../../components/Field";

type AdminUser = { id: string; name: string; email: string; role?: string | null; createdAt: Date; image?: string | null };

const emptyUser: CreateUserFormValues = { name: "", email: "", password: "", role: "user" };

export const AdminUsers = () => {
  const { data: current } = useSession();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async (searchValue = "") => {
    const { data, error } = await authClient.admin.listUsers({
      query: {
        limit: 100,
        sortBy: "createdAt",
        sortDirection: "desc",
        ...(searchValue && { searchValue, searchField: "email", searchOperator: "contains" }),
      },
    });
    if (error) return setError(error.message ?? "No se pudieron cargar los usuarios");
    setUsers(data.users as AdminUser[]);
    setTotal(data.total);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const changeRole = async (user: AdminUser, role: UserRole) => {
    setBusyId(user.id);
    setError(null);
    const { error } = await authClient.admin.setRole({ userId: user.id, role });
    setBusyId(null);
    if (error) return setError(error.message ?? "No se pudo cambiar el rol");
    setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, role } : u)));
  };

  const removeUser = async (user: AdminUser) => {
    if (!window.confirm(`¿Eliminar a ${user.name} (${user.email})? Se borran su cuenta y sus sesiones.`)) return;
    setBusyId(user.id);
    setError(null);
    const { error } = await authClient.admin.removeUser({ userId: user.id });
    setBusyId(null);
    if (error) return setError(error.message ?? "No se pudo eliminar el usuario");
    await load(search);
  };

  const {
    register,
    handleSubmit,
    reset,
    setError: setFormError,
    formState: { errors, isSubmitting },
  } = useForm<CreateUserFormValues>({ resolver: zodResolver(createUserSchema), defaultValues: emptyUser });

  const onCreate = async (values: CreateUserFormValues) => {
    const { error } = await authClient.admin.createUser(values);
    if (error) {
      setFormError("root.server", { message: error.message ?? "No se pudo crear el usuario" });
      return;
    }
    reset(emptyUser);
    await load(search);
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <section className="card flex flex-col gap-4 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-xl font-semibold">
            Usuarios <span className="text-sm font-normal text-ink-400">({total})</span>
          </h2>
          <form
            role="search"
            onSubmit={(e) => {
              e.preventDefault();
              void load(search.trim());
            }}
            className="flex gap-2"
          >
            <input
              type="search"
              aria-label="Buscar por email"
              placeholder="Buscar por email…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input w-52"
            />
            <button type="submit" className="btn-ghost">
              Buscar
            </button>
          </form>
        </div>

        <FormError message={error ?? undefined} />

        <ul className="divide-y divide-ink-700/60">
          {users.map((user) => {
            const isSelf = user.id === current?.user.id;
            return (
              <li key={user.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div className="flex min-w-0 items-center gap-3">
                  {user.image ? (
                    <img src={user.image} alt="" className="size-9 rounded-full" />
                  ) : (
                    <span className="grid size-9 place-items-center rounded-full bg-ink-800 text-sm font-semibold text-gold-300">
                      {user.name.charAt(0).toUpperCase()}
                    </span>
                  )}
                  <div className="min-w-0">
                    <p className="truncate font-medium">
                      {user.name} {isSelf && <span className="text-xs text-ink-400">(vos)</span>}
                    </p>
                    <p className="truncate text-sm text-ink-400">{user.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {/* No se puede cambiar el rol propio: evita que el ultimo admin se quite el acceso. */}
                  <select
                    aria-label={`Rol de ${user.name}`}
                    value={user.role ?? "user"}
                    disabled={isSelf || busyId === user.id}
                    onChange={(e) => changeRole(user, e.target.value as UserRole)}
                    className="input w-auto py-1"
                  >
                    {(Object.keys(ROLE_LABELS) as UserRole[]).map((role) => (
                      <option key={role} value={role}>
                        {ROLE_LABELS[role]}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    disabled={isSelf || busyId === user.id}
                    onClick={() => removeUser(user)}
                    className="btn-danger px-3 py-1"
                  >
                    Eliminar
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      <form onSubmit={handleSubmit(onCreate)} noValidate className="card flex h-fit flex-col gap-4 p-5">
        <h2 className="font-display text-xl font-semibold">Nuevo usuario</h2>
        <Field label="Nombre" error={errors.name?.message}>
          <input className="input" aria-invalid={!!errors.name} {...register("name")} />
        </Field>
        <Field label="Email" error={errors.email?.message}>
          <input type="email" className="input" aria-invalid={!!errors.email} {...register("email")} />
        </Field>
        <Field label="Contraseña inicial" error={errors.password?.message}>
          <input type="password" autoComplete="new-password" className="input" aria-invalid={!!errors.password} {...register("password")} />
        </Field>
        <Field label="Rol" error={errors.role?.message}>
          <select className="input" {...register("role")}>
            <option value="user">{ROLE_LABELS.user}</option>
            <option value="admin">{ROLE_LABELS.admin}</option>
          </select>
        </Field>
        <FormError message={errors.root?.server?.message} />
        <button type="submit" disabled={isSubmitting} className="btn-primary">
          {isSubmitting ? "Creando…" : "Crear usuario"}
        </button>
      </form>
    </div>
  );
};
