import { Outlet } from "react-router";
import AdminSidebar from "../components/admin/AdminSidebar";

export default function AdminLayout() {
  return (
    <div className="min-h-screen md:h-screen md:overflow-hidden bg-[#f8f9fc] flex flex-col md:flex-row font-sans antialiased text-neutral-900">
      {/* Dedicated Admin Sidebar (No User Navbar / No User Footer) */}
      <AdminSidebar />

      {/* Main Content Viewport */}
      <main className="flex-1 p-4 sm:p-5 lg:p-6 w-full min-w-0 md:overflow-y-auto md:h-full overflow-x-hidden">
        <Outlet />
      </main>
      
    </div>
  );
}
