import { Outlet, ScrollRestoration } from "react-router";

// RootLayout wraps the authentication pages (Login / Sign Up / Forgot Password).
// The admin auth area is ALWAYS rendered in light mode, regardless of the
// global app theme toggle.
export default function RootLayout() {
  return (
    <div
      className="min-h-screen flex flex-col font-sans antialiased transition-colors duration-300 selection:bg-[#B90101] selection:text-white h-screen overflow-hidden text-neutral-900"
      style={{
        background: "var(--bg-light-mode)",
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
