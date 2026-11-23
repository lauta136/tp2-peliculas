// La fecha llega como "2014-11-06T00:00:00.000Z" (medianoche UTC). Formateando en UTC se evita
// que en Argentina (UTC-3) se muestre el dia anterior.
export const formatDate = (iso: string): string =>
  new Date(iso).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "UTC" });

export const yearOf = (iso: string): number => new Date(iso).getUTCFullYear();

export const formatDuration = (minutes: number): string => {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h ? `${h} h ${m.toString().padStart(2, "0")} min` : `${m} min`;
};

export const formatRating = (rating: number): string => rating.toLocaleString("es-AR", { maximumFractionDigits: 1 });
