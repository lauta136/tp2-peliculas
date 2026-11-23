import { Link, Navigate, Outlet, useLocation } from "react-router";
import { useSession } from "../lib/auth-client";
import type { UserRole } from "../types/auth";

interface ProtectedRouteProps {
  roles?: UserRole[];
}

// Sin sesion → al login (y despues vuelve a donde queria ir).
// Con sesion pero sin el rol → pantalla "sin permisos" (no se redirige: queda claro por que).
export const ProtectedRoute = ({ roles }: ProtectedRouteProps) => {
  // isPending: true hasta que responde /api/auth/get-session. Sin esto, al hacer F5 en /admin
  // se redirigiria al login antes de saber si hay sesion.
  const { data: session, isPending } = useSession();
  const location = useLocation();

  if (isPending) {
    return <p className="text-ink-400">Verificando sesión…</p>;
  }

  if (!session) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (roles && !roles.includes(session.user.role as UserRole)) {
    return <Forbidden />;
  }

  return <Outlet />;
};

export const Forbidden = () => (
  <section className="card mx-auto max-w-md p-8 text-center">
    <p className="font-display text-5xl font-extrabold text-gold-400">403</p>
    <h2 className="mt-2 text-xl font-semibold">Sin permisos</h2>
    <p className="mt-2 text-ink-400">Esta sección es solo para administradores.</p>
    <Link to="/" className="btn-ghost mt-6">
      Volver al catálogo
    </Link>
  </section>
);
