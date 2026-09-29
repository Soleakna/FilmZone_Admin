import { baseApi } from "./baseApi";

/**
 * @typedef {Object} CinemaMovie
 * @property {string} uuid
 * @property {number} tmdbId
 * @property {string} title
 * @property {string | null} originalTitle
 * @property {string | null} overview
 * @property {string | null} posterUrl
 * @property {string | null} backdropUrl
 * @property {number | null} runtimeMinutes
 * @property {string | null} releaseDate  // "YYYY-MM-DD"
 * @property {string | null} ageRating
 * @property {string | null} language
 * @property {"ACTIVE"|"INACTIVE"|"COMING_SOON"|"ARCHIVED"} status
 * @property {string} createdAt
 * @property {string} updatedAt
 */

/**
 * @typedef {Object} CinemaMoviePage
 * @property {CinemaMovie[]} content
 * @property {number} page   // 0-based
 * @property {number} size
 * @property {number} totalElements
 * @property {number} totalPages
 * @property {boolean} first
 * @property {boolean} last
 */

/**
 * @typedef {Object} TmdbMovieSearchItem
 * @property {number} id
 * @property {string} title
 * @property {string} original_title
 * @property {string} overview
 * @property {string} poster_path
 * @property {string} backdrop_path
 * @property {string} release_date
 * @property {string} original_language
 */

/**
 * @typedef {Object} TmdbSearchResponse
 * @property {number} page
 * @property {TmdbMovieSearchItem[]} results
 * @property {number} total_pages
 * @property {number} total_results
 */

// Unwrap the common `{ data: ... }` JSON envelope used by the Cinema API.
const unwrapEnvelope = (response) => {
  if (response === undefined || response === null) return response;
  if (response.data !== undefined) return response.data;
  return response;
};

export const movieApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // 1. Upcoming Movies (/movie/upcoming)
    getUpcomingMovies: builder.query({
      query: (page = 1) => `/movie/upcoming?page=${page}`,
      transformResponse: (response) => response?.results || response,
      providesTags: (result) =>
        result && Array.isArray(result)
          ? [
              ...result.map(({ id }) => ({ type: "Movie", id })),
              { type: "Movie", id: "UPCOMING" },
            ]
          : [{ type: "Movie", id: "UPCOMING" }],
    }),

    // 2. Trending Movies (/trending/movie/{time_window})
    getTrendingMovies: builder.query({
      query: (timeWindow = "day") => `/trending/movie/${timeWindow}`,
      transformResponse: (response) => response?.results || response,
      providesTags: [{ type: "Movie", id: "TRENDING" }],
    }),

    // 3. All Trending (Movies + TV + People)
    getAllTrending: builder.query({
      query: (timeWindow = "day") => `/trending/all/${timeWindow}`,
      transformResponse: (response) => response?.results || response,
      providesTags: [{ type: "Movie", id: "ALL_TRENDING" }],
    }),

    // 4. Now Playing Movies (Currently in Cinemas)
    getNowPlayingMovies: builder.query({
      query: (page = 1) => `/movie/now_playing?page=${page}`,
      transformResponse: (response) => response?.results || response,
      providesTags: (result) =>
        result && Array.isArray(result)
          ? [
              ...result.map(({ id }) => ({ type: "Movie", id })),
              { type: "Movie", id: "NOW_PLAYING" },
            ]
          : [{ type: "Movie", id: "NOW_PLAYING" }],
    }),

    // 5. Popular Movies (/movie/popular)
    getPopularMovies: builder.query({
      query: (page = 1) => `/movie/popular?page=${page}`,
      transformResponse: (response) => response?.results || response,
      providesTags: [{ type: "Movie", id: "POPULAR" }],
    }),

    // 6. Top Rated Movies (/movie/top_rated)
    getTopRatedMovies: builder.query({
      query: (page = 1) => `/movie/top_rated?page=${page}`,
      transformResponse: (response) => response?.results || response,
      providesTags: [{ type: "Movie", id: "TOP_RATED" }],
    }),

    // 7. Discover All Movies
    discoverMovies: builder.query({
      query: (params = {}) => {
        const queryParams = new URLSearchParams();
        if (params.page) queryParams.append("page", params.page);
        if (params.with_genres)
          queryParams.append("with_genres", params.with_genres);
        if (params.sort_by) {
          queryParams.append("sort_by", params.sort_by);
          if (params.sort_by.startsWith("vote_average")) {
            queryParams.append("vote_count.gte", "200");
          }
        }
        if (params.primary_release_year)
          queryParams.append(
            "primary_release_year",
            params.primary_release_year,
          );
        const queryStr = queryParams.toString();
        return `/discover/movie${queryStr ? `?${queryStr}` : ""}`;
      },
      transformResponse: (response) => ({
        results: response?.results || [],
        total_pages: Math.min(response?.total_pages || 1, 500),
        total_results: response?.total_results || 0,
      }),
      providesTags: [{ type: "Movie", id: "DISCOVER" }],
    }),

    // 8. Movie Details (with videos, credits & similar movies appended)
    getMovieDetails: builder.query({
      query: (id) =>
        `/movie/${id}?append_to_response=videos,credits,similar,images`,
      providesTags: (result, error, id) => [{ type: "Movie", id }],
    }),

    // 9. Movie Videos & Trailers (/movie/{id}/videos)
    getMovieTrailers: builder.query({
      query: (id) => `/movie/${id}/videos`,
      transformResponse: (response) => response?.results || [],
    }),

    // 10. Movie Credits & Cast (/movie/{id}/credits)
    getMovieCredits: builder.query({
      query: (id) => `/movie/${id}/credits`,
    }),

    // 11. Movie Genres List (/genre/movie/list)
    getMovieGenres: builder.query({
      query: () => "/genre/movie/list",
      transformResponse: (response) => response?.genres || [],
    }),

    // 12. Search Movies (/search/movie)
    searchMovies: builder.query({
      query: ({ query, page = 1 }) =>
        `/search/movie?query=${encodeURIComponent(query)}&page=${page}`,
      transformResponse: (response) => ({
        results: response?.results || [],
        total_pages: Math.min(response?.total_pages || 1, 500),
        total_results: response?.total_results || 0,
      }),
    }),

    // 13. Search Multi (Movies, TV Series, People)
    searchMulti: builder.query({
      query: ({ query, page = 1 }) =>
        `/search/multi?query=${encodeURIComponent(query)}&page=${page}`,
      transformResponse: (response) => response?.results || [],
    }),

    // 14. Lightweight Movie Runtime Query (/movie/{id})
    getMovieRuntime: builder.query({
      query: (id) => `/movie/${id}`,
      transformResponse: (response) => response?.runtime || null,
      providesTags: (result, error, id) => [
        { type: "Movie", id: `runtime-${id}` },
      ],
    }),

    // ---------------------------------------------------------------------
    // Cinema Booking API — Movie management (routed via "/movies" prefix).
    // Creation is TMDB-import based: POST /movies/import/{tmdbId} (no body).
    // ---------------------------------------------------------------------

    // 15. GET /movies?page&size&sortBy&direction — paginated movie list
    getMovies: builder.query({
      query: ({
        page = 0,
        size = 10,
        sortBy = "createdAt",
        direction = "desc",
      } = {}) =>
        `/movies?page=${page}&size=${size}&sortBy=${sortBy}&direction=${direction}`,
      providesTags: () => [{ type: "Movie", id: "CINEMA_LIST" }],
    }),

    // 16. GET /movies/{uuid} — one movie's details
    getMovieByUuid: builder.query({
      query: (uuid) => `/movies/${uuid}`,
      transformResponse: unwrapEnvelope,
      providesTags: (result, error, uuid) => [
        { type: "Movie", id: `cinema-${uuid}` },
      ],
    }),

    // 17. POST /movies/import/{tmdbId} — create a movie by importing from TMDB
    importMovie: builder.mutation({
      query: (tmdbId) => ({
        url: `/movies/import/${tmdbId}`,
        method: "POST",
      }),
      transformResponse: unwrapEnvelope,
      invalidatesTags: [{ type: "Movie", id: "CINEMA_LIST" }],
    }),

    // 18. PATCH /movies/{uuid}/status — update a movie's status
    updateMovieStatus: builder.mutation({
      query: ({ uuid, status }) => ({
        url: `/movies/${uuid}/status`,
        method: "PATCH",
        body: { status },
      }),
      transformResponse: unwrapEnvelope,
      invalidatesTags: (result, error, { uuid }) => [
        { type: "Movie", id: "CINEMA_LIST" },
        { type: "Movie", id: `cinema-${uuid}` },
      ],
    }),

    // 19. DELETE /movies/{uuid} — delete a movie
    deleteMovie: builder.mutation({
      query: (uuid) => ({
        url: `/movies/${uuid}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, uuid) => [
        { type: "Movie", id: "CINEMA_LIST" },
        { type: "Movie", id: `cinema-${uuid}` },
      ],
    }),

    // 20. GET /movies/search?query=... — TMDB movie search (proxied)
    searchTMDBMovies: builder.query({
      query: (query) => `/movies/search?query=${encodeURIComponent(query.trim())}`,
      transformResponse: unwrapEnvelope,
      providesTags: [{ type: "Movie", id: "TMDB_MOVIE_SEARCH" }],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetUpcomingMoviesQuery,
  useGetTrendingMoviesQuery,
  useGetAllTrendingQuery,
  useGetNowPlayingMoviesQuery,
  useGetPopularMoviesQuery,
  useGetTopRatedMoviesQuery,
  useDiscoverMoviesQuery,
  useGetMovieDetailsQuery,
  useGetMovieRuntimeQuery,
  useGetMovieTrailersQuery,
  useGetMovieCreditsQuery,
  useGetMovieGenresQuery,
  useSearchMoviesQuery,
  useLazySearchMoviesQuery,
  useSearchMultiQuery,
  useLazySearchMultiQuery,
  useGetMoviesQuery,
  useGetMovieByUuidQuery,
  useImportMovieMutation,
  useUpdateMovieStatusMutation,
  useDeleteMovieMutation,
  useSearchTMDBMoviesQuery,
} = movieApi;
