// src/services/api/userApi.js
//
// Injects user-management endpoints into the EXISTING baseApi instance.
//
// IMPORTANT: baseApi's cinemaBaseQuery already has baseUrl set to
// ".../api/v1", so endpoint paths here must NOT repeat "/api/v1" —
// just "/users", "/users/{uuid}", etc. The isCinemaApiEndpoint() routing
// function in baseApi.js matches on the "/users" prefix to send these
// requests to your Cinema API instead of TMDB.

import { baseApi } from "./baseApi";

export const userApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // GET /api/v1/users
    getUsers: builder.query({
      query: () => "/users",
      providesTags: (result) =>
        result
          ? [
              ...result.map((u) => ({ type: "Users", id: u.uuid })),
              { type: "Users", id: "LIST" },
            ]
          : [{ type: "Users", id: "LIST" }],
    }),

    // GET /api/v1/users/{uuid}
    getUserByUuid: builder.query({
      query: (uuid) => `/users/${uuid}`,
      providesTags: (result, error, uuid) => [{ type: "Users", id: uuid }],
    }),

    // POST /api/v1/users
    createUser: builder.mutation({
      query: (body) => ({
        url: "/users",
        method: "POST",
        body,
      }),
      invalidatesTags: [{ type: "Users", id: "LIST" }],
    }),

    // PATCH /api/v1/users/{uuid}
    updateUser: builder.mutation({
      query: ({ uuid, ...body }) => ({
        url: `/users/${uuid}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (result, error, { uuid }) => [
        { type: "Users", id: uuid },
        { type: "Users", id: "LIST" },
      ],
    }),

    // PATCH /api/v1/users/{uuid}/enable
    enableUser: builder.mutation({
      query: (uuid) => ({
        url: `/users/${uuid}/enable`,
        method: "PATCH",
      }),
      invalidatesTags: (result, error, uuid) => [
        { type: "Users", id: uuid },
        { type: "Users", id: "LIST" },
      ],
    }),

    // PATCH /api/v1/users/{uuid}/disable
    disableUser: builder.mutation({
      query: (uuid) => ({
        url: `/users/${uuid}/disable`,
        method: "PATCH",
      }),
      invalidatesTags: (result, error, uuid) => [
        { type: "Users", id: uuid },
        { type: "Users", id: "LIST" },
      ],
    }),

    // PATCH /api/v1/users/{userUuid}/role
    updateUserRole: builder.mutation({
      query: ({ userUuid, role }) => ({
        url: `/users/${userUuid}/role`,
        method: "PATCH",
        body: { role },
      }),
      invalidatesTags: (result, error, { userUuid }) => [
        { type: "Users", id: userUuid },
        { type: "Users", id: "LIST" },
      ],
    }),

    // DELETE /api/v1/users/{uuid}
    deleteUser: builder.mutation({
      query: (uuid) => ({
        url: `/users/${uuid}`,
        method: "DELETE",
      }),
      invalidatesTags: [{ type: "Users", id: "LIST" }],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetUsersQuery,
  useGetUserByUuidQuery,
  useCreateUserMutation,
  useUpdateUserMutation,
  useEnableUserMutation,
  useDisableUserMutation,
  useUpdateUserRoleMutation,
  useDeleteUserMutation,
} = userApi;
