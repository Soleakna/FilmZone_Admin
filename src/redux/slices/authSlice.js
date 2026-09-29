import { createSlice } from "@reduxjs/toolkit";

// Auth session keys shared between sessionStorage & legacy localStorage cleanup.
const AUTH_STORAGE_KEYS = ["cinema_token", "cinema_user", "cinema_refresh_token"];

/**
 * The admin session is intentionally NOT persisted.
 *
 * The token lives only in Redux memory, and Redux state is rebuilt on every
 * full page load. That means every visit / refresh starts logged out and the
 * admin is asked to log in again.
 */

// Remove any stale credentials an older version wrote into storage. A fresh
// visit must always begin at the login screen.
AUTH_STORAGE_KEYS.forEach((key) => {
  localStorage.removeItem(key);
  sessionStorage.removeItem(key);
});

const clearAuthStorage = () => {
  AUTH_STORAGE_KEYS.forEach((key) => {
    sessionStorage.removeItem(key);
    localStorage.removeItem(key);
  });
};

// Always start logged out on a fresh page load.
const initialState = {
  user: null,
  token: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  loading: false,
  error: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setCredentials: (state, action) => {
      const { user, token, accessToken, refreshToken } = action.payload;
      state.user = user !== undefined ? user : state.user;
      state.token = accessToken || token || state.token;
      state.accessToken = state.token;
      if (refreshToken !== undefined) state.refreshToken = refreshToken;
      state.isAuthenticated = !!state.token;
      state.error = null;
      // Persist ONLY the profile (needed for the hall-ownership registry key).
      // The token & refresh token stay in memory so every fresh page load
      // requires login again.
      if (user) sessionStorage.setItem("cinema_user", JSON.stringify(user));
      sessionStorage.removeItem("cinema_token");
      sessionStorage.removeItem("cinema_refresh_token");
      localStorage.removeItem("cinema_token");
      localStorage.removeItem("cinema_refresh_token");
    },
    updateUser: (state, action) => {
      state.user = { ...state.user, ...action.payload };
      if (state.user) {
        sessionStorage.setItem("cinema_user", JSON.stringify(state.user));
      }
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.accessToken = null;
      state.refreshToken = null;
      state.isAuthenticated = false;
      state.error = null;
      clearAuthStorage();
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
  },
});

export const { setCredentials, updateUser, logout, setError, setLoading } =
  authSlice.actions;

export const selectCurrentUser = (state) => state.auth.user;
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated;
export const selectAuthLoading = (state) => state.auth.loading;

export default authSlice.reducer;
