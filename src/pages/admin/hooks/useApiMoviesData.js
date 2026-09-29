import { useState } from "react";
import { toast } from "react-toastify";
import {
  useGetMoviesQuery,
  useGetMovieByUuidQuery,
  useImportMovieMutation,
  useUpdateMovieStatusMutation,
  useDeleteMovieMutation,
  useSearchTMDBMoviesQuery,
} from "../../../services/api/movieApi";

const PAGE_SIZE = 10;

// Status values supported by the Cinema Booking API (MovieResponse.status).
export const MOVIE_STATUSES = ["ACTIVE", "COMING_SOON", "INACTIVE", "ARCHIVED"];

const extractErrorMessage = (err) => {
  if (err?.status === 401 || err?.status === 403) {
    return "Unauthorized — your session token was rejected. Log out and log in again, then retry.";
  }

  const data = err?.data;
  const message =
    typeof data === "string"
      ? data
      : data?.message ||
        data?.error ||
        data?.detail ||
        err?.error ||
        "Request failed. Check the Network tab for details.";

  const rawBody =
    err?.status >= 500 && data
      ? ` — ${typeof data === "string" ? data : JSON.stringify(data)}`
      : "";

  return err?.status
    ? `Request failed (HTTP ${err.status}): ${message}${rawBody}`
    : message;
};

const getMovieUuid = (movie) =>
  movie?.uuid ?? movie?.id ?? movie?._id ?? movie?.movieUuid ?? movie?.movieId;

export function useApiMoviesData() {
  // ---- Pagination (page is 0-based in this API) ----
  const [currentPage, setCurrentPage] = useState(0);

  // ---- Movie details modal (GET /movies/{uuid}) ----
  const [selectedMovieUuid, setSelectedMovieUuid] = useState(null);

  // ---- TMDB search in the import modal ----
  const [searchQuery, setSearchQuery] = useState("");

  const {
    data: moviesPage,
    isLoading: isMoviesLoading,
    isFetching: isMoviesFetching,
    isError: isMoviesError,
    error: moviesError,
    refetch: refetchMovies,
  } = useGetMoviesQuery({ page: currentPage, size: PAGE_SIZE });

  const {
    data: movieDetails,
    isLoading: isDetailsLoading,
    isError: isDetailsError,
    error: detailsError,
    refetch: refetchDetails,
  } = useGetMovieByUuidQuery(selectedMovieUuid, {
    skip: !selectedMovieUuid,
  });

  const trimmedSearch = searchQuery.trim();
  const {
    data: tmdbSearch,
    isLoading: isSearchLoading,
    isError: isSearchError,
    error: searchError,
    refetch: refetchSearch,
  } = useSearchTMDBMoviesQuery(trimmedSearch, {
    skip: trimmedSearch.length < 2,
  });

  const [importMovie, { isLoading: isCreating }] = useImportMovieMutation();
  const [updateMovieStatus, { isLoading: isUpdatingStatus }] =
    useUpdateMovieStatusMutation();
  const [deleteCinemaMovie, { isLoading: isDeleting }] =
    useDeleteMovieMutation();

  // ---- Derived list state ----
  const movies =
    Array.isArray(moviesPage?.content)
      ? moviesPage.content
      : Array.isArray(moviesPage)
        ? moviesPage
        : [];
  const totalElements = moviesPage?.totalElements ?? movies.length;
  const totalPages = Math.max(moviesPage?.totalPages ?? 1, 1);
  const firstPage = moviesPage?.first ?? currentPage === 0;
  const lastPage = moviesPage?.last ?? currentPage >= totalPages - 1;

  // ---- Handlers ----

  // POST /movies/import/{tmdbId} — creates the movie from TMDB data.
  const handleImportMovie = async (tmdbId, title) => {
    if (!tmdbId) {
      toast.error("Cannot import: the movie has no TMDB ID.");
      return false;
    }
    try {
      await importMovie(tmdbId).unwrap();
      toast.success(`"${title || "Movie"}" imported into Cinema Movies.`);
      return true;
    } catch (err) {
      console.error("Import movie error:", err);
      toast.error(extractErrorMessage(err));
      return false;
    }
  };

  // PATCH /movies/{uuid}/status
  const handleUpdateStatus = async (movie, status) => {
    const uuid = getMovieUuid(movie);
    if (!uuid) {
      toast.error("Cannot update: movie response has no UUID.");
      return false;
    }
    const title = movie?.title || `Movie #${uuid}`;
    try {
      await updateMovieStatus({ uuid, status }).unwrap();
      toast.success(
        `"${title}" status is now ${
          status === "ACTIVE"
            ? "ACTIVE"
            : status === "COMING_SOON"
              ? "COMING SOON"
              : status === "INACTIVE"
                ? "INACTIVE"
                : "ARCHIVED"
        }.`,
      );
      return true;
    } catch (err) {
      console.error("Update movie status error:", err);
      if (err?.status === 404) {
        toast.warn(
          `"${title}" no longer exists on the server. Refreshing the list…`,
        );
        refetchMovies();
      } else {
        toast.error(extractErrorMessage(err));
      }
      return false;
    }
  };

  // DELETE /movies/{uuid}
  const handleDeleteMovie = async (movie) => {
    const uuid = getMovieUuid(movie);
    if (!uuid) {
      toast.error("Cannot delete: movie response has no UUID.");
      return false;
    }
    const title = movie?.title || `Movie #${uuid}`;
    try {
      await deleteCinemaMovie(uuid).unwrap();
      toast.success(`"${title}" deleted.`);
      return true;
    } catch (err) {
      console.error("Delete movie error:", err);
      if (err?.status === 404) {
        toast.warn(
          `"${title}" no longer exists on the server. Refreshing the list…`,
        );
        refetchMovies();
      } else {
        toast.error(extractErrorMessage(err));
      }
      return false;
    }
  };

  const handlePageChange = (page) => {
    if (page >= 0 && page < totalPages) {
      setCurrentPage(page);
    }
  };

  const openMovieDetails = (uuid) => setSelectedMovieUuid(uuid);
  const closeMovieDetails = () => setSelectedMovieUuid(null);

  return {
    // list
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
    // details
    selectedMovieUuid,
    movieDetails,
    isDetailsLoading,
    isDetailsError,
    detailsError,
    refetchDetails,
    openMovieDetails,
    closeMovieDetails,
    // search
    searchQuery,
    setSearchQuery,
    tmdbSearch,
    isSearchLoading,
    isSearchError,
    searchError,
    refetchSearch,
    // mutations
    isCreating,
    handleImportMovie,
    isUpdatingStatus,
    handleUpdateStatus,
    isDeleting,
    handleDeleteMovie,
    handlePageChange,
  };
}