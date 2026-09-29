import { X, Trash2, Loader2 } from "lucide-react";

export default function ApiMovieDeleteModal({
  movie,
  isDeleting,
  onConfirm,
  onClose,
}) {
  if (!movie) return null;
  const title = movie?.title || "Untitled";

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
        aria-labelledby="api-delete-title"
        className="relative z-10 w-full max-w-sm mx-4 rounded-2xl bg-white border border-neutral-200 shadow-2xl p-6 space-y-4"
      >
        <div className="flex items-center justify-between">
          <h3
            id="api-delete-title"
            className="flex items-center gap-2 text-base font-black text-neutral-900"
          >
            <span className="w-7 h-7 rounded-lg bg-red-100 text-red-600 flex items-center justify-center">
              <Trash2 className="w-4 h-4" />
            </span>
            Delete Movie
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

        <div className="flex items-center gap-3">
          {movie?.posterUrl && (
            <img
              src={movie.posterUrl}
              alt={title}
              className="w-12 h-17 object-cover rounded-lg border border-neutral-200 shadow-xs shrink-0"
            />
          )}
          <p className="text-sm font-semibold text-neutral-600 leading-relaxed">
            Are you sure you want to delete{" "}
            <span className="font-black text-neutral-900">&quot;{title}&quot;</span>
            ? This removes it from the Cinema Booking API.
          </p>
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-1">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="inline-flex items-center justify-center rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm font-black text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900 transition active:scale-95 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-black px-4 py-2.5 transition active:scale-95 disabled:opacity-60 disabled:pointer-events-none"
          >
            {isDeleting ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Trash2 className="w-3.5 h-3.5" />
            )}
            {isDeleting ? "Deleting…" : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}