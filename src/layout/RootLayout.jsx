import { Outlet, ScrollRestoration } from "react-router";
import { useSelector } from "react-redux";
import { selectTheme } from "../redux/slices/uiSlice";

// RootLayout wraps the authentication pages (Login / Sign Up / Forgot Password).
// The User-side Navbar & Footer have been removed with the user website.
export default function RootLayout() {
  const theme = useSelector(selectTheme);
  const isDark = theme === "dark";

  return (
    <div
      className={`min-h-screen flex flex-col font-sans antialiased transition-colors duration-300 selection:bg-[#B90101] selection:text-white h-screen overflow-hidden ${
        isDark ? "text-white" : "text-neutral-900"
      }`}
      style={{
        background: isDark ? "var(--bg-dark-mode)" : "var(--bg-light-mode)",
        backgroundAttachment: "fixed",
        backgroundSize: "cover",
        minHeight: "100vh",
      }}
    >
      <main className="flex-1 w-full relative z-10 h-screen w-full overflow-hidden">
        <Outlet />
      </main>
      <ScrollRestoration />
    </div>
  );
}
