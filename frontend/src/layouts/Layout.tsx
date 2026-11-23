// Layout generico: header con navegacion segun la sesion. Se monta una sola vez; al navegar solo
// cambia lo que renderiza <Outlet />.
import { Link, NavLink, Outlet } from "react-router";
import { signOut, useSession } from "../lib/auth-client";
import { isAdmin } from "../lib/permissions";
import { useGetConfigQuery } from "../store/api";

const navClass = ({ isActive }: { isActive: boolean }) =>
  `rounded-lg px-3 py-1.5 text-sm transition ${isActive ? "bg-ink-800 text-gold-300" : "text-ink-200 hover:bg-ink-800/70 hover:text-ink-100"}`;

export const Logo = () => (
  <Link to="/" className="flex items-center gap-2 font-display text-2xl font-extrabold tracking-tight text-ink-100">
    <img src="/favicon.svg" alt="" className="size-8" />
    Butaca
  </Link>
);

export const Layout = () => {
  const { data: session, isPending } = useSession();
  const { data: config } = useGetConfigQuery();
  const user = session?.user;

  // signOut borra la sesion EN LA BASE (no solo la cookie). Recarga completa en vez de navigate():
  // asi useSession y la cache de RTK Query arrancan limpios.
  const handleLogout = async () => {
    const { error } = await signOut();
    if (error) {
      alert(error.message ?? "No se pudo cerrar sesión");
      return;
    }
    window.location.replace("/login");
  };

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-10 border-b border-ink-700/60 bg-ink-950/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-3">
          <Logo />
          <nav className="flex flex-wrap items-center gap-1" aria-label="Principal">
            <NavLink to="/" end className={navClass}>
              Catálogo
            </NavLink>
            {user && (
              <NavLink to="/mis-peliculas" className={navClass}>
                Mis películas
              </NavLink>
            )}
            {user && config?.agent && (
              <NavLink to="/chat" className={navClass}>
                Asistente
              </NavLink>
            )}
            {isAdmin(user) && (
              <NavLink to="/admin" className={navClass}>
                Admin
              </NavLink>
            )}
            {isPending ? null : user ? (
              <>
                <NavLink to="/perfil" className={navClass}>
                  {user.name.split(" ")[0]}
                </NavLink>
                <button type="button" onClick={handleLogout} className="rounded-lg px-3 py-1.5 text-sm text-ink-400 hover:text-ink-100">
                  Salir
                </button>
              </>
            ) : (
              <>
                <NavLink to="/login" className={navClass}>
                  Ingresar
                </NavLink>
                <Link to="/register" className="btn-primary ml-1 py-1.5">
                  Crear cuenta
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        <Outlet />
      </main>
      <footer className="border-t border-ink-700/60 py-6 text-center text-xs text-ink-500">
        Butaca · TP2 Programación Web Full Stack · 2026
      </footer>
    </div>
  );
};
