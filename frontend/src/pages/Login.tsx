import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, Navigate, useLocation, useNavigate, type Location } from "react-router";
import { loginSchema, type LoginFormValues } from "../schemas/auth.schema";
import { signIn, useSession } from "../lib/auth-client";
import { AuthLayout } from "../layouts/AuthLayout";
import { Field, FormError } from "../components/Field";
import { SocialButtons } from "../components/SocialButtons";

const OAUTH_ERRORS: Record<string, string> = {
  account_not_linked: "Ya existe una cuenta con ese email. Ingresá con tu contraseña y conectá la cuenta desde tu perfil.",
  email_not_found: "Tu cuenta no tiene un email público. Hacelo visible en GitHub o usá otro método.",
  access_denied: "Cancelaste el inicio de sesión.",
};

export const Login = () => {
  const { data: session } = useSession();
  const navigate = useNavigate();
  const location = useLocation();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  // Si llego redirigido desde una ruta protegida, vuelve ahi despues del login.
  const from = (location.state as { from?: Location } | null)?.from?.pathname ?? "/";
  const oauthError = new URLSearchParams(location.search).get("error");

  if (session && !isSubmitting) {
    return <Navigate to={from} replace />;
  }

  const onSubmit = async (credentials: LoginFormValues) => {
    // Better Auth no tira excepcion: devuelve { data, error }. Si sale bien setea la cookie.
    const { error } = await signIn.email(credentials);
    if (error) {
      setError("root.server", {
        message: error.status === 401 ? "Email o contraseña incorrectos" : (error.message ?? "No se pudo iniciar sesión"),
      });
      return;
    }
    navigate(from, { replace: true });
  };

  // OAuth: redirige al proveedor; al volver, Better Auth crea la sesion y manda al callbackURL.
  // Si falla, vuelve a /login?error=<codigo> en vez de la pagina de error generica de Better Auth.
  const handleSocial = (provider: "github" | "google") =>
    signIn.social({ provider, callbackURL: from, errorCallbackURL: "/login" });

  return (
    <AuthLayout title="Iniciar sesión">
      {oauthError && (
        <div className="mb-4">
          <FormError message={OAUTH_ERRORS[oauthError] ?? "No se pudo iniciar sesión con ese proveedor."} />
        </div>
      )}
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
        <Field label="Email" error={errors.email?.message}>
          <input type="email" autoComplete="email" className="input" aria-invalid={!!errors.email} {...register("email")} />
        </Field>
        <Field label="Contraseña" error={errors.password?.message}>
          <input
            type="password"
            autoComplete="current-password"
            className="input"
            aria-invalid={!!errors.password}
            {...register("password")}
          />
        </Field>
        <FormError message={errors.root?.server?.message} />
        <button type="submit" disabled={isSubmitting} className="btn-primary py-2.5">
          {isSubmitting ? "Ingresando…" : "Ingresar"}
        </button>
      </form>
      <SocialButtons onSelect={handleSocial} />
      <p className="mt-5 text-center text-sm text-ink-400">
        ¿No tenés cuenta?{" "}
        <Link to="/register" className="font-medium text-gold-400 hover:underline">
          Crear cuenta
        </Link>
      </p>
      <p className="mt-2 text-center text-sm">
        <Link to="/" className="text-ink-500 hover:text-ink-200">
          Ver el catálogo sin cuenta
        </Link>
      </p>
    </AuthLayout>
  );
};
