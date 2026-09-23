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

export const hallApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // 1. GET /halls — list all halls
    getHalls: builder.query({
      query: () => "/halls",
      transformResponse: unwrapList,
      providesTags: ["Hall"],
    }),

    // 2. GET /halls/:id — single hall
    getHallById: builder.query({
      query: (id) => `/halls/${id}`,
      transformResponse: unwrapSingle,
      providesTags: (result, error, id) => [{ type: "Hall", id }],
    }),

    // 3. POST /halls — create a hall
    createHall: builder.mutation({
      query: (hallData) => ({
        url: "/halls",
        method: "POST",
        body: hallData,
      }),
      invalidatesTags: ["Hall"],
    }),

    // 4. PUT /halls/:id — update a hall
    updateHall: builder.mutation({
      query: ({ id, ...hallData }) => ({
        url: `/halls/${id}`,
        method: "PUT",
        body: hallData,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "Hall", id },
        "Hall",
      ],
    }),

    // 5. DELETE /halls/:id — remove a hall
    deleteHall: builder.mutation({
      query: (id) => ({
        url: `/halls/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Hall"],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetHallsQuery,
  useGetHallByIdQuery,
  useCreateHallMutation,
  useUpdateHallMutation,
  useDeleteHallMutation,
} = hallApi;