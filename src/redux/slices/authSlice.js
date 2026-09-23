import { createSlice } from "@reduxjs/toolkit";

const token = localStorage.getItem("cinema_token") || null;
const refreshToken = localStorage.getItem("cinema_refresh_token") || null;
const user = localStorage.getItem("cinema_user")
  ? JSON.parse(localStorage.getItem("cinema_user"))
  : null;

const initialState = {
  user: user,
  token: token,
  accessToken: token,
  refreshToken: refreshToken,
  isAuthenticated: !!token,
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
      if (state.token) localStorage.setItem("cinema_token", state.token);
      if (user) localStorage.setItem("cinema_user", JSON.stringify(user));
      if (state.refreshToken) {
        localStorage.setItem("cinema_refresh_token", state.refreshToken);
      } else {
        localStorage.removeItem("cinema_refresh_token");
      }
    },
    updateUser: (state, action) => {
      state.user = { ...state.user, ...action.payload };
      if (state.user) {
        localStorage.setItem("cinema_user", JSON.stringify(state.user));
      }
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.accessToken = null;
      state.refreshToken = null;
      state.isAuthenticated = false;
      state.error = null;
      localStorage.removeItem("cinema_token");
      localStorage.removeItem("cinema_user");
      localStorage.removeItem("cinema_refresh_token");
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
