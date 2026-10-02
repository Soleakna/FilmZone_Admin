import { baseApi } from "./baseApi";

export const tvApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // 1. Trending TV Series 
    getTrendingTV: builder.query({
      query: (timeWindow = "day") => `/trending/tv/${timeWindow}`,
      transformResponse: (response) => response?.results || response,
      providesTags: [{ type: "TV", id: "TRENDING_TV" }],
    }),

    // 2. Popular TV Series 
    getPopularTV: builder.query({
      query: (page = 1) => `/tv/popular?page=${page}`,
      transformResponse: (response) => response?.results || response,
      providesTags: (result) =>
        result && Array.isArray(result)
          ? [
              ...result.map(({ id }) => ({ type: "TV", id })),
              { type: "TV", id: "POPULAR_TV" },
            ]
          : [{ type: "TV", id: "POPULAR_TV" }],
    }),

    // 3. Top Rated TV Series 
    getTopRatedTV: builder.query({
      query: (page = 1) => `/tv/top_rated?page=${page}`,
      transformResponse: (response) => response?.results || response,
      providesTags: [{ type: "TV", id: "TOP_RATED_TV" }],
    }),

    // 4. On The Air TV Series 
    getOnTheAirTV: builder.query({
      query: (page = 1) => `/tv/on_the_air?page=${page}`,
      transformResponse: (response) => response?.results || response,
      providesTags: [{ type: "TV", id: "ON_THE_AIR" }],
    }),

    // 5. Discover TV Series 
    discoverTV: builder.query({
      query: (params = {}) => {
        const queryParams = new URLSearchParams();
        if (params.page) queryParams.append("page", params.page);
        if (params.with_genres)
          queryParams.append("with_genres", params.with_genres);
        if (params.sort_by) {
          queryParams.append("sort_by", params.sort_by);
          if (params.sort_by.startsWith("vote_average")) {
            queryParams.append("vote_count.gte", "100");
          }
        }
        if (params.first_air_date_year)
          queryParams.append("first_air_date_year", params.first_air_date_year);
        const queryStr = queryParams.toString();
        return `/discover/tv${queryStr ? `?${queryStr}` : ""}`;
      },
      transformResponse: (response) => ({
        results: response?.results || [],
        total_pages: Math.min(response?.total_pages || 1, 500),
        total_results: response?.total_results || 0,
      }),
      providesTags: [{ type: "TV", id: "DISCOVER_TV" }],
    }),

    // 6. TV Series Details 
    getTVDetails: builder.query({
      query: (tvId) =>
        `/tv/${tvId}?append_to_response=videos,credits,similar,aggregate_credits`,
      providesTags: (result, error, tvId) => [{ type: "TV", id: tvId }],
    }),

    // 7. TV Season Details
    getTVSeasonDetails: builder.query({
      query: ({ tvId, seasonNumber }) =>
        `/tv/${tvId}/season/${seasonNumber}?append_to_response=videos,credits`,
      providesTags: (result, error, { tvId, seasonNumber }) => [
        { type: "Season", id: `${tvId}-S${seasonNumber}` },
      ],
    }),

    // 8. TV Episode Details 
    getTVEpisodeDetails: builder.query({
      query: ({ tvId, seasonNumber, episodeNumber }) =>
        `/tv/${tvId}/season/${seasonNumber}/episode/${episodeNumber}?append_to_response=videos,credits,images`,
      providesTags: (result, error, { tvId, seasonNumber, episodeNumber }) => [
        { type: "Episode", id: `${tvId}-S${seasonNumber}-E${episodeNumber}` },
      ],
    }),

    // 9. TV Episode Videos 
    getTVEpisodeVideos: builder.query({
      query: ({ tvId, seasonNumber, episodeNumber }) =>
        `/tv/${tvId}/season/${seasonNumber}/episode/${episodeNumber}/videos`,
      transformResponse: (response) => response?.results || [],
    }),

    // 10. TV Genres
    getTVGenres: builder.query({
      query: () => "/genre/tv/list",
      transformResponse: (response) => response?.genres || [],
    }),

    // 11. Search TV Series 
    searchTV: builder.query({
      query: ({ query, page = 1 }) =>
        `/search/tv?query=${encodeURIComponent(query)}&page=${page}`,
      transformResponse: (response) => ({
        results: response?.results || [],
        total_pages: Math.min(response?.total_pages || 1, 500),
        total_results: response?.total_results || 0,
      }),
    }),

    // 12. TV Series Videos & Trailers 
    getTVTrailers: builder.query({
      query: (tvId) => `/tv/${tvId}/videos`,
      transformResponse: (response) => response?.results || [],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetTrendingTVQuery,
  useGetPopularTVQuery,
  useGetTopRatedTVQuery,
  useGetOnTheAirTVQuery,
  useDiscoverTVQuery,
  useGetTVDetailsQuery,
  useGetTVSeasonDetailsQuery,
  useGetTVEpisodeDetailsQuery,
  useGetTVEpisodeVideosQuery,
  useGetTVTrailersQuery,
  useGetTVGenresQuery,
  useSearchTVQuery,
  useLazySearchTVQuery,
} = tvApi;
