import { baseApi } from "./baseApi";

/**
 * @typedef {Object} Showtime
 * @property {string} uuid
 * @property {string} movieUuid
 * @property {string} movieTitle
 * @property {string} hallUuid
 * @property {string} hallName
 * @property {string} startTime  // ISO date-time
 * @property {string} endTime    // ISO date-time
 * @property {number} basePrice
 * @property {"DRAFT"|"OPEN"|"CLOSED"|"CANCELLED"|"COMPLETED"} status
 * @property {string} createdAt
 * @property {string} updatedAt
 */

/**
 * @typedef {Object} CreateShowtimeRequest
 * @property {string} movieUuid
 * @property {string} hallUuid
 * @property {string} showDate  // "YYYY-MM-DD"
 * @property {string} showTime  // time-local, e.g. "14:30"
 * @property {number} basePrice // >= 0.01
 * @property {"DRAFT"|"OPEN"|"CLOSED"|"CANCELLED"|"COMPLETED"} status // defaults to "DRAFT"
 */

/**
 * @typedef {Object} ShowtimeSeat
 * @property {string} seatUuid
 * @property {string} groupUuid
 * @property {string} rowLabel
 * @property {number} seatNumber
 * @property {string} seatLabel
 * @property {"STANDARD"|"ACCESSIBLE"} seatType
 * @property {"AVAILABLE"|"HELD"|"BOOKED"|"UNAVAILABLE"} availability
 */

const unwrapList = (response) => {
  if (!response) return [];
  if (Array.isArray(response)) return response;
  if (Array.isArray(response.data)) return response.data;
  const nested = response.data?.items ?? response.data?.results ?? null;
  return Array.isArray(nested) ? nested : [];
};

const unwrapSingle = (response) => {
  if (response === undefined || response === null) return response;
  if (response.data !== undefined) return response.data;
  return response;
};

export const showtimeApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // 1. GET /showtimes — list all showtimes
    getShowtimes: builder.query({
      query: () => "/showtimes",
      transformResponse: unwrapList,
      providesTags: [{ type: "Showtime", id: "LIST" }],
    }),

    // 2. POST /showtimes — create a showtime
    createShowtime: builder.mutation({
      query: (body) => ({
        url: "/showtimes",
        method: "POST",
        body,
      }),
      transformResponse: unwrapSingle,
      invalidatesTags: [{ type: "Showtime", id: "LIST" }],
    }),

    // 3. GET /showtimes/{uuid} — one showtime's details
    getShowtimeByUuid: builder.query({
      query: (uuid) => `/showtimes/${uuid}`,
      transformResponse: unwrapSingle,
      providesTags: (result, error, uuid) => [{ type: "Showtime", id: uuid }],
    }),

    // 4. GET /showtimes/{uuid}/seats — seat availability for a showtime
    getShowtimeSeats: builder.query({
      query: (uuid) => `/showtimes/${uuid}/seats`,
      transformResponse: unwrapList,
      providesTags: (result, error, uuid) => [
        { type: "Showtime", id: `seats-${uuid}` },
      ],
    }),

    // 5. PATCH /showtimes/{uuid}/status — publish / change a showtime's status.
    // NOTE: the backend PATCH /showtimes endpoint is NOT exposed yet on the
    // deployed API (v3/api-docs only lists GET/POST /showtimes). It mirrors the
    // /halls/{uuid}/status, /movies/{uuid}/status, /seats/{uuid}/status
    // pattern and is ready to use the moment the backend team ships it.
    updateShowtimeStatus: builder.mutation({
      query: ({ uuid, status }) => ({
        url: `/showtimes/${uuid}/status`,
        method: "PATCH",
        body: { status },
      }),
      transformResponse: unwrapSingle,
      invalidatesTags: (result, error, { uuid }) => [
        { type: "Showtime", id: "LIST" },
        { type: "Showtime", id: uuid },
      ],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetShowtimesQuery,
  useCreateShowtimeMutation,
  useGetShowtimeByUuidQuery,
  useGetShowtimeSeatsQuery,
  useUpdateShowtimeStatusMutation,
} = showtimeApi;