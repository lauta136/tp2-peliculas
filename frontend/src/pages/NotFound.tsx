import { Link } from "react-router";

export const NotFound = () => (
  <section className="card mx-auto max-w-md p-8 text-center">
    <p className="font-display text-5xl font-extrabold text-gold-400">404</p>
    <h1 className="mt-2 text-xl font-semibold">Esta escena no existe</h1>
    <p className="mt-2 text-ink-400">La página que buscás no está en el catálogo.</p>
    <Link to="/" className="btn-ghost mt-6">
      Volver al catálogo
    </Link>
  </section>
);
