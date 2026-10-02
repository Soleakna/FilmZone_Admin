import { Navigate, Outlet } from "react-router";
import { useSelector } from "react-redux";
import { selectIsAuthenticated } from "../../redux/slices/authSlice";

export default function ProtectedRoute({ children }) {
  const isAuthenticated = useSelector(selectIsAuthenticated);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children ?? <Outlet />;
}