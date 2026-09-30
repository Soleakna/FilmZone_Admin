import { baseApi } from "./baseApi";

export const concessionApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getConcessions: builder.query({
      query: () => "/concessions",
      providesTags: (result) =>
        result
          ? [
              ...result.map((c) => ({ type: "Concession", id: c.uuid })),
              { type: "Concession", id: "LIST" },
            ]
          : [{ type: "Concession", id: "LIST" }],
    }),

    getConcession: builder.query({
      query: (uuid) => `/concessions/${uuid}`,
      providesTags: (result, error, uuid) => [{ type: "Concession", id: uuid }],
    }),

    createConcession: builder.mutation({
      query: (body) => ({
        url: "/concessions",
        method: "POST",
        body,
      }),
      invalidatesTags: [{ type: "Concession", id: "LIST" }],
    }),

    // API uses PATCH, not PUT, for updates.
    updateConcession: builder.mutation({
      query: ({ uuid, ...body }) => ({
        url: `/concessions/${uuid}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (result, error, { uuid }) => [
        { type: "Concession", id: uuid },
        { type: "Concession", id: "LIST" },
      ],
    }),

    // Shows/hides an item without deleting it.
    toggleConcessionStatus: builder.mutation({
      query: (uuid) => ({
        url: `/concessions/${uuid}/toggle-status`,
        method: "PATCH",
      }),
      invalidatesTags: (result, error, uuid) => [
        { type: "Concession", id: uuid },
        { type: "Concession", id: "LIST" },
      ],
    }),

    // Hard delete — the API's own "/permanent" path, cannot be undone.
    deleteConcession: builder.mutation({
      query: (uuid) => ({
        url: `/concessions/${uuid}/permanent`,
        method: "DELETE",
      }),
      invalidatesTags: [{ type: "Concession", id: "LIST" }],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetConcessionsQuery,
  useGetConcessionQuery,
  useCreateConcessionMutation,
  useUpdateConcessionMutation,
  useToggleConcessionStatusMutation,
  useDeleteConcessionMutation,
} = concessionApi;