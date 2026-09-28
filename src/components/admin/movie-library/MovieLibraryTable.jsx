import { Film, Plus, RefreshCw, ChevronLeft, ChevronRight } from "lucide-react";
import MovieLibraryRow from "./MovieLibraryRow";

export default function MovieLibraryTable({
  items,
  isLoading,
  activePanel,
  activePanelId,
  catalogTmdbIdSet,
  formatGenres,
  onEdit,
  onDelete,
  onQuickImport,
  onCustomizeSchedule,
  onAddCustom,
  onRestore100,
  totalPages,
  currentPage,
  onPageChange,
}) {
  const isManaged = activePanelId === "MANAGED";

  return (
    <div className="w-full max-w-full bg-white rounded-2xl sm:rounded-3xl border border-neutral-200/80 shadow-xs overflow-hidden">
      <div className="w-full max-w-full overflow-x-auto scrollbar-thin">
        <table className="w-full min-w-[760px] md:min-w-[860px] xl:min-w-0 table-fixed text-left border-collapse">
          <thead>
            <tr className="bg-[#b90101] text-white text-xs sm:text-sm lg:text-[16px] xl:text-[18px] font-black uppercase tracking-wider">
              <th
                className={`py-3.5 px-3 sm:px-4 ${isManaged ? "w-[28%]" : "w-[32%]"}`}
              >
                TITLE & MEDIA
              </th>
              <th
                className={`py-3.5 px-3 sm:px-4 ${isManaged ? "w-[22%]" : "w-[18%]"} whitespace-nowrap`}
              >
                {isManaged ? "SCHEDULE DATE" : "RELEASE DATE"}
              </th>
              <th
                className={`py-3.5 px-2.5 sm:px-4 ${isManaged ? "w-[12%]" : "w-[14%]"} whitespace-nowrap`}
              >
                RATING
              </th>
              <th
                className={`py-3.5 px-3 sm:px-4 ${isManaged ? "w-[16%]" : "w-[18%]"}`}
              >
                GENRES
              </th>
              {isManaged && (
                <th className="py-3.5 px-3 sm:px-4 w-[10%] text-center whitespace-nowrap">
                  STATUS
                </th>
              )}
              <th
                className={`py-3.5 px-3 sm:px-4 ${isManaged ? "w-[12%]" : "w-[18%]"} text-center whitespace-nowrap`}
              >
                ACTIONS
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-neutral-100 text-xs sm:text-sm lg:text-[16px] xl:text-[18px] font-semibold text-neutral-800">
            {isLoading
              ? // Loading Skeleton Rows
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="py-3.5 px-3 sm:px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-14 bg-neutral-200 rounded-lg shrink-0" />
                        <div className="space-y-2 flex-1 min-w-0">
                          <div className="w-28 sm:w-32 h-4 bg-neutral-200 rounded" />
                          <div className="w-16 sm:w-20 h-3 bg-neutral-200 rounded" />
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-3 sm:px-4">
                      <div className="w-20 sm:w-24 h-4 bg-neutral-200 rounded" />
                    </td>
                    <td className="py-3.5 px-2.5 sm:px-4">
                      <div className="w-12 sm:w-16 h-4 bg-neutral-200 rounded" />
                    </td>
                    <td className="py-3.5 px-3 sm:px-4">
                      <div className="w-20 sm:w-24 h-4 bg-neutral-200 rounded" />
                    </td>
                    {isManaged && (
                      <td className="py-3.5 px-3 sm:px-4 text-center">
                        <div className="w-14 sm:w-16 h-6 bg-neutral-200 rounded-full mx-auto" />
                      </td>
                    )}
                    <td className="py-3.5 px-3 sm:px-4 text-center">
                      <div className="w-20 sm:w-24 h-8 bg-neutral-200 rounded-full mx-auto" />
                    </td>
                  </tr>
                ))
              : items.map((item) => {
                  const isInCatalog =
                    catalogTmdbIdSet.has(Number(item.id)) ||
                    catalogTmdbIdSet.has(Number(item.tmdbId));

                  return (
                    <MovieLibraryRow
                      key={item.id || Math.random()}
                      item={item}
                      activePanel={activePanel}
                      activePanelId={activePanelId}
                      isInCatalog={isInCatalog}
                      genresStr={formatGenres(item)}
                      onEdit={onEdit}
                      onDelete={onDelete}
                      onQuickImport={onQuickImport}
                      onCustomizeSchedule={onCustomizeSchedule}
                    />
                  );
                })}
          </tbody>
        </table>

        {/* Empty State */}
        {!isLoading && items.length === 0 && (
          <div className="p-8 sm:p-12 lg:p-16 text-center space-y-4">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl sm:rounded-3xl bg-red-50 border border-red-200 text-[#b90101] flex items-center justify-center mx-auto shadow-sm">
              <Film className="w-7 h-7 sm:w-8 sm:h-8" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-neutral-900">
                No items found in {activePanel.label}
              </h3>
              <p className="text-xs sm:text-sm text-neutral-500 max-w-sm mx-auto mt-1">
                Try adjusting your search keyword, genre filter, or switch to
                another TMDB category.
              </p>
            </div>

            {activePanelId === "MANAGED" && (
              <div className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-3 pt-2">
                <button
                  type="button"
                  onClick={onAddCustom}
                  className="flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-full bg-[#b90101] text-white font-extrabold text-xs shadow-md transition hover:brightness-110 active:scale-95 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Custom Movie</span>
                </button>

                <button
                  type="button"
                  onClick={onRestore100}
                  className="flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-full bg-white border border-neutral-300 hover:border-[#b90101] text-neutral-700 hover:text-[#b90101] font-bold text-xs shadow-xs transition cursor-pointer"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Load 100 Offline TMDB Backup</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div className="p-3.5 sm:p-4 border-t border-neutral-100 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 bg-neutral-50/50">
          <span className="text-xs font-semibold text-neutral-500 text-center sm:text-left">
            Showing page{" "}
            <span className="font-bold text-neutral-800">{currentPage}</span> of{" "}
            <span className="font-bold text-neutral-800">{totalPages}</span>
          </span>

          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              type="button"
              disabled={currentPage === 1}
              onClick={() => onPageChange(currentPage - 1)}
              className="p-1.5 sm:p-2 rounded-xl bg-white border border-neutral-200 text-neutral-600 hover:bg-neutral-100 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
              aria-label="Previous Page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum = i + 1;
                if (currentPage > 3 && totalPages > 5) {
                  pageNum = Math.min(currentPage - 2 + i, totalPages - (4 - i));
                }
                return (
                  <button
                    key={pageNum}
                    type="button"
                    onClick={() => onPageChange(pageNum)}
                    className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl text-xs font-bold transition cursor-pointer ${
                      currentPage === pageNum
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
              disabled={currentPage === totalPages}
              onClick={() => onPageChange(currentPage + 1)}
              className="p-1.5 sm:p-2 rounded-xl bg-white border border-neutral-200 text-neutral-600 hover:bg-neutral-100 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
              aria-label="Next Page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
