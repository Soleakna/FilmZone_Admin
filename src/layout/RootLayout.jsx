import { Outlet, ScrollRestoration } from "react-router";

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
