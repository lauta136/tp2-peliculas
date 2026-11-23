// Seccion /admin/*: solo admin (lo garantiza ProtectedRoute roles={["admin"]} en el router).
import { NavLink, Outlet } from "react-router";

const tabClass = ({ isActive }: { isActive: boolean }) =>
  `border-b-2 px-1 pb-2 text-sm font-medium transition ${isActive ? "border-gold-400 text-gold-300" : "border-transparent text-ink-400 hover:text-ink-100"}`;

export const AdminLayout = () => (
  <div className="flex flex-col gap-6">
    <header>
      <h1 className="font-display text-3xl font-extrabold">Panel de administración</h1>
      <nav aria-label="Administración" className="mt-4 flex gap-6 border-b border-ink-700/60">
        <NavLink to="/admin" end className={tabClass}>
          Películas
        </NavLink>
        <NavLink to="/admin/usuarios" className={tabClass}>
          Usuarios y roles
        </NavLink>
      </nav>
    </header>
    <Outlet />
  </div>
);
