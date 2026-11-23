// Arbol de rutas centralizado. Tres niveles de acceso: publico, privado y privado por rol.
import { createBrowserRouter } from "react-router";
import { Layout } from "../layouts/Layout";
import { ProtectedRoute } from "./ProtectedRoute";
import { Home } from "../pages/Home";
import { MovieDetail } from "../pages/MovieDetail";
import { Login } from "../pages/Login";
import { Register } from "../pages/Register";
import { Profile } from "../pages/Profile";
import { MyMovies } from "../pages/MyMovies";
import { AdminLayout } from "../pages/admin/AdminLayout";
import { AdminMovies } from "../pages/admin/AdminMovies";
import { AdminUsers } from "../pages/admin/AdminUsers";
import { NotFound } from "../pages/NotFound";
import { Privacy } from "../pages/Privacy";

export const router = createBrowserRouter([
  // Fuera del Layout: pantalla completa, sin header
  { path: "/login", element: <Login /> },
  { path: "/register", element: <Register /> },

  {
    path: "/",
    element: <Layout />,
    children: [
      // Publicas
      { index: true, element: <Home /> },
      { path: "peliculas/:id", element: <MovieDetail /> },
      { path: "privacidad", element: <Privacy /> },

      // Privadas: cualquier usuario logueado
      {
        element: <ProtectedRoute />,
        children: [
          { path: "mis-peliculas", element: <MyMovies /> },
          { path: "perfil", element: <Profile /> },
          // lazy: el chat (react-markdown) se descarga recien al entrar, no en la carga inicial.
          { path: "chat", lazy: async () => ({ Component: (await import("../pages/Chat")).Chat }) },
        ],
      },

      // Privadas por rol: solo admin (un user ve "Sin permisos")
      {
        element: <ProtectedRoute roles={["admin"]} />,
        children: [
          {
            path: "admin",
            element: <AdminLayout />,
            children: [
              { index: true, element: <AdminMovies /> },
              { path: "usuarios", element: <AdminUsers /> },
            ],
          },
        ],
      },

      { path: "*", element: <NotFound /> },
    ],
  },
]);
