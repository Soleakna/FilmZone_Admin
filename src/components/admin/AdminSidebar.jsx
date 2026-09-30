import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useLocation, useNavigate } from "react-router";
import {LayoutDashboard,Film,BarChart2,Building2,Users,ArrowLeft,LogOut,Popcorn,Menu,X} from "lucide-react";
import { logout, selectCurrentUser } from "../../redux/slices/authSlice";
import { baseApi } from "../../services/api/baseApi";
import filmZoneLogo from "../../assets/logo/FilmZone_DarkModeLogo.png";

export default function AdminSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  // The admin that actually logged in (fetched from the Cinema API during
  // login via GET /users/me and stored in Redux auth state).
  const user = useSelector(selectCurrentUser);

  // Mobile drawer state — nav slides in over the content on small screens.
  const [isOpen, setIsOpen] = useState(false);
  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    dispatch(logout());
    // Wipe every cached API response (halls, movies, etc.) fetched under the
    // previous session. Without this, the next login in the same tab keeps
    // showing the old session's data (e.g. stale hall lists), and deleting
    // those halls fails because they belong to the previous session's token.
    dispatch(baseApi.util.resetApiState());
    navigate("/login");
  };

  const getNavItemClass = (path, isEnd = false) => {
    const isActive =
      path === "/admin"
        ? location.pathname === "/admin" ||
          location.pathname === "/admin/dashboard"
        : isEnd
          ? location.pathname === path
          : location.pathname.startsWith(path);

    return `flex items-center gap-3 px-4.5 py-2.5 text-[14px] font-bold transition-all duration-200 w-full ${
      isActive
        ? "bg-[#B90101] text-white shadow-sm"
        : "text-neutral-600 hover:text-neutral-950 hover:bg-neutral-200/60"
    }`;
  };

  // Real admin identity from the API (state.auth.user). The API has no avatar
  // photo field (verified against /users/schema), so the circle shows initials.
  const adminDisplayName =
    `${user?.firstName || ""} ${user?.lastName || ""}`.trim() ||
    user?.username?.trim() ||
    user?.email ||
    "Admin User";

  const adminSubLabel =
    user?.role
      ? String(user.role).toUpperCase()
      : user?.email || "Administrator";

  const adminInitials = (() => {
    if (!user) return "AD";
    const first = (user.firstName || "").trim();
    const last = (user.lastName || "").trim();
    if (first || last) {
      return `${first.charAt(0)}${last.charAt(0)}`.trim().toUpperCase() ||
        "AD";
    }
    const username = (user.username || "").trim();
    if (username) return username.slice(0, 2).toUpperCase();
    const email = (user.email || "").trim();
    return email ? email.slice(0, 2).toUpperCase() : "AD";
  })();

  return (
    <>
      {/* Mobile Top Header with Hamburger Toggle */}
      <div className="md:hidden bg-[#B90101] h-14 w-full flex items-center justify-between px-4 shadow-sm shrink-0 z-40 sticky top-0">
        <Link to="/" className="flex items-center gap-1.5">
          <img
            src={filmZoneLogo}
            alt="FilmZone"
            className="h-7 w-auto object-contain shrink-0"
          />
          <span className="text-[9px] font-black uppercase bg-black/30 text-white px-1.5 py-0.5 rounded ml-1">
            Admin
          </span>
        </Link>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="text-white p-1 rounded hover:bg-white/10 transition cursor-pointer"
          aria-label="Toggle Navigation"
        >
          {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 bg-black/50 backdrop-blur-xs z-40 md:hidden"
        />
      )}

      {/* Sidebar: Slide Drawer on Mobile, Sticky on Desktop */}
      <aside
        className={`fixed md:sticky top-0 left-0 h-screen h-[100dvh] w-64 md:w-52 lg:w-56 bg-[#f4f5f8] border-r border-neutral-200 flex flex-col justify-between shrink-0 font-sans z-50 transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        <div className="flex flex-col flex-1 min-h-0">
          {/* Top Solid Red Header Banner (Edge to edge) */}
          <div className="bg-[#B90101] h-16 w-full flex items-center justify-between px-4.5 shadow-sm shrink-0">
            <Link to="/" className="flex items-center gap-1.5 group">
              <img
                src={filmZoneLogo}
                alt="FilmZone"
                className="h-8 w-auto object-contain shrink-0"
              />
              <span className="text-[10px] font-black uppercase bg-black/30 text-white px-1.5 py-0.5 rounded ml-1">
                Admin
              </span>
            </Link>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="md:hidden text-white/80 hover:text-white p-1"
              aria-label="Close navigation"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links - Full width to the edge like the red bar logo */}
          <nav className="py-5 space-y-1 flex-1 overflow-y-auto">
            <Link to="/admin" className={getNavItemClass("/admin", true)}>
              <LayoutDashboard className="w-4.5 h-4.5 shrink-0" />
              <span>Dashboard</span>
            </Link>

            <Link to="/admin/movies" className={getNavItemClass("/admin/movies")}>
              <Film className="w-4.5 h-4.5 shrink-0" />
              <span>Movie Library</span>
            </Link>

            <Link to="/admin/halls" className={getNavItemClass("/admin/halls")}>
              <Building2 className="w-4.5 h-4.5 shrink-0" />
              <span>Manage Halls</span>
            </Link>

            <Link to="/admin/users" className={getNavItemClass("/admin/users")}>
              <Users className="w-4.5 h-4.5 shrink-0" />
              <span>Manage Users</span>
            </Link>

            <Link to="/admin/concession" className={getNavItemClass("/admin/concession")}>
              <Popcorn className="w-4.5 h-4.5 shrink-0" />
              <span>Concession</span>
            </Link>

            <Link
              to="/admin/analytics"
              className={getNavItemClass("/admin/analytics")}
            >
              <BarChart2 className="w-4.5 h-4.5 shrink-0" />
              <span>User Analytics</span>
            </Link>
          </nav>
        </div>

        {/* Bottom Admin User Profile Section (real logged-in admin) */}
        <div className="flex items-center justify-between gap-2.5 shrink-0 bg-[#f4f5f8] sticky bottom-0 p-4 border-t border-neutral-200/80">
          <div className="flex items-center gap-2.5 min-w-0">
            <span
              className="flex items-center justify-center w-9 h-9 rounded-full border-2 border-white bg-[#B90101] text-white text-sm font-black shrink-0"
              title={user?.email || adminDisplayName}
            >
              {adminInitials}
            </span>
            <div className="flex flex-col min-w-0">
              <span
                className="text-xs font-extrabold text-neutral-900 leading-tight truncate"
                title={user?.email || adminDisplayName}
              >
                {adminDisplayName}
              </span>
              <span className="text-[11px] font-semibold text-neutral-500 leading-tight truncate">
                {adminSubLabel}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            title="Log out"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-neutral-500 hover:text-[#B90101] transition cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}