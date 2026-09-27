import { Plus, RefreshCw, Eraser } from "lucide-react";

export default function MovieLibraryHeader({
  activePanelId,
  managedMoviesCount,
  onRestore100,
  onClearAll,
  onAddCustom,
}) {
  return (
    <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
      <div>
        <div className="relative inline-block pb-2">
          <h1 className="text-3xl sm:text-4xl font-black text-[#b90101] tracking-tight">
            Movie Library & TMDB Hub
          </h1>
          <div className="absolute bottom-0 left-0 w-36 h-1 bg-[#b90101] rounded-full" />
        </div>
        <p className="text-xs sm:text-sm text-neutral-500 font-semibold mt-2">
          Explore and import all TMDB endpoints live (Upcoming, Trending,
          Popular, Top Rated & TV Shows) into your Cinema Schedule.
        </p>
      </div>

      {/* Action Controls */}
      <div className="flex flex-wrap items-center justify-end gap-2.5">
        {activePanelId === "MANAGED" && (
          <>
            <button
              onClick={onRestore100}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-white border border-neutral-300 hover:border-[#b90101] text-neutral-700 hover:text-[#b90101] font-bold text-xs shadow-xs transition cursor-pointer"
              title="Load 100 Offline TMDB Blockbuster Movies backup"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Restore 100 Backup</span>
            </button>

            {managedMoviesCount > 0 && (
              <button
                onClick={onClearAll}
                className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-full bg-white border border-neutral-300 hover:border-red-600 text-neutral-600 hover:text-red-600 font-bold text-xs shadow-xs transition cursor-pointer"
                title="Clear all active movies"
              >
                <Eraser className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Reset</span>
              </button>
            )}
          </>
        )}

        <button
          onClick={onAddCustom}
          className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#b90101] hover:brightness-110 text-white font-extrabold text-xs uppercase tracking-wider shadow-md transition active:scale-95 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>+ Add Custom Movie</span>
        </button>
      </div>
    </div>
  );
}
