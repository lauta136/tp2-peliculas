// Ruta publica "/register". Crea el usuario (siempre rol "user") y Better Auth abre la sesion en el mismo paso.
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, Navigate, useNavigate } from "react-router";
import { signIn, signUp, useSession } from "../lib/auth-client";
import { registerSchema, type RegisterFormValues } from "../schemas/auth.schema";
import { AuthLayout } from "../layouts/AuthLayout";
import { Field, FormError } from "../components/Field";
import { SocialButtons } from "../components/SocialButtons";

export const Register = () => {
  const { data: session } = useSession();
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: "", email: "", password: "", confirmPassword: "" },
  });

  if (session && !isSubmitting) {
    return <Navigate to="/" replace />;
  }

  const onSubmit = async ({ name, email, password }: RegisterFormValues) => {
    const { error } = await signUp.email({ name, email, password });
    if (error) {
      if (error.code === "USER_ALREADY_EXISTS" || error.status === 422) {
        setError("email", { message: "Ya existe una cuenta con ese email" });
        return;
      }
      setError("root.server", { message: error.message ?? "No se pudo crear la cuenta" });
      return;
    }
    navigate("/", { replace: true });
  };

  return (
    <AuthLayout title="Crear cuenta">
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
        <Field label="Nombre" error={errors.name?.message}>
          <input autoComplete="name" className="input" aria-invalid={!!errors.name} {...register("name")} />
        </Field>
        <Field label="Email" error={errors.email?.message}>
          <input type="email" autoComplete="email" className="input" aria-invalid={!!errors.email} {...register("email")} />
        </Field>
        <Field label="Contraseña" error={errors.password?.message} hint="Mínimo 8 caracteres">
          <input
            type="password"
            autoComplete="new-password"
            className="input"
            aria-invalid={!!errors.password}
            {...register("password")}
          />
        </Field>
        <Field label="Repetir contraseña" error={errors.confirmPassword?.message}>
          <input
            type="password"
            autoComplete="new-password"
            className="input"
            aria-invalid={!!errors.confirmPassword}
            {...register("confirmPassword")}
          />
        </Field>
        <FormError message={errors.root?.server?.message} />
        <button type="submit" disabled={isSubmitting} className="btn-primary py-2.5">
          {isSubmitting ? "Creando…" : "Crear cuenta"}
        </button>
      </form>
      <SocialButtons
        label="Registrarme con"
        onSelect={(provider) => signIn.social({ provider, callbackURL: "/", errorCallbackURL: "/login" })}
      />
      <p className="mt-5 text-center text-sm text-ink-400">
        ¿Ya tenés cuenta?{" "}
        <Link to="/login" className="font-medium text-gold-400 hover:underline">
          Ingresar
        </Link>
      </p>
    </AuthLayout>
  );
};
