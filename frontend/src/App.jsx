import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./auth/useAuth.js";
import AppLayout from "./layout/AppLayout.jsx";
import Login from "./pages/Login.jsx";
import Signup from "./pages/Signup.jsx";
import Home from "./pages/Home.jsx";
import Forum from "./pages/Forum.jsx";
import Reports from "./pages/Reports.jsx";
import ChangePassword from "./pages/ChangePassword.jsx";
import AdminUsers from "./pages/AdminUsers.jsx";

function RequireAuth({ children }) {
  const { user, loading } = useAuth();
  if (loading) {
    return <div className="app-loading">Loading…</div>;
  }
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

function ProtectedLayout() {
  return (
    <RequireAuth>
      <AppLayout />
    </RequireAuth>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route element={<ProtectedLayout />}>
        <Route index element={<Home />} />
        <Route path="forum/:courseInstructorId" element={<Forum />} />
        <Route path="reports" element={<Reports />} />
        <Route path="account/password" element={<ChangePassword />} />
        <Route path="admin/users" element={<AdminUsers />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
