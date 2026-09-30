import { Search, RefreshCw } from "lucide-react";

export default function MovieLibraryFilters({
  activePanel,
  activePanelId,
  activeCatalogFilter,
  setActiveCatalogFilter,
  trendingTimeWindow,
  setTrendingTimeWindow,
  selectedGenreId,
  setSelectedGenreId,
  selectedSortBy,
  setSelectedSortBy,
  movieGenresList,
  tvGenresList,
  searchQuery,
  setSearchQuery,
  setCurrentPage,
  isFetching,
  itemCount,
  currentPage,
  totalPages,
}) {
  const Icon = activePanel.icon;
  const isMovieGroup = activePanel.mediaType === "movie";

  return (
    <div className="bg-white rounded-3xl p-6 border border-neutral-200/80 shadow-xs space-y-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Banner Details */}
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-[#b90101]/10 text-[#b90101]">
              <Icon className="w-4 h-4" />
            </span>
            <h2 className="text-lg sm:text-xl font-black text-neutral-900">
              {activePanel.label}
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-neutral-100 text-neutral-600 border border-neutral-200">
              {/* {activePanel.endpoint} */}
            </span>
          </div>
          <p className="text-xs text-neutral-500 font-medium">
            {activePanel.description}
          </p>
        </div>

        {/* Sub-Filters */}
        <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
          {/* Catalog Sub-Filter (Live vs Upcoming) */}
          {activePanelId === "MANAGED" && (
            <div className="flex items-center gap-1 p-1 bg-neutral-100 rounded-full border border-neutral-200 text-xs font-bold">
              {["ALL", "LIVE", "UPCOMING"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => {
                    setActiveCatalogFilter(tab);
                    setCurrentPage(1);
                  }}
                  className={`px-3.5 py-1.5 rounded-full uppercase transition cursor-pointer ${
                    activeCatalogFilter === tab
                      ? "bg-[#b90101] text-white shadow-xs"
                      : "text-neutral-600 hover:text-black"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          )}

          {/* Trending Time Window Selector */}
          {(activePanelId === "TMDB_TRENDING_MOVIES" ||
            activePanelId === "TMDB_TRENDING_TV") && (
            <div className="flex items-center gap-1 p-1 bg-neutral-100 rounded-full border border-neutral-200 text-xs font-bold">
              <button
                onClick={() => setTrendingTimeWindow("day")}
                className={`px-3.5 py-1.5 rounded-full transition cursor-pointer ${
                  trendingTimeWindow === "day"
                    ? "bg-[#b90101] text-white shadow-xs"
                    : "text-neutral-600 hover:text-black"
                }`}
              >
                Today
              </button>
              <button
                onClick={() => setTrendingTimeWindow("week")}
                className={`px-3.5 py-1.5 rounded-full transition cursor-pointer ${
                  trendingTimeWindow === "week"
                    ? "bg-[#b90101] text-white shadow-xs"
                    : "text-neutral-600 hover:text-black"
                }`}
              >
                This Week
              </button>
            </div>
          )}

          {/* Discover Genre & Sort Dropdowns */}
          {(activePanelId === "TMDB_DISCOVER_MOVIES" ||
            activePanelId === "TMDB_DISCOVER_TV") && (
            <div className="flex items-center gap-2">
              <select
                value={selectedGenreId}
                onChange={(e) => {
                  setSelectedGenreId(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-3 py-1.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-bold text-neutral-800 focus:outline-none focus:border-[#b90101]"
              >
                <option value="">All Genres</option>
                {(isMovieGroup ? movieGenresList : tvGenresList).map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>

              <select
                value={selectedSortBy}
                onChange={(e) => {
                  setSelectedSortBy(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-3 py-1.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-bold text-neutral-800 focus:outline-none focus:border-[#b90101]"
              >
                <option value="popularity.desc">Most Popular</option>
                <option value="vote_average.desc">Highest Rating</option>
                <option value="primary_release_date.desc">
                  Newest Release
                </option>
                <option value="revenue.desc">Top Box Office</option>
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 border-t border-neutral-100">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder={
              activePanelId === "MANAGED"
                ? "Search in Cinema catalog..."
                : `Search TMDB cloud ${isMovieGroup ? "movies" : "TV shows"}...`
            }
            className="w-full pl-10 pr-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-full text-xs font-semibold text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-[#b90101] shadow-xs"
          />
        </div>

        <div className="flex items-center gap-3 text-xs font-bold text-neutral-500 self-end sm:self-auto">
          {isFetching && (
            <span className="flex items-center gap-1.5 text-[#b90101]">
              <RefreshCw className="w-3 h-3 animate-spin" />
              <span>Syncing TMDB...</span>
            </span>
          )}
          <span>
            Showing {itemCount} items (Page {currentPage} of {totalPages})
          </span>
        </div>
      </div>
    </div>
  );
}
