import { X, Loader2, AlertTriangle, RefreshCw, Clapperboard } from "lucide-react";

const formatDateTime = (iso) => {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    return Number.isNaN(d.getTime()) ? "—" : d.toLocaleString();
  } catch {
    return "—";
  }
};

const statusBadgeClass = (status) =>
  status === "ACTIVE"
    ? "bg-emerald-100 text-emerald-600"
    : status === "COMING_SOON"
      ? "bg-amber-100 text-amber-600"
      : status === "INACTIVE"
        ? "bg-red-100 text-red-600"
        : "bg-neutral-200 text-neutral-600";

const statusDotClass = (status) =>
  status === "ACTIVE"
    ? "bg-emerald-500 animate-pulse"
    : status === "COMING_SOON"
      ? "bg-amber-500"
      : status === "INACTIVE"
        ? "bg-red-600"
        : "bg-neutral-500";

export default function ApiMovieDetailsModal({
  open,
  movie,
  isLoading,
  isError,
  error,
  onRetry,
  onClose,
}) {
  if (!open) return null;

  const detailEntry = (label, value, kind) => (
    <div className="rounded-xl bg-neutral-50 border border-neutral-200/70 px-3.5 py-2.5 shadow-xs">
      <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400 flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full bg-[#b90101]/40" />
        {label}
      </p>
      <p
        className={`mt-0.5 text-sm font-bold ${
          kind === "mono"
            ? "font-mono text-xs font-semibold text-neutral-600 break-all"
            : "text-neutral-900"
        }`}
      >
        {value !== undefined && value !== null && value !== "" ? value : "—"}
      </p>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center font-sans">
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="api-details-title"
        className="relative z-10 w-full max-w-lg mx-4 rounded-2xl bg-white border border-neutral-200 shadow-2xl p-6 max-h-[85vh] overflow-y-auto space-y-4"
      >
        <div className="flex items-center justify-between">
          <h3
            id="api-details-title"
            className="flex items-center gap-2 text-base font-black text-neutral-900"
          >
            <span className="w-7 h-7 rounded-lg bg-[#b90101]/10 text-[#b90101] flex items-center justify-center">
              <Clapperboard className="w-4 h-4" />
            </span>
            Movie Details
          </h3>
          <button
            type="button"
            onClick={onClose}
            title="Close"
            className="w-8 h-8 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-500 hover:text-neutral-800 flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center gap-3 py-12 text-neutral-500">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-sm font-bold">Fetching movie details…</span>
          </div>
        ) : isError ? (
          <div className="text-center py-8">
            <AlertTriangle className="w-8 h-8 text-red-500 mx-auto" />
            <p className="mt-3 text-sm font-bold text-red-700">
              Failed to load movie details.
            </p>
            <p className="text-xs font-semibold text-neutral-500 mt-1 break-all">
              {error?.data?.message ||
                error?.data?.error ||
                error?.error ||
                `Server returned HTTP ${error?.status}` ||
                "Unknown error"}
            </p>
            <button
              type="button"
              onClick={onRetry}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-[#b90101] text-white rounded-xl text-xs font-black hover:brightness-110 transition"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Try Again
            </button>
          </div>
        ) : !movie ? (
          <div className="text-center py-8">
            <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto" />
            <p className="mt-3 text-sm font-bold text-neutral-700">
              This movie has no data to display.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Hero */}
            <div className="rounded-2xl bg-gradient-to-br from-[#b90101] to-[#860101] p-5 text-white relative overflow-hidden shadow-sm">
              <p className="text-[11px] font-black uppercase tracking-widest text-white/70">
                Movie
              </p>
              <p className="text-2xl font-black leading-tight mt-0.5">
                {movie.title || "Untitled"}
              </p>
              <p className="text-xs font-semibold text-white/80 mt-1.5">
                {movie.originalTitle || movie.title} ·{" "}
                {movie.releaseDate || "—"} · {movie.language?.toUpperCase() || "—"}
              </p>
              {movie.posterUrl && (
                <img
                  src={movie.posterUrl}
                  alt=""
                  className="w-12 h-17 object-cover rounded-lg border border-white/40 absolute right-4 bottom-3"
                />
              )}
            </div>

            {/* Status badge */}
            <div className="flex items-center justify-between rounded-xl border border-neutral-200/70 px-3.5 py-2.5 bg-white">
              <span className="text-[10px] font-black uppercase tracking-widest text-neutral-400">
                Status
              </span>
              <span
                className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold ${statusBadgeClass(movie.status)}`}
              >
                <span className={`w-2 h-2 rounded-full ${statusDotClass(movie.status)}`} />
                {movie.status || "—"}
              </span>
            </div>

            {/* Overview */}
            {movie.overview && (
              <div className="rounded-xl bg-neutral-50 border border-neutral-200/70 px-3.5 py-2.5 shadow-xs">
                <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#b90101]/40" />
                  Overview
                </p>
                <p className="mt-1 text-sm font-medium text-neutral-700 leading-relaxed">
                  {movie.overview}
                </p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              {detailEntry("Original Title", movie.originalTitle)}
              {detailEntry("TMDB ID", movie.tmdbId)}
              {detailEntry("Release Date", movie.releaseDate)}
              {detailEntry(
                "Runtime",
                Number.isInteger(movie.runtimeMinutes)
                  ? `${movie.runtimeMinutes} min`
                  : "—",
              )}
              {detailEntry("Age Rating", movie.ageRating)}
              {detailEntry("Language", movie.language?.toUpperCase())}
            </div>

            <div className="grid grid-cols-1 gap-3">
              {detailEntry("Poster URL", movie.posterUrl, "mono")}
              {detailEntry("Backdrop URL", movie.backdropUrl, "mono")}
              {detailEntry("Movie UUID", movie.uuid, "mono")}
            </div>

            <div className="grid grid-cols-2 gap-3">
              {detailEntry("Created At", formatDateTime(movie.createdAt))}
              {detailEntry("Updated At", formatDateTime(movie.updatedAt))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}