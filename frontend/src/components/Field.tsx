// Label + control + mensaje de error: el mismo envoltorio para todos los formularios.
import type { ReactNode } from "react";

interface FieldProps {
  label: string;
  error?: string;
  children: ReactNode;
  className?: string;
  hint?: string;
}

export const Field = ({ label, error, children, className = "", hint }: FieldProps) => (
  <label className={`flex flex-col gap-1.5 text-sm text-ink-200 ${className}`}>
    <span className="font-medium">{label}</span>
    {children}
    {error ? (
      <span className="text-xs text-red-300">{error}</span>
    ) : (
      hint && <span className="text-xs text-ink-500">{hint}</span>
    )}
  </label>
);

export const FormError = ({ message }: { message?: string }) =>
  message ? (
    <p role="alert" className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
      {message}
    </p>
  ) : null;
