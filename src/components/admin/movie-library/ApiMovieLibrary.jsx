import { useState } from "react";
import {
  Clapperboard,
  Eye,
  Plus,
  RefreshCw,
  Trash2,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
} from "lucide-react";
import {
  useApiMoviesData,
  MOVIE_STATUSES,
} from "../../../pages/admin/hooks/useApiMoviesData";
import ApiMovieImportModal from "./ApiMovieImportModal";
import ApiMovieDetailsModal from "./ApiMovieDetailsModal";
import ApiMovieDeleteModal from "./ApiMovieDeleteModal";

// Status pill colors for the Cinema Movies table — soft, professional tints
// that only communicate status (the page keeps the FilmZone red/white theme).
const movieStatusPillClass = (status) => {
  if (status === "ACTIVE") return "bg-emerald-100 text-emerald-700";
  if (status === "COMING_SOON") return "bg-amber-100 text-amber-700";
  if (status === "INACTIVE" || !status) return "bg-neutral-200 text-neutral-600";
  return "bg-slate-200 text-slate-700"; // ARCHIVED
};

const movieStatusDotClass = (status) => {
  if (status === "ACTIVE") return "bg-emerald-500";
  if (status === "COMING_SOON") return "bg-amber-500";
  if (status === "INACTIVE" || !status) return "bg-neutral-500";
  return "bg-slate-500"; // ARCHIVED
};

const movieStatusLabel = (status) => (status || "—").replace("_", " ");

export default function ApiMovieLibrary() {
  const {
    movies,
    totalElements,
    totalPages,
    currentPage,
    firstPage,
    lastPage,
    isMoviesLoading,
    isMoviesFetching,
    isMoviesError,
    moviesError,
    refetchMovies,
    selectedMovieUuid,
    movieDetails,
    isDetailsLoading,
    isDetailsError,
    detailsError,
    refetchDetails,
    openMovieDetails,
    closeMovieDetails,
    searchQuery,
    setSearchQuery,
    tmdbSearch,
    isSearchLoading,
    isSearchError,
    searchError,
    refetchSearch,
    isCreating,
    handleImportMovie,
    isUpdatingStatus,
    handleUpdateStatus,
    isDeleting,
    handleDeleteMovie,
    handlePageChange,
  } = useApiMoviesData();

  const [importOpen, setImportOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null); // movie being deleted

  // Status dropdown: open menu position + an optimistic per-row status
  // override so the pill recolors instantly while the PATCH is in flight.
  const [statusMenu, setStatusMenu] = useState(null);
  const [statusOverrides, setStatusOverrides] = useState({});

  const getMovieUuid = (m) =>
    m?.uuid ?? m?.id ?? m?._id ?? m?.movieUuid ?? m?.movieId;

  const closeStatusMenu = () => setStatusMenu(null);

  const openStatusMenu = (movie, event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setStatusMenu({
      movie,
      x: rect.left,
      y: rect.bottom,
    });
  };

  const handlePickStatus = (movie, next) => {
    const uuid = getMovieUuid(movie);
    closeStatusMenu();
    // Re-selecting the current status — nothing to change.
    if (!next || next === (movie?.status || "")) return;
    // Optimistically recolor the pill; the existing PATCH + list refresh in
    // handleUpdateStatus is unchanged, then the override is cleared.
    setStatusOverrides((prev) => ({ ...prev, [uuid]: next }));
    void handleUpdateStatus(movie, next).finally(() => {
      setStatusOverrides((prev) => {
        if (!prev[uuid]) return prev;
        const nextOverrides = { ...prev };
        delete nextOverrides[uuid];
        return nextOverrides;
      });
    });
  };

  const handleImported = async (tmdbId, title) => {
    const ok = await handleImportMovie(tmdbId, title);
    if (ok) setImportOpen(false);
    return ok;
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    const ok = await handleDeleteMovie(deleteTarget);
    if (ok) setDeleteTarget(null);
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Hero + actions */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-neutral-200/80 bg-white p-5 shadow-xs">
        <div>
          <div className="relative inline-block pb-2">
            <h2 className="text-2xl font-black text-[#b90101] tracking-tight">
              Cinema Movies
            </h2>
            <div className="absolute bottom-0 left-0 w-24 h-1 bg-[#b90101] rounded-full" />
          </div>
          <p className="text-xs font-semibold text-neutral-500 mt-2 max-w-xl">
            Movies in the Cinema Booking, import new movies from
            TMDB, change their status, or delete them.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={refetchMovies}
            disabled={isMoviesFetching}
            className="inline-flex items-center gap-2 rounded-full border border-neutral-300 bg-white px-4 py-2.5 text-xs font-bold text-neutral-700 hover:border-[#b90101] hover:text-[#b90101] shadow-xs transition cursor-pointer disabled:opacity-60"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${isMoviesFetching ? "animate-spin" : ""}`}
            />
            Refresh
          </button>
          <button
            type="button"
            onClick={() => setImportOpen(true)}
            className="inline-flex items-center gap-2 rounded-full bg-[#b90101] hover:brightness-110 px-5 py-2.5 text-white text-xs font-black uppercase tracking-wider shadow-md transition active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Search & Import
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-3xl border border-neutral-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[920px] xl:min-w-0 table-fixed text-left border-collapse">
            <thead>
              <tr className="bg-[#b90101] text-white text-lg font-black uppercase tracking-wider">
                <th className="py-3.5 px-4 w-[32%]">TITLE & MEDIA</th>
                <th className="py-3.5 px-4 w-[16%] whitespace-nowrap">RELEASE DATE</th>
                <th className="py-3.5 px-4 w-[12%] whitespace-nowrap">RUNTIME</th>
                <th className="py-3.5 px-4 w-[18%]">STATUS</th>
                <th className="py-3.5 px-4 w-[22%] text-center whitespace-nowrap">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 font-semibold text-neutral-800">
              {isMoviesLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-14 bg-neutral-200 rounded-lg shrink-0" />
                        <div className="space-y-2 flex-1 min-w-0">
                          <div className="w-40 h-4 bg-neutral-200 rounded" />
                          <div className="w-24 h-3 bg-neutral-200 rounded" />
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4"><div className="w-24 h-4 bg-neutral-200 rounded" /></td>
                    <td className="py-3.5 px-4"><div className="w-14 h-4 bg-neutral-200 rounded" /></td>
                    <td className="py-3.5 px-4"><div className="w-20 h-5 bg-neutral-200 rounded" /></td>
                  </tr>
                ))
              ) : isMoviesError ? (
                <tr>
                  <td colSpan="5">
                    <div className="py-12 text-center">
                      <AlertTriangle className="w-8 h-8 text-red-500 mx-auto" />
                      <p className="mt-3 text-sm font-bold text-red-700">
                        Failed to load movies from the Cinema Booking API.
                      </p>
                      <p className="text-xs font-semibold text-neutral-500 mt-1 break-all">
                        {moviesError?.data?.message ||
                          moviesError?.data?.error ||
                          moviesError?.error ||
                          `Server returned HTTP ${moviesError?.status}` ||
                          "Unknown error"}
                      </p>
                      <button
                        type="button"
                        onClick={refetchMovies}
                        className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-[#b90101] text-white rounded-xl text-xs font-black hover:brightness-110 transition"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        Try Again
                      </button>
                    </div>
                  </td>
                </tr>
              ) : movies.length === 0 ? (
                <tr>
                  <td colSpan="5">
                    <div className="py-12 text-center">
                      <Clapperboard className="w-10 h-10 text-neutral-300 mx-auto" />
                      <p className="mt-3 text-sm font-bold text-neutral-500">
                        No movies in the Cinema Booking API yet.
                      </p>
                      <p className="text-xs font-semibold text-neutral-400 mt-1">
                        Use "Search & Import" above to create your first movie.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                movies.map((movie) => (
                  <tr
                    key={getMovieUuid(movie) ?? movie?.title}
                    className="hover:bg-neutral-50/80 transition-colors"
                  >
                    <td className="py-3 px-3 sm:px-4">
                      <div className="flex items-center gap-3 min-w-0">
                        {movie?.posterUrl ? (
                          <img
                            src={movie.posterUrl}
                            alt={movie.title}
                            className="w-10 h-14 object-cover rounded-lg shadow-xs border border-neutral-200 shrink-0"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-10 h-14 rounded-lg bg-neutral-100 flex items-center justify-center shrink-0">
                            <Clapperboard className="w-4 h-4 text-neutral-400" />
                          </div>
                        )}
                        <div className="flex flex-col min-w-0 flex-1">
                          <span
                            className="font-extrabold text-neutral-900 text-lg leading-snug truncate block"
                            title={movie?.title}
                          >
                            {movie?.title || "Untitled"}
                          </span>
                          <div className="flex items-center gap-1.5 text-sm text-neutral-500 font-medium mt-0.5 truncate">
                            <span>{movie?.originalTitle || "—"}</span>
                            {movie?.language && (
                              <span className="uppercase text-xs font-black px-1.5 py-0.2 rounded bg-neutral-100 text-neutral-700">
                                [{movie.language}]
                              </span>
                            )}
                            {movie?.ageRating && (
                              <span className="uppercase text-xs font-bold text-neutral-400">
                                {movie.ageRating}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3 sm:px-4 font-medium text-neutral-700">
                      <span className="font-bold text-neutral-900 text-lg block truncate">
                        {movie?.releaseDate || "—"}
                      </span>
                    </td>
                    <td className="py-3 px-3 sm:px-4 whitespace-nowrap font-medium text-neutral-700">
                      {Number.isInteger(movie?.runtimeMinutes)
                        ? `${movie.runtimeMinutes} min`
                        : "—"}
                    </td>
                    <td className="py-3 px-3 sm:px-4">
                      <button
                        type="button"
                        onClick={(event) => openStatusMenu(movie, event)}
                        disabled={isUpdatingStatus}
                        title="Update movie status"
                        aria-haspopup="menu"
                        className={`inline-flex items-center justify-center gap-1.5 min-w-[96px] rounded-full px-2.5 py-1 text-[10px] font-black uppercase ${movieStatusPillClass(
                          statusOverrides[getMovieUuid(movie)] || movie?.status,
                        )} transition hover:brightness-110 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${movieStatusDotClass(
                            statusOverrides[getMovieUuid(movie)] || movie?.status,
                          )}`}
                        />
                        {movieStatusLabel(
                          statusOverrides[getMovieUuid(movie)] || movie?.status,
                        )}
                        <ChevronDown className="w-3 h-3" />
                      </button>
                    </td>
                    <td className="py-3 px-3 sm:px-4 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => openMovieDetails(getMovieUuid(movie))}
                          disabled={!getMovieUuid(movie)}
                          className="w-8 h-8 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-800 flex items-center justify-center border border-neutral-200 shadow-xs transition active:scale-95 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                          title="View movie details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(movie)}
                          disabled={isDeleting}
                          className="w-8 h-8 rounded-full bg-neutral-200 hover:bg-red-600 hover:text-white text-neutral-700 flex items-center justify-center shadow-xs transition active:scale-95 cursor-pointer disabled:opacity-50"
                          title="Delete movie"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {/* Pagination footer */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-neutral-100 flex flex-col sm:flex-row items-center justify-between gap-4 bg-neutral-50/50">
            <span className="text-xs font-semibold text-neutral-500">
              {totalElements} movie(s) · Page{" "}
              <span className="font-bold text-neutral-800">{currentPage + 1}</span>{" "}
              of <span className="font-bold text-neutral-800">{totalPages}</span>
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={firstPage || currentPage === 0}
                onClick={() => handlePageChange(currentPage - 1)}
                className="p-2 rounded-xl bg-white border border-neutral-200 text-neutral-600 hover:bg-neutral-100 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum = i + 1;
                  if (currentPage + 1 > 3 && totalPages > 5) {
                    pageNum = Math.min(
                      currentPage - 2 + i,
                      totalPages - (4 - i),
                    );
                  }
                  return (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum - 1)}
                      className={`w-8 h-8 rounded-xl text-xs font-bold transition cursor-pointer ${
                        currentPage + 1 === pageNum
                          ? "bg-[#b90101] text-white shadow-xs"
                          : "bg-white text-neutral-600 border border-neutral-200 hover:bg-neutral-100"
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>
              <button
                type="button"
                disabled={lastPage || currentPage >= totalPages - 1}
                onClick={() => handlePageChange(currentPage + 1)}
                className="p-2 rounded-xl bg-white border border-neutral-200 text-neutral-600 hover:bg-neutral-100 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
      {/* Status dropdown menu */}
      {statusMenu && (
        <>
          <div
            className="fixed inset-0 z-[70]"
            onClick={closeStatusMenu}
            aria-hidden="true"
          />
          <div
            role="menu"
            aria-label="Change movie status"
            className="fixed z-[71] rounded-xl border border-neutral-200 bg-white shadow-lg py-1.5 min-w-[150px]"
            style={{
              left: Math.max(8, Math.min(statusMenu.x, window.innerWidth - 158)),
              top:
                statusMenu.y + 160 > window.innerHeight
                  ? statusMenu.y - 168
                  : statusMenu.y,
            }}
          >
            {MOVIE_STATUSES.map((status) => (
              <button
                key={status}
                type="button"
                role="menuitem"
                onClick={() => handlePickStatus(statusMenu.movie, status)}
                className={`flex w-full items-center gap-2 rounded-lg px-3 py-1.5 text-[11px] font-black uppercase transition hover:bg-neutral-100 ${
                  (statusOverrides[getMovieUuid(statusMenu.movie)] ||
                    statusMenu.movie?.status) === status
                    ? "bg-neutral-100"
                    : ""
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${movieStatusDotClass(status)}`} />
                {movieStatusLabel(status)}
              </button>
            ))}
          </div>
        </>
      )}

      {/* Modals */}
      <ApiMovieImportModal
        open={importOpen}
        onClose={() => setImportOpen(false)}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        results={
          Array.isArray(tmdbSearch?.results)
            ? tmdbSearch.results
            : Array.isArray(tmdbSearch)
              ? tmdbSearch
              : []
        }
        isSearchLoading={isSearchLoading}
        isSearchError={isSearchError}
        searchError={searchError}
        refetchSearch={refetchSearch}
        isCreating={isCreating}
        onImport={handleImported}
      />

      <ApiMovieDetailsModal
        open={selectedMovieUuid !== null}
        movie={movieDetails}
        isLoading={isDetailsLoading}
        isError={isDetailsError}
        error={detailsError}
        onRetry={refetchDetails}
        onClose={closeMovieDetails}
      />

      <ApiMovieDeleteModal
        movie={deleteTarget}
        isDeleting={isDeleting}
        onConfirm={handleConfirmDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
}