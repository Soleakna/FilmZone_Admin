import React, { useState } from "react";
import { Link, useNavigate } from "react-router";
import { useDispatch } from "react-redux";
import { toast } from "react-toastify";
import { ArrowLeft } from "lucide-react";
import heroImage from "../../assets/others/cinema.png";
import { setCredentials } from "../../redux/slices/authSlice";
import { registerUser } from "../../services/mockAuthService";
import { signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "../../firebase/config";
import { registerSchema } from "../../schemas/authSchema";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

const SignUpComponent = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [showPassword, setShowPassword] = useState(false);
  const [isSocialSubmitting, setIsSocialSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
    },
  });

  const onSubmit = (data) => {
    setErrorMsg("");

    try {
      const result = registerUser({
        fullName: data.fullName,
        email: data.email,
        password: data.password,
      });
      dispatch(setCredentials(result));
      toast.success(`Account created! Welcome, ${result.user.name}!`);
      navigate("/");
    } catch (err) {
      const message = err.message || "Failed to create account.";
      setErrorMsg(message);
      toast.error(message);
    }
  };

  const handleGoogleSignUp = async () => {
    try {
      setIsSocialSubmitting(true);
      const userCredential = await signInWithPopup(auth, googleProvider);
      const fbUser = userCredential.user;

      const authData = {
        user: {
          id: fbUser.uid,
          name: fbUser.displayName || "Google User",
          email: fbUser.email,
          role: "user",
          avatar:
            fbUser.photoURL ||
            `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(
              fbUser.displayName || "User",
            )}`,
          createdAt: new Date().toISOString(),
        },
        token: await fbUser.getIdToken(),
      };

      dispatch(setCredentials(authData));
      toast.success(`Welcome to FilmZone, ${authData.user.name}!`);
      navigate("/");
    } catch (err) {
      if (err.code !== "auth/popup-closed-by-user") {
        toast.error(err.message || "Google sign up failed");
      }
    } finally {
      setIsSocialSubmitting(false);
    }
  };

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
          <div className="mb-4 sm:mb-5 flex items-center gap-3 sm:gap-4">
            <Link
              to="/login"
              className="text-2xl sm:text-3xl lg:text-4xl font-medium text-neutral-400 transition-colors hover:text-neutral-600  tracking-tight"
            >
              Log In
            </Link>
            <span className="h-7 sm:h-8 lg:h-9 w-0.5 bg-primary-red rounded-full" />
            <span className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-primary-red tracking-tight">
              Sign Up
            </span>
          </div>

          {/* Social Auth */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleGoogleSignUp}
              className="flex flex-1 items-center justify-center gap-2 rounded-full border border-(--border-light-mode) bg-[var(--primary-color-5)]   py-2.5 sm:py-3 text-xs sm:text-sm font-semibold text-neutral-900  hover:bg-neutral-200  transition cursor-pointer"
            >
              <GoogleIcon />
              <span>Google</span>
            </button>
            <button
              type="button"
              onClick={() =>
                toast.info(
                  "Facebook registration coming soon! Try Google or Email.",
                )
              }
              className="flex flex-1 items-center justify-center gap-2 rounded-full border border-(--border-light-mode) bg-[var(--primary-color-5)]    py-2.5 sm:py-3 text-xs sm:text-sm font-semibold text-neutral-900  hover:bg-neutral-200  transition cursor-pointer"
            >
              <FacebookIcon />
              <span>Facebook</span>
            </button>
          </div>

          <div className="my-3.5 sm:my-4 flex items-center gap-3">
            <span className="h-px flex-1 bg-neutral-200 " />
            <span className="text-xs font-semibold text-primary-red">Or</span>
            <span className="h-px flex-1 bg-neutral-200 " />
          </div>

          {errorMsg && (
            <div className="mb-3 p-3 rounded-xl bg-red-500/10 border border-[#B90101]/30 text-[#B90101] text-xs font-semibold">
              {errorMsg}
            </div>
          )}

          <form
            onSubmit={handleSubmit(onSubmit)}
            noValidate
            className="space-y-3 sm:space-y-3.5"
          >
            <div>
              <label
                htmlFor="fullName"
                className="mb-1.5 block text-xs sm:text-sm font-medium text-neutral-700 "
              >
                Full Name
              </label>
              <input
                type="text"
                id="fullName"
                placeholder="Rotana Oudom"
                {...register("fullName")}
                className={`w-full rounded-full border ${
                  errors.fullName
                    ? "border-red-500 focus:border-red-500"
                    : "border-(--border-light-mode) "
                } bg-[var(--primary-color-5)]  px-4 py-2.5 sm:py-3 text-xs sm:text-sm text-neutral-900  placeholder:text-neutral-400 focus:border-primary-red focus:outline-none transition shadow-xs`}
              />
              {errors.fullName && (
                <p className="mt-1 text-xs text-red-500 font-medium pl-2">
                  {errors.fullName.message}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="email"
                className="mb-1.5 block text-xs sm:text-sm font-medium text-neutral-700 "
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
                    : "border-(--border-light-mode) "
                } bg-[var(--primary-color-5)]  px-4 py-2.5 sm:py-3 text-xs sm:text-sm text-neutral-900  placeholder:text-neutral-400 focus:border-primary-red focus:outline-none transition shadow-xs`}
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
                className="mb-1.5 block text-xs sm:text-sm font-medium text-neutral-700 "
              >
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  placeholder="Create your password (min 6 characters)"
                  {...register("password")}
                  className={`w-full rounded-full border ${
                    errors.password
                      ? "border-red-500 focus:border-red-500"
                      : "border-(--border-light-mode) "
                  } bg-[var(--primary-color-5)]  px-4 py-2.5 sm:py-3 pr-11 text-xs sm:text-sm text-neutral-900  placeholder:text-neutral-400 focus:border-primary-red focus:outline-none transition shadow-xs`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600  cursor-pointer"
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
            </div>

            <button
              type="submit"
              disabled={isSubmitting || isSocialSubmitting}
              className="w-full rounded-full bg-primary-red py-2.5 sm:py-3 text-xs sm:text-sm font-bold text-white shadow-md hover:brightness-110 active:scale-95 transition cursor-pointer mt-1 sm:mt-2 disabled:opacity-60"
            >
              {isSubmitting ? "Creating Account..." : "Create Account"}
            </button>
          </form>

          <p className="mt-4 sm:mt-5 text-center text-xs text-neutral-500 ">
            Already have an account?{" "}
            <Link
              to="/login"
              className="font-bold text-primary-red underline hover:opacity-90"
            >
              Log In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

const GoogleIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 20 20"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M19.6 10.23c0-.68-.06-1.36-.18-2.02H10v3.83h5.38a4.6 4.6 0 0 1-2 3.02v2.5h3.24c1.9-1.75 2.98-4.33 2.98-7.33Z"
      fill="#4285F4"
    />
    <path
      d="M10 20c2.7 0 4.96-.9 6.62-2.44l-3.24-2.5c-.9.6-2.06.96-3.38.96-2.6 0-4.8-1.76-5.59-4.12H1.06v2.58A10 10 0 0 0 10 20Z"
      fill="#34A853"
    />
    <path
      d="M4.41 11.9a6 6 0 0 1 0-3.8V5.52H1.06a10 10 0 0 0 0 8.96l3.35-2.58Z"
      fill="#FBBC05"
    />
    <path
      d="M10 3.98c1.47 0 2.79.5 3.83 1.5l2.87-2.87A9.96 9.96 0 0 0 10 0 10 10 0 0 0 1.06 5.52L4.41 8.1C5.2 5.74 7.4 3.98 10 3.98Z"
      fill="#EA4335"
    />
  </svg>
);

const FacebookIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 20 20"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M20 10a10 10 0 1 0-11.56 9.88v-6.99H5.9V10h2.54V7.8c0-2.5 1.49-3.89 3.77-3.89 1.1 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56V10h2.78l-.44 2.89h-2.34v6.99A10 10 0 0 0 20 10Z"
      fill="#1877F2"
    />
  </svg>
);

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

export default SignUpComponent;
