import { useState, useEffect } from "react";
import { Search, X, Plus, Loader2, AlertTriangle } from "lucide-react";

const inputClass =
  "w-full rounded-xl border border-neutral-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-neutral-900 outline-none focus:border-[#b90101] focus:ring-2 focus:ring-[#b90101]/20 transition";

// Turn a TMDB `poster_path` into a full image URL (same rule as the rest of
// the movie library — only prepend the CDN base when it is not already a URL).
const tmdbPosterUrl = (item) =>
  item?.poster_path
    ? item.poster_path.startsWith("http")
      ? item.poster_path
      : `https://image.tmdb.org/t/p/w500${item.poster_path}`
    : "";

export default function ApiMovieImportModal({
  open,
  onClose,
  searchQuery,
  setSearchQuery,
  results,
  isSearchLoading,
  isSearchError,
  searchError,
  refetchSearch,
  isCreating,
  onImport,
}) {
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    if (open) setSelected(null);
  }, [open]);

  if (!open) return null;

  const triggerSearch = () => {
    if (searchQuery.trim().length < 2) return;
    refetchSearch();
  };

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
        aria-labelledby="api-import-title"
        className="relative z-10 w-full max-w-2xl mx-4 rounded-2xl bg-white border border-neutral-200 shadow-2xl p-6 max-h-[85vh] overflow-y-auto space-y-4"
      >
        <div className="flex items-center justify-between">
          <h3
            id="api-import-title"
            className="flex items-center gap-2 text-base font-black text-neutral-900"
          >
            <span className="w-7 h-7 rounded-lg bg-[#b90101]/10 text-[#b90101] flex items-center justify-center">
              <Plus className="w-4 h-4" />
            </span>
            Import Movie from TMDB
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

        <p className="text-xs font-semibold text-neutral-500 leading-relaxed">
          Search TMDB, pick a movie, and import it into the Cinema Booking API.
          The backend fills title, original title, overview, poster / backdrop
          URLs, runtime, release date, age rating and language from TMDB.
        </p>

        {/* Search box */}
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") triggerSearch();
            }}
            placeholder="Search TMDB… e.g. Interstellar"
            className={inputClass}
          />
          <button
            type="button"
            onClick={triggerSearch}
            disabled={searchQuery.trim().length < 2}
            className="inline-flex items-center gap-2 rounded-xl bg-[#b90101] hover:brightness-110 text-white text-sm font-black px-4 py-2.5 transition active:scale-95 disabled:opacity-50 disabled:pointer-events-none shrink-0"
          >
            <Search className="w-4 h-4" />
            Search
          </button>
        </div>

        {searchQuery.trim().length >= 2 && isSearchError ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-3.5">
            <p className="text-xs font-bold text-red-700">
              TMDB search failed.
            </p>
            <p className="text-xs font-semibold text-neutral-500 mt-0.5 break-all">
              {searchError?.data?.message ||
                searchError?.data?.error ||
                searchError?.error ||
                `Server returned HTTP ${searchError?.status}` ||
                "Unknown error"}
            </p>
            <button
              type="button"
              onClick={refetchSearch}
              className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#b90101] text-white text-xs font-black hover:brightness-110 transition"
            >
              Try Again
            </button>
          </div>
        ) : searchQuery.trim().length >= 2 && isSearchLoading ? (
          <div className="flex items-center justify-center gap-3 py-10 text-neutral-500">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-sm font-bold">Searching TMDB…</span>
          </div>
        ) : searchQuery.trim().length < 2 ? (
          <div className="text-center py-8 text-neutral-400">
            <p className="text-sm font-bold">
              Type at least 2 characters to search TMDB.
            </p>
          </div>
        ) : !results || results.length === 0 ? (
          <div className="text-center py-8">
            <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto" />
            <p className="mt-3 text-sm font-bold text-neutral-600">
              No movies found for "{searchQuery}".
            </p>
          </div>
        ) : (
          <div className="max-h-64 overflow-y-auto divide-y divide-neutral-100 border border-neutral-200/70 rounded-xl">
            {results.map((item) => {
              const isSelected = selected?.id === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelected(item)}
                  className={`w-full flex items-center gap-3 text-left px-3.5 py-2.5 transition cursor-pointer ${
                    isSelected ? "bg-[#b90101]/10" : "hover:bg-neutral-50"
                  }`}
                >
                  <img
                    src={tmdbPosterUrl(item)}
                    alt={item.title}
                    className="w-9 h-13 object-cover rounded-md border border-neutral-200 shrink-0"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-extrabold text-neutral-900 truncate">
                      {item.title || "Untitled"}
                    </span>
                    <span className="block text-xs font-semibold text-neutral-500 truncate">
                      {item.original_title || item.title} · {item.release_date || "—"} ·{" "}
                      {item.original_language?.toUpperCase() || "—"}
                    </span>
                  </span>
                  <span
                    className={`text-[10px] font-black uppercase px-2 py-1 rounded-full ${
                      isSelected
                        ? "bg-[#b90101] text-white"
                        : "bg-neutral-100 text-neutral-600"
                    }`}
                  >
                    {isSelected ? "Selected" : "Select"}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* Selected movie preview + import */}
        {selected && (
          <div className="rounded-2xl border border-[#b90101]/30 bg-[#b90101]/5 p-4 space-y-3">
            <div className="flex items-center gap-3">
              <img
                src={tmdbPosterUrl(selected)}
                alt={selected.title}
                className="w-14 h-20 object-cover rounded-lg border border-neutral-200 shadow-xs shrink-0"
              />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-black text-neutral-900 leading-tight truncate">
                  {selected.title || "Untitled"}
                </p>
                <p className="text-xs font-semibold text-neutral-500 mt-0.5 truncate">
                  Original Title: {selected.original_title || "—"}
                </p>
                <p className="text-xs font-semibold text-neutral-500 mt-0.5 truncate">
                  TMDB ID: {selected.id} · Language:{" "}
                  {selected.original_language?.toUpperCase() || "—"} · Release:{" "}
                  {selected.release_date || "—"}
                </p>
              </div>
            </div>

            {selected.overview && (
              <p className="text-xs font-medium text-neutral-600 leading-relaxed line-clamp-3">
                {selected.overview}
              </p>
            )}

            <button
              type="button"
              onClick={() => onImport(selected.id, selected.title)}
              disabled={isCreating}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#b90101] hover:brightness-110 text-white text-sm font-black py-3 transition active:scale-[0.98] disabled:opacity-60 disabled:pointer-events-none"
            >
              {isCreating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
              {isCreating ? "Importing…" : "Import to Cinema Movies"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}