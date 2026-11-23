// Ruta publica "/privacidad". Google la exige para publicar el login con Google (pantalla de consentimiento).
import { Link } from "react-router";

export const Privacy = () => (
  <article className="card mx-auto flex max-w-3xl flex-col gap-5 p-6 leading-relaxed text-ink-200 sm:p-8">
    <header>
      <h1 className="font-display text-3xl font-extrabold text-ink-100">Política de privacidad</h1>
      <p className="mt-1 text-sm text-ink-400">Última actualización: noviembre de 2026</p>
    </header>

    <p>
      Butaca es un proyecto académico (Trabajo Práctico 2 de Programación Web Full Stack). Esta página explica qué
      datos guarda la app y para qué.
    </p>

    <section className="flex flex-col gap-2">
      <h2 className="text-lg font-semibold text-ink-100">Qué datos guardamos</h2>
      <ul className="list-disc space-y-1 pl-5">
        <li>
          <strong>Datos de la cuenta:</strong> nombre, email y, si entrás con GitHub o Google, la foto de perfil que
          ese proveedor comparte. Si te registrás con email, la contraseña se guarda cifrada (hash), nunca en texto plano.
        </li>
        <li>
          <strong>Sesiones:</strong> una cookie de sesión y, por seguridad, la dirección IP y el navegador desde el que
          iniciaste sesión.
        </li>
        <li>
          <strong>Contenido que cargás:</strong> las películas que agregás, con tu nombre como autor visible en el catálogo.
        </li>
        <li>
          <strong>Mensajes al asistente:</strong> se envían a Google Gemini para generar la respuesta y no se guardan en
          nuestra base de datos.
        </li>
      </ul>
    </section>

    <section className="flex flex-col gap-2">
      <h2 className="text-lg font-semibold text-ink-100">Para qué los usamos</h2>
      <p>
        Solo para que puedas iniciar sesión y usar la app. No vendemos ni compartimos datos con terceros, no hay
        publicidad ni seguimiento. Del login con Google o GitHub solo pedimos tu nombre, email y foto de perfil.
      </p>
    </section>

    <section className="flex flex-col gap-2">
      <h2 className="text-lg font-semibold text-ink-100">Dónde se guardan</h2>
      <p>
        En una base de datos MongoDB Atlas. La app corre en Render. Podés pedir que borremos tu cuenta y tus datos
        escribiendo al contacto de abajo.
      </p>
    </section>

    <section className="flex flex-col gap-2">
      <h2 className="text-lg font-semibold text-ink-100">Contacto</h2>
      <p>
        Para consultas o para eliminar tu cuenta, abrí un issue en el{" "}
        <a href="https://github.com/lauta136/tp2-peliculas/issues" className="text-gold-400 underline-offset-4 hover:underline">
          repositorio del proyecto
        </a>
        .
      </p>
    </section>

    <Link to="/" className="btn-ghost self-start">
      Volver al catálogo
    </Link>
  </article>
);
