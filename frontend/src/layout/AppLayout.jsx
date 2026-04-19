import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/useAuth.js";

export default function AppLayout() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  async function onSignOut() {
    await signOut();
    navigate("/login", { replace: true });
  }

  return (
    <div className="app-shell">
      <nav className="app-top-nav">
        <div className="app-nav-left">
          <NavLink to="/" className="app-nav-brand" end>
            <strong>Course Discussion Platform</strong>
          </NavLink>
          <div className="app-nav-links">
            <NavLink to="/" className="app-nav-link" end>
              Forums
            </NavLink>
            <NavLink to="/reports" className="app-nav-link">
              Reports
            </NavLink>
            <NavLink to="/account/password" className="app-nav-link">
              Change password
            </NavLink>
            {user?.role === "sysadmin" && (
              <NavLink to="/admin/users" className="app-nav-link">
                Admin users
              </NavLink>
            )}
          </div>
        </div>
        <div className="app-nav-right">
          <span className="app-nav-userpill">
            {user?.name} ({user?.role})
          </span>
          <button type="button" onClick={() => void onSignOut()}>
            Sign out
          </button>
        </div>
      </nav>
      <main className="app-main">
        <Outlet />
      </main>
    </div>
  );
}
