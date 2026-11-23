// Botones de login social. Solo aparecen los proveedores configurados en el backend (/api/config).
import { useGetConfigQuery } from "../store/api";

const GithubIcon = () => (
  <svg viewBox="0 0 24 24" className="size-4" fill="currentColor" aria-hidden="true">
    <path d="M12 .5a11.5 11.5 0 0 0-3.64 22.41c.58.1.79-.25.79-.56v-2c-3.2.7-3.88-1.37-3.88-1.37-.52-1.33-1.28-1.69-1.28-1.69-1.05-.71.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.56-.29-5.25-1.28-5.25-5.69 0-1.26.45-2.29 1.19-3.1-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.17 1.18a11 11 0 0 1 5.77 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.84 1.19 3.1 0 4.42-2.7 5.4-5.27 5.68.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56A11.5 11.5 0 0 0 12 .5Z" />
  </svg>
);

const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" className="size-4" aria-hidden="true">
    <path fill="#4285F4" d="M23.5 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.45a5.5 5.5 0 0 1-2.39 3.62v3h3.86c2.26-2.09 3.58-5.16 3.58-8.81Z" />
    <path fill="#34A853" d="M12 24c3.24 0 5.95-1.07 7.93-2.92l-3.86-3c-1.07.72-2.45 1.15-4.07 1.15-3.13 0-5.78-2.11-6.73-4.95H1.28v3.1A12 12 0 0 0 12 24Z" />
    <path fill="#FBBC05" d="M5.27 14.28a7.2 7.2 0 0 1 0-4.56v-3.1H1.28a12 12 0 0 0 0 10.76l3.99-3.1Z" />
    <path fill="#EA4335" d="M12 4.77c1.76 0 3.34.61 4.59 1.8l3.43-3.43A11.5 11.5 0 0 0 12 0 12 12 0 0 0 1.28 6.62l3.99 3.1C6.22 6.88 8.87 4.77 12 4.77Z" />
  </svg>
);

interface SocialButtonsProps {
  onSelect: (provider: "github" | "google") => void;
  label?: string;
}

export const SocialButtons = ({ onSelect, label = "Continuar con" }: SocialButtonsProps) => {
  const { data: config } = useGetConfigQuery();
  const providers = config?.socialProviders;
  if (!providers || (!providers.github && !providers.google)) return null;

  return (
    <>
      <div className="my-5 flex items-center gap-3 text-xs text-ink-500">
        <span className="h-px flex-1 bg-ink-700" />o<span className="h-px flex-1 bg-ink-700" />
      </div>
      <div className="flex flex-col gap-2">
        {providers.github && (
          <button type="button" onClick={() => onSelect("github")} className="btn-ghost w-full py-2.5">
            <GithubIcon /> {label} GitHub
          </button>
        )}
        {providers.google && (
          <button type="button" onClick={() => onSelect("google")} className="btn-ghost w-full py-2.5">
            <GoogleIcon /> {label} Google
          </button>
        )}
      </div>
    </>
  );
};
