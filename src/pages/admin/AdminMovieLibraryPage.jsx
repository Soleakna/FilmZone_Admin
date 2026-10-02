import MovieModal from "../../components/admin/MovieModal";
import { useMovieLibraryData } from "./hooks/useMovieLibraryData";
import MovieLibraryHeader from "../../components/admin/movie-library/MovieLibraryHeader";
import MovieLibraryTabs from "../../components/admin/movie-library/MovieLibraryTabs";
import MovieLibraryFilters from "../../components/admin/movie-library/MovieLibraryFilters";
import MovieLibraryTable from "../../components/admin/movie-library/MovieLibraryTable";
import ApiMovieLibrary from "../../components/admin/movie-library/ApiMovieLibrary";
import ShowtimesManager from "../../components/admin/showtimes/ShowtimesManager";

export default function AdminMovieLibraryPage() {
  const {
    managedMovies,
    activePanelId,
    activeGroupTab,
    setActiveGroupTab,
    activeCatalogFilter,
    setActiveCatalogFilter,
    searchQuery,
    setSearchQuery,
    currentPage,
    setCurrentPage,
    selectedGenreId,
    setSelectedGenreId,
    selectedSortBy,
    setSelectedSortBy,
    trendingTimeWindow,
    setTrendingTimeWindow,
    isModalOpen,
    setIsModalOpen,
    editingMovie,
    activePanel,
    movieGenresList,
    tvGenresList,
    catalogTmdbIdSet,
    displayItems,
    totalPages,
    isLoading,
    isFetching,
    handleSelectPanel,
    formatGenres,
    handleOpenEdit,
    handleDelete,
    handleRestore100Movies,
    handleClearAll,
    handleQuickImportTmdb,
    handleCustomizeTmdbSchedule,
    handleSaveMovie,
    handlePageChange,
  } = useMovieLibraryData();

  return (
    <div className="space-y-8 font-sans">
      <MovieLibraryHeader
        activePanelId={activePanelId}
        managedMoviesCount={managedMovies.length}
        onRestore100={handleRestore100Movies}
        onClearAll={handleClearAll}
      />

      <MovieLibraryTabs
        activeGroupTab={activeGroupTab}
        setActiveGroupTab={setActiveGroupTab}
        activePanelId={activePanelId}
        onSelectPanel={handleSelectPanel}
      />

      {activePanelId === "CINEMA_API" ? (
        <ApiMovieLibrary />
      ) : activePanelId === "CINEMA_SHOWTIMES" ? (
        <ShowtimesManager />
      ) : (
        <>
      
          <MovieLibraryFilters
            activePanel={activePanel}
            activePanelId={activePanelId}
            activeCatalogFilter={activeCatalogFilter}
            setActiveCatalogFilter={setActiveCatalogFilter}
            trendingTimeWindow={trendingTimeWindow}
            setTrendingTimeWindow={setTrendingTimeWindow}
            selectedGenreId={selectedGenreId}
            setSelectedGenreId={setSelectedGenreId}
            selectedSortBy={selectedSortBy}
            setSelectedSortBy={setSelectedSortBy}
            movieGenresList={movieGenresList}
            tvGenresList={tvGenresList}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            setCurrentPage={setCurrentPage}
            isFetching={isFetching}
            itemCount={displayItems.length}
            currentPage={currentPage}
            totalPages={totalPages}
          />

          <MovieLibraryTable
            items={displayItems}
            isLoading={isLoading}
            activePanel={activePanel}
            activePanelId={activePanelId}
            catalogTmdbIdSet={catalogTmdbIdSet}
            formatGenres={formatGenres}
            onEdit={handleOpenEdit}
            onDelete={handleDelete}
            onQuickImport={handleQuickImportTmdb}
            onCustomizeSchedule={handleCustomizeTmdbSchedule}
            onRestore100={handleRestore100Movies}
            totalPages={totalPages}
            currentPage={currentPage}
            onPageChange={handlePageChange}
          />

          <MovieModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            onSave={handleSaveMovie}
            editingMovie={editingMovie}
          />
        </>
      )}
    </div>
  );
}
