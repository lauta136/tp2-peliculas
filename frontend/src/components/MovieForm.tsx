// Formulario de alta / edicion: React Hook Form + Zod. Si el backend responde 400 con errores por
// campo (details), se muestran debajo de cada input igual que los de Zod en el front.
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { getErrorMessage, type ApiError } from "../lib/api";
import { emptyMovie, movieSchema, toMovieFormValues, type MovieFormValues } from "../schemas/movie.schema";
import { GENRES, GENRE_LABELS, type Movie } from "../types/movie";
import { Field, FormError } from "./Field";

interface MovieFormProps {
  movie: Movie | null;
  onSave: (values: MovieFormValues) => Promise<void>;
  onCancel?: () => void;
}

export const MovieForm = ({ movie, onSave, onCancel }: MovieFormProps) => {
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<MovieFormValues>({
    resolver: zodResolver(movieSchema),
    // values (no defaultValues): al elegir otra pelicula para editar, el form se actualiza solo.
    values: movie ? toMovieFormValues(movie) : emptyMovie,
  });

  const onSubmit = async (values: MovieFormValues) => {
    try {
      await onSave(values);
      reset(emptyMovie);
    } catch (err) {
      const details = (err as ApiError)?.details ?? {};
      for (const [field, messages] of Object.entries(details)) {
        if (messages?.[0] && field in emptyMovie) setError(field as keyof MovieFormValues, { message: messages[0] });
      }
      setError("root.server", { message: getErrorMessage(err) });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="card flex flex-col gap-4 p-5">
      <h3 className="font-display text-xl font-semibold">
        {movie ? `Editando “${movie.title}”` : "Nueva película"}
      </h3>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Título" error={errors.title?.message}>
          <input className="input" aria-invalid={!!errors.title} {...register("title")} />
        </Field>
        <Field label="Director" error={errors.director?.message}>
          <input className="input" aria-invalid={!!errors.director} {...register("director")} />
        </Field>
        <Field label="Género" error={errors.genre?.message}>
          <select className="input" aria-invalid={!!errors.genre} {...register("genre")}>
            <option value="">Elegí un género…</option>
            {GENRES.map((g) => (
              <option key={g} value={g}>
                {GENRE_LABELS[g]}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Fecha de estreno" error={errors.releaseDate?.message}>
          <input type="date" className="input" aria-invalid={!!errors.releaseDate} {...register("releaseDate")} />
        </Field>
        <Field label="Duración (minutos)" error={errors.durationMinutes?.message}>
          <input
            type="number"
            inputMode="numeric"
            min={1}
            max={600}
            className="input"
            aria-invalid={!!errors.durationMinutes}
            {...register("durationMinutes", { valueAsNumber: true })}
          />
        </Field>
        <Field label="Puntaje (0 a 10)" error={errors.rating?.message}>
          <input
            type="number"
            inputMode="decimal"
            min={0}
            max={10}
            step={0.5}
            className="input"
            aria-invalid={!!errors.rating}
            {...register("rating", { valueAsNumber: true })}
          />
        </Field>
        <Field label="URL del póster (opcional)" error={errors.posterUrl?.message} className="sm:col-span-2">
          <input
            type="url"
            placeholder="https://…"
            className="input"
            aria-invalid={!!errors.posterUrl}
            {...register("posterUrl")}
          />
        </Field>
        <Field label="Sinopsis (opcional)" error={errors.synopsis?.message} className="sm:col-span-2">
          <textarea rows={3} className="input resize-y" aria-invalid={!!errors.synopsis} {...register("synopsis")} />
        </Field>
      </div>

      <label className="flex items-center gap-2 text-sm text-ink-200">
        <input type="checkbox" className="size-4 accent-gold-400" {...register("watched")} />
        Ya la vi
      </label>

      <FormError message={errors.root?.server?.message} />

      <div className="flex flex-wrap gap-2">
        <button type="submit" disabled={isSubmitting} className="btn-primary">
          {isSubmitting ? "Guardando…" : movie ? "Guardar cambios" : "Agregar película"}
        </button>
        {movie && onCancel && (
          <button type="button" onClick={onCancel} className="btn-ghost">
            Cancelar edición
          </button>
        )}
      </div>
    </form>
  );
};
