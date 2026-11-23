interface PaginationProps {
  page: number;
  totalPages: number;
  total: number;
  onChange: (page: number) => void;
}

export const Pagination = ({ page, totalPages, total, onChange }: PaginationProps) => {
  if (totalPages <= 1) return null;

  return (
    <nav aria-label="Paginación" className="flex items-center justify-between gap-3 text-sm text-ink-400">
      <span>
        Página {page} de {totalPages} · {total} películas
      </span>
      <div className="flex gap-2">
        <button type="button" className="btn-ghost" disabled={page <= 1} onClick={() => onChange(page - 1)}>
          ← Anterior
        </button>
        <button type="button" className="btn-ghost" disabled={page >= totalPages} onClick={() => onChange(page + 1)}>
          Siguiente →
        </button>
      </div>
    </nav>
  );
};
