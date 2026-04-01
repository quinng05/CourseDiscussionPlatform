import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./auth/useAuth.js";
import Login from "./pages/Login.jsx";
import Home from "./pages/Home.jsx";
import Forum from "./pages/Forum.jsx";

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

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <RequireAuth>
            <Home />
          </RequireAuth>
        }
      />
      <Route
        path="/forum/:courseInstructorId"
        element={
          <RequireAuth>
            <Forum />
          </RequireAuth>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
