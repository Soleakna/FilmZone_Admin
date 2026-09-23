import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

const TMDB_API_BASE =
  import.meta.env.VITE_API_BASE_URL || "https://api.themoviedb.org/3";
const TMDB_ACCESS_TOKEN = import.meta.env.VITE_TMDB_ACCESS_TOKEN;
const CINEMA_API_BASE =
  import.meta.env.VITE_CINEMA_API_BASE_URL ||
  "https://cinema-booking-api.eunglyzhia.com/api/v1";

/**
 * Route cinema backend endpoints (halls, auth, bookings, ...) to the
 * FilmZone Cinema Booking API. Everything else goes to TMDB.
 */
const isCinemaApiEndpoint = (url) => {
  if (typeof url !== "string") return false;
  return [
    "/auth",
    "/users",
    "/showtimes",
    "/halls",
    "/seats",
    "/bookings",
    "/concessions",
    "/tickets",
    "/payments",
    "/files",
    "/api/v1",
  ].some((prefix) => url.startsWith(prefix));
};

// Base query for TMDB (Movies & TV streaming)
const tmdbBaseQuery = fetchBaseQuery({
  baseUrl: TMDB_API_BASE,
  prepareHeaders: (headers) => {
    if (TMDB_ACCESS_TOKEN) {
      headers.set("Authorization", `Bearer ${TMDB_ACCESS_TOKEN}`);
    }
    headers.set("accept", "application/json");
    return headers;
  },
});

// Base query for the Cinema Booking API (halls, auth, bookings, ...)
const cinemaBaseQuery = fetchBaseQuery({
  baseUrl: CINEMA_API_BASE,
  prepareHeaders: (headers, { getState }) => {
    const userToken =
      getState()?.auth?.token || localStorage.getItem("cinema_token");
    if (userToken) {
      headers.set("Authorization", `Bearer ${userToken}`);
    }
    headers.set("accept", "application/json");
    return headers;
  },
});

const baseQueryWithRouting = async (args, api, extraOptions) => {
  const url = typeof args === "string" ? args : args?.url || "";

  if (!isCinemaApiEndpoint(url)) {
    return tmdbBaseQuery(args, api, extraOptions);
  }
  return cinemaBaseQuery(args, api, extraOptions);
};

export const baseApi = createApi({
  reducerPath: "api",
  baseQuery: baseQueryWithRouting,
  tagTypes: [
    "Movie",
    "TV",
    "Season",
    "Episode",
    "Showtime",
    "Booking",
    "Cinema",
    "Hall",
    "Seat",
    "Ticket",
    "Payment",
    "Concession",
    "Auth",
    "Favorite",
  ],
  endpoints: () => ({}),
});
