import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { setAuth, clearAuth } from "../Redux/features/auth/authSlice";

const normalizeBaseUrl = (value) => {
  if (!value) return null;
  return value.endsWith("/") ? value : `${value}/`;
};

const API_BASE_URL =
  normalizeBaseUrl(import.meta.env.VITE_API_URL) || "http://10.10.29.171:8000/";
// "https://api.sakeenapress.org/";

export const normalizeListResponse = (response) => {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.results)) return response.results;
  return [];
};

// Endpoints that must be called without an access token — hitting them with
// a stale/expired token shouldn't trigger a refresh attempt or a logout.
const PUBLIC_ENDPOINTS = [
  "signup",
  "universitySignup",
  "login",
  "forgetPass",
  "verifyOtp",
  "resetPassword",
];

const rawBaseQuery = fetchBaseQuery({
  baseUrl: API_BASE_URL,
  prepareHeaders: (headers, { getState, endpoint }) => {
    // Skip ngrok browser warning
    // headers.set("ngrok-skip-browser-warning", "true");

    // Skip auth token for public endpoints
    if (PUBLIC_ENDPOINTS.includes(endpoint)) {
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

// Serializes concurrent refresh attempts so a burst of 401s from several
// in-flight queries only triggers a single call to /auth/jwt/refresh/.
let refreshPromise = null;

const baseQueryWithReauth = async (args, api, extraOptions) => {
  let result = await rawBaseQuery(args, api, extraOptions);

  if (result.error?.status === 401 && !PUBLIC_ENDPOINTS.includes(api.endpoint)) {
    const state = api.getState();
    let refreshToken = state.auth?.refreshToken;
    if (!refreshToken) {
      try {
        refreshToken = JSON.parse(localStorage.getItem("auth") || "null")?.refresh;
      } catch {
        refreshToken = null;
      }
    }

    if (!refreshToken) {
      api.dispatch(clearAuth());
      return result;
    }

    if (!refreshPromise) {
      refreshPromise = rawBaseQuery(
        {
          url: "auth/jwt/refresh/",
          method: "POST",
          body: { refresh: refreshToken },
        },
        api,
        extraOptions,
      ).finally(() => {
        refreshPromise = null;
      });
    }

    const refreshResult = await refreshPromise;

    if (refreshResult.data?.access) {
      api.dispatch(
        setAuth({
          access: refreshResult.data.access,
          // ROTATE_REFRESH_TOKENS is on server-side, so a new refresh token
          // comes back with every refresh — fall back to the old one only if
          // the response didn't include a rotated one.
          refresh: refreshResult.data.refresh || refreshToken,
          role: state.auth?.role,
        }),
      );
      result = await rawBaseQuery(args, api, extraOptions);
    } else {
      // Refresh token itself is expired/invalid — force a real logout so
      // ProtectedRoute redirects instead of leaving a dead session on screen.
      api.dispatch(clearAuth());
    }
  }

  return result;
};

export const api = createApi({
  reducerPath: "baseApi",
  baseQuery: baseQueryWithReauth,
  tagTypes: [
    "uni_users",
    "user_profile",
    "categories",
    "courses",
    "teachers",
    "students",
    "email-templates",
    "sendgrid-api",
    "purposes",
    "membership",
    "bundles",
    "siteAnnouncements",
    "siteSettings",
    "assignmentSubmissions",
    "courseAnnouncements",
    "donations",
    "newsletterSubscribers",
    "dashboard",
    "courseModules",
    "moduleLessons",
    "rescheduleRequests",
    "lesson",
    "coupons",
    "consultations",
  ],
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
    setPassword: builder.mutation({
      query: (body) => ({
        url: "auth/users/set_password/",
        method: "POST",
        body,
      }),
    }),
  }),
});

export const {
  useLoginMutation,
  useGetCategoriesQuery,
  useGetCoursesQuery,
  useSetPasswordMutation,
} = api;
