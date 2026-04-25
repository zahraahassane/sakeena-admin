import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

const normalizeBaseUrl = (value) => {
  if (!value) return null;
  return value.endsWith("/") ? value : `${value}/`;
};

const API_BASE_URL =
  normalizeBaseUrl(import.meta.env.VITE_API_URL) ||
  "https://api.sakeenapress.org/";

const normalizeListResponse = (response) => {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.results)) return response.results;
  return [];
};

const baseQuery = fetchBaseQuery({
  baseUrl: API_BASE_URL,
  prepareHeaders: (headers, { getState, endpoint }) => {
    // Skip ngrok browser warning
    // headers.set("ngrok-skip-browser-warning", "true");

    // Skip auth token for public endpoints
    const publicEndpoints = [
      "signup",
      "universitySignup",
      "login",
      "forgetPass",
      "verifyOtp",
      "resetPassword",
    ];
    if (publicEndpoints.includes(endpoint)) {
      return headers;
    }

    // Try to get token from Redux state
    const token = getState().auth?.accessToken || null;
    // If token not in state, retrieve from local storage
    if (token) {
      headers.set("authorization", `JWT ${token}`);
    } else {
      const storedAuth = localStorage.getItem("auth");
      if (storedAuth) {
        try {
          const authData = JSON.parse(storedAuth);
          if (authData?.access) {
            headers.set("authorization", `JWT ${authData.access}`);
          }
        } catch (error) {
          console.warn("Failed to parse auth token from local storage:", error);
          localStorage.removeItem("auth"); // Clean up invalid data
        }
      }
    }
    return headers;
  },
});

export const api = createApi({
  reducerPath: "baseApi",
  baseQuery: baseQuery,
  tagTypes: ["uni_users", "user_profile", "categories", "courses"],
  endpoints: (builder) => ({
    login: builder.mutation({
      query: (credentials) => ({
        url: "auth/jwt/create/",
        method: "POST",
        body: credentials,
      }),
    }),
    getCategories: builder.query({
      query: () => ({
        url: "course-categories/",
        method: "GET",
      }),
      transformResponse: normalizeListResponse,
      providesTags: (result = []) =>
        result.length
          ? [
              ...result
                .filter((item) => item?.id != null)
                .map(({ id }) => ({ type: "categories", id })),
              { type: "categories", id: "LIST" },
            ]
          : [{ type: "categories", id: "LIST" }],
    }),
    getCourses: builder.query({
      query: ({ category, status, search } = {}) => {
        const params = new URLSearchParams();
        if (category && category !== "All") params.append("category", category);
        if (status && status !== "All") params.append("status", status);
        if (search) params.append("search", search);

        return {
          url: `courses/${params.toString() ? `?${params.toString()}` : ""}`,
          method: "GET",
        };
      },
      transformResponse: normalizeListResponse,
      providesTags: (result = []) =>
        result.length
          ? [
              ...result
                .filter((item) => item?.id != null)
                .map(({ id }) => ({ type: "courses", id })),
              { type: "courses", id: "LIST" },
            ]
          : [{ type: "courses", id: "LIST" }],
    }),
  }),
});

export const { useLoginMutation, useGetCategoriesQuery, useGetCoursesQuery } =
  api;
