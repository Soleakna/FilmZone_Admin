import ReactDOM from "react-dom/client";
import { Provider } from "react-redux";
import { createBrowserRouter, RouterProvider, Navigate } from "react-router";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { store } from "./redux/store";
import "./index.css";

// Layout & Pages

import ForgotPassword from "./components/auth/ForgotPassword";
import SignUpComponent from "./components/auth/SignUpComponent";
import LoginComponent from "./components/auth/LoginComponent";
import RootLayout from "./layout/RootLayout";

import AdminLayout from "./layout/AdminLayout";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import AdminDashboardPage from "./pages/admin/AdminDashboardPage";
import AdminMovieLibraryPage from "./pages/admin/AdminMovieLibraryPage";
import AdminUserAnalyticsPage from "./pages/admin/AdminUserAnalyticsPage";
import AdminHallsPage from "./pages/admin/AdminHallsPage";
import NotFoundPage from "./pages/NotFoundPage";

const router = createBrowserRouter([
  {
    path: "/",
    element: <RootLayout />,
    children: [
      {
        index: true,
        element: <Navigate to="/admin" replace />,
      },
      {
        path: "/login",
        element: <LoginComponent />,
      },
      {
        path: "/signup",
        element: <SignUpComponent />,
      },
      {
        path: "/forgot-password",
        element: <ForgotPassword />,
      },
    ],
  },
  {
    path: "/admin",
    element: (
      <ProtectedRoute>
        <AdminLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <AdminDashboardPage />,
      },
      {
        path: "dashboard",
        element: <AdminDashboardPage />,
      },
      {
        path: "movies",
        element: <AdminMovieLibraryPage />,
      },
      {
        path: "analytics",
        element: <AdminUserAnalyticsPage />,
      },
      {
        path: "halls",
        element: <AdminHallsPage />,
      },
    ],
  },
  {
    path: "*",
    element: <NotFoundPage />,
  },
]);

const root = document.getElementById("root");

ReactDOM.createRoot(root).render(
  <Provider store={store}>
    <RouterProvider router={router} />
    <ToastContainer
      position="top-right"
      autoClose={3000}
      hideProgressBar={false}
      newestOnTop
      closeOnClick
      rtl={false}
      pauseOnFocusLoss
      draggable
      pauseOnHover
      theme="dark"
    />
  </Provider>,
);
