import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import { ArrowLeft } from "lucide-react";
import heroImage from "../../assets/others/cinema.png";
import {
  setCredentials,
  selectIsAuthenticated,
} from "../../redux/slices/authSlice";
import {
  useLoginMutation,
  useLazyGetCurrentUserQuery,
} from "../../services/api/authApi";
import { loginSchema } from "../../schemas/authSchema";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

const LoginComponent = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const [loginMutation, { isLoading: isApiSubmitting }] = useLoginMutation();
  const [getCurrentUser] = useLazyGetCurrentUserQuery();
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Already logged in? Go straight to the admin dashboard.
  useEffect(() => {
    if (isAuthenticated) {
      navigate("/admin", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data) => {
    setErrorMsg("");

    try {
      // 1. Authenticate with the FilmZone Cinema Booking API
      const authResponse = await loginMutation({
        identifier: data.email.trim(),
        password: data.password,
      }).unwrap();

      const accessToken = authResponse.accessToken;
      const refreshToken = authResponse.refreshToken;

      // Keep the refresh token (used later if the access token expires)
      if (refreshToken) {
        sessionStorage.setItem("refreshToken", refreshToken);
      }

      // 2. Fetch the admin profile from the Cinema API (/api/v1/users/me)
      let userProfile = {
        email: data.email,
        name: data.email.split("@")[0],
        role: "admin",
      };

      try {
        const userRes = await getCurrentUser().unwrap();
        if (userRes) {
          userProfile = {
            ...userRes,
            name:
              `${userRes.firstName || ""} ${userRes.lastName || ""}`.trim() ||
              userRes.username ||
              userRes.email ||
              data.email,
            email: userRes.email || data.email,
            role: "admin",
          };
        }
      } catch (profileErr) {
        console.warn("User profile fetch:", profileErr);
      }

      // 3. Save the real access token
      dispatch(
        setCredentials({
          accessToken,
          token: accessToken,
          refreshToken,
          user: userProfile,
        }),
      );

      toast.success(`Welcome back, ${userProfile.name}!`);
      navigate("/admin");
    } catch (err) {
      console.error("Login error:", err);
      const message =
        err?.data?.message ||
        err?.data?.error ||
        (err?.status === 401
          ? "Invalid email or password. Please try again."
          : "Login failed. Please check your credentials.");
      setErrorMsg(message);
      toast.error(message);
    }
  };

  // Google login removed — Firebase tokens are not accepted by the admin Cinema API.

  return (
    <div className="relative flex h-full w-full">
      {/* Back to Home - top-left corner on the image side (like the Stream Movie Detail page) */}
      <Link
        to="/"
        aria-label="Back to Home"
        className="absolute top-4 sm:top-6 left-4 sm:left-8 z-20 inline-flex w-10 h-10 sm:w-11 sm:h-11 items-center justify-center rounded-full bg-[#B90101] text-white shadow-lg shadow-red-950/10 hover:brightness-110 active:scale-95 transition"
      >
        <ArrowLeft className="w-5 h-5" />
      </Link>

      {/* Left Hero Section */}
      <div className="relative hidden w-1/2 md:block h-full">
        <img
          src={heroImage}
          alt="Cinema Experience"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
        <div className="relative flex h-full flex-col justify-end px-10 pb-12">
          <h2 className="text-2xl lg:text-3xl font-bold leading-snug text-white">
            Your next
            <br />
            movie experience
            <br />
            <span className="relative inline-block mt-1">
              starts here.
              <span className="absolute -bottom-1.5 left-0 h-1 w-20 bg-primary-red rounded-full" />
            </span>
          </h2>
        </div>
      </div>

      {/* Right Form Section */}
      <div className="flex w-full md:w-1/2 items-center justify-center px-4 sm:px-6 lg:px-8 py-2 sm:py-4 h-full overflow-y-auto">
        <div className="w-full max-w-md sm:max-w-lg my-auto py-1 sm:py-2">
          {/* Tabs */}
          <div className="mb-5 sm:mb-6 flex items-center gap-3 sm:gap-4">
            <span className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-primary-red tracking-tight">
              Log In
            </span>
            <span className="h-7 sm:h-8 lg:h-9 w-0.5 bg-primary-red rounded-full" />
            <Link
              to="/signup"
              className="text-2xl sm:text-3xl lg:text-4xl font-medium text-neutral-400 transition-colors hover:text-neutral-600 dark:hover:text-neutral-200 tracking-tight"
            >
              Sign Up
            </Link>
          </div>

          <h1 className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-white">
            Welcome back!
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-neutral-500 dark:text-neutral-400">
            Sign in to book your next movie.
          </p>

          {errorMsg && (
            <div className="mt-4 p-3 rounded-xl bg-red-500/10 border border-[#B90101]/30 text-[#B90101] text-xs font-semibold">
              {errorMsg}
            </div>
          )}

          <form
            onSubmit={handleSubmit(onSubmit)}
            noValidate
            className="mt-5 sm:mt-6 space-y-4 sm:space-y-4.5"
          >
            <div>
              <label
                htmlFor="email"
                className="mb-1.5 block text-xs sm:text-sm font-medium text-neutral-700 dark:text-neutral-200"
              >
                Email Address
              </label>
              <input
                type="email"
                id="email"
                placeholder="Enter your email address"
                {...register("email")}
                className={`w-full rounded-full border ${
                  errors.email
                    ? "border-red-500 focus:border-red-500"
                    : "border-(--border-light-mode) dark:border-(--border-dark-mode)"
                } bg-[var(--primary-color-5)] dark:bg-[var(--primary-color-30)] px-4 py-2.5 sm:py-3 text-xs sm:text-sm text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:border-primary-red focus:outline-none transition shadow-xs`}
              />
              {errors.email && (
                <p className="mt-1 text-xs text-red-500 font-medium pl-2">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-1.5 block text-xs sm:text-sm font-medium text-neutral-700 dark:text-neutral-200"
              >
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  placeholder="Enter your password"
                  {...register("password")}
                  className={`w-full rounded-full border ${
                    errors.password
                      ? "border-red-500 focus:border-red-500"
                      : "border-(--border-light-mode) dark:border-(--border-dark-mode)"
                  } bg-[var(--primary-color-5)] dark:bg-[var(--primary-color-30)] px-4 py-2.5 sm:py-3 pr-11 text-xs sm:text-sm text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:border-primary-red focus:outline-none transition shadow-xs`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 cursor-pointer"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeIcon /> : <EyeOffIcon />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-xs text-red-500 font-medium pl-2">
                  {errors.password.message}
                </p>
              )}

              <div className="mt-1.5 text-right">
                <Link
                  to="/forgot-password"
                  className="text-xs text-primary-red hover:underline font-medium"
                >
                  Forgot password?
                </Link>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || isApiSubmitting}
              className="w-full rounded-full bg-primary-red py-2.5 sm:py-3 text-xs sm:text-sm font-bold text-white shadow-md hover:brightness-110 active:scale-95 transition cursor-pointer mt-1 disabled:opacity-60"
            >
              {isSubmitting || isApiSubmitting ? "Logging In..." : "Login"}
            </button>
          </form>

          <p className="mt-4 sm:mt-5 text-center text-xs text-neutral-500 dark:text-neutral-400">
            Don&apos;t have an account?{" "}
            <Link
              to="/signup"
              className="font-bold text-primary-red underline hover:opacity-90"
            >
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

const EyeIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 20 20"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M10 4c-4.5 0-8.3 3-9.6 6 1.3 3 5.1 6 9.6 6s8.3-3 9.6-6c-1.3-3-5.1-6-9.6-6Z"
      stroke="currentColor"
      strokeWidth="1.5"
    />
    <circle cx="10" cy="10" r="2.5" stroke="currentColor" strokeWidth="1.5" />
  </svg>
);

const EyeOffIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 20 20"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M2.5 2.5l15 15M8.3 8.5a2.5 2.5 0 0 0 3.4 3.4M6.2 6.3C3.9 7.4 2.1 9.2 1 10c1.3 3 5.1 6 9.6 6 1.4 0 2.7-.3 3.9-.8M15.6 15.7C17.5 14.4 18.9 12.6 19.6 10c-1.1-2.6-4.1-5.2-8-5.9"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
);

export default LoginComponent;
