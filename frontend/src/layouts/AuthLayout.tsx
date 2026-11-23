// Pantalla completa para login y registro: sin header, con la marca arriba de la tarjeta.
import type { ReactNode } from "react";
import { Logo } from "./Layout";

export const AuthLayout = ({ title, children }: { title: string; children: ReactNode }) => (
  <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(ellipse_at_top,var(--color-gold-950),var(--color-ink-950)_60%)] px-4 py-10">
    <div className="w-full max-w-sm">
      <div className="mb-6 flex justify-center">
        <Logo />
      </div>
      <section className="card p-6 shadow-2xl shadow-black/50">
        <h1 className="mb-5 font-display text-2xl font-semibold">{title}</h1>
        {children}
      </section>
    </div>
  </main>
);
