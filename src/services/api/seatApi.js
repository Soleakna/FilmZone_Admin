import { baseApi } from "./baseApi";

/**
 * Unwrap the common JSON envelopes returned by the Cinema Booking API.
 * Handles: raw array, { data: [...] }, { data: { items/results: [...] } }, etc.
 */
const unwrapList = (response) => {
  if (!response) return [];
  if (Array.isArray(response)) return response;
  if (Array.isArray(response.data)) return response.data;

  const nested =
    response.data?.items ??
    response.data?.results ??
    response.items ??
    response.results;
  return Array.isArray(nested) ? nested : [];
};

const unwrapSingle = (response) => {
  if (response === undefined || response === null) return response;
  if (response.data !== undefined) return response.data;
  return response;
};

export const seatApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // 1. GET /halls/:hallUuid/seats — list all seats in a hall
    getSeatsByHall: builder.query({
      query: (hallUuid) => `/halls/${hallUuid}/seats`,
      transformResponse: unwrapList,
      providesTags: (result, error, hallUuid) => [
        { type: "Seat", hallUuid },
      ],
    }),

    // 1b. GET /seats/:uuid — fetch one seat's details
    getSeatByUuid: builder.query({
      query: (uuid) => `/seats/${uuid}`,
      transformResponse: unwrapSingle,
      providesTags: (result, error, uuid) => [
        { type: "Seat", seatUuid: uuid },
      ],
    }),

    // 2. POST /halls/:hallUuid/seats — create a seat in a hall
    createSeat: builder.mutation({
      query: ({ hallUuid, ...seatData }) => ({
        url: `/halls/${hallUuid}/seats`,
        method: "POST",
        body: seatData,
      }),
      transformResponse: unwrapSingle,
      invalidatesTags: (result, error, { hallUuid }) => [
        { type: "Seat", hallUuid },
        "Seat",
      ],
    }),

    // 3. POST /halls/:hallUuid/seats/couple — create a couple seat pair
    createCoupleSeat: builder.mutation({
      query: ({ hallUuid, ...seatData }) => ({
        url: `/halls/${hallUuid}/seats/couple`,
        method: "POST",
        body: seatData,
      }),
      transformResponse: unwrapSingle,
      invalidatesTags: (result, error, { hallUuid }) => [
        { type: "Seat", hallUuid },
        "Seat",
      ],
    }),

    // 4. DELETE /halls/:hallUuid/seats — remove every seat in a hall.
    // Required before deleting a hall: the database blocks deleting a hall
    // that still has seats referencing it (foreign-key constraint), which
    // surfaces as a 500 error from the API otherwise.
    deleteAllSeats: builder.mutation({
      query: (hallUuid) => ({
        url: `/halls/${hallUuid}/seats`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, hallUuid) => [
        { type: "Seat", hallUuid },
        "Seat",
      ],
    }),

    // 5. POST /halls/:hallUuid/seats/bulk — create many seats at once.
    // Body: { rows: [{ rowLabel, startSeatNumber, numberOfSeats, seatType }] }
    // Response: array of the created seats.
    createBulkSeats: builder.mutation({
      query: ({ hallUuid, rows }) => ({
        url: `/halls/${hallUuid}/seats/bulk`,
        method: "POST",
        body: { rows },
      }),
      transformResponse: (response) => {
        if (Array.isArray(response)) return response;
        if (Array.isArray(response?.data)) return response.data;
        if (Array.isArray(response?.rows)) return response.rows;
        return [];
      },
      invalidatesTags: (result, error, { hallUuid }) => [
        { type: "Seat", hallUuid },
        "Seat",
      ],
    }),
  // 6. PATCH /seats/:uuid/status — change a seat's status.
    // Body: UpdateSeatStatusRequest { status: "ACTIVE" | "INACTIVE" | ... }.
    updateSeatStatus: builder.mutation({
      query: ({ uuid, status }) => ({
        url: `/seats/${uuid}/status`,
        method: "PATCH",
        body: { status },
      }),
      invalidatesTags: (result, error, { hallUuid }) => [
        { type: "Seat", hallUuid },
        "Seat",
      ],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetSeatsByHallQuery,
  useGetSeatByUuidQuery,
  useCreateSeatMutation,
  useCreateCoupleSeatMutation,
  useCreateBulkSeatsMutation,
  useUpdateSeatStatusMutation,
  useDeleteAllSeatsMutation,
} = seatApi;