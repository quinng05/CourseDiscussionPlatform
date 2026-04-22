import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/useAuth.js";
import { EyeIcon, EyeOffIcon } from "../icons/EyeIcon.jsx";

export default function Login() {
  const { user, loading, refresh } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("student");
  const [showErr, setShowErr] = useState(false);
  const [errMsg, setErrMsg] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const signupBanner =
    location.state?.signedUp === true
      ? `Account created.${
          location.state?.email
            ? ` You can sign in as ${location.state.email}.`
            : ""
        }`
      : "";

  if (!loading && user) {
    return <Navigate to="/" replace />;
  }

  async function doLogin(e) {
    e.preventDefault();
    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email: email.trim(), password, role }),
    });
    if (res.ok) {
      setShowErr(false);
      await refresh();
      navigate("/", { replace: true });
    } else {
      let msg = "Incorrect email, password, or role (e.g. pick Student for this account).";
      if (res.status >= 500) {
        const j = await res.json().catch(() => ({}));
        msg = j.error ? String(j.error) : "Server error — check the terminal running the API.";
      }
      setErrMsg(msg);
      setShowErr(true);
    }
  }

  return (
    <div className="login-page">
      <div className="login-box">
        <h1>Course Discussion Platform</h1>
        <p>Virginia Tech — sign in with your VT credentials</p>
        {signupBanner ? (
          <p className="alert alert--success" role="status">
            {signupBanner}
          </p>
        ) : null}
        <form onSubmit={doLogin}>
          <label htmlFor="loginEmail">VT Email</label>
          <input
            id="loginEmail"
            type="email"
            autoComplete="username"
            placeholder="pid@vt.edu"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <label htmlFor="loginPass">Password</label>
          <div className="password-wrapper">
            <input
              id="loginPass"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
              type="button"
              className="password-toggle"
              aria-label={showPassword ? "Hide password" : "Show password"}
              onClick={() => setShowPassword((v) => !v)}
            >
              {showPassword ? <EyeOffIcon /> : <EyeIcon />}
            </button>
          </div>
          <label htmlFor="loginRole">I am a...</label>
          <select
            id="loginRole"
            value={role}
            onChange={(e) => setRole(e.target.value)}
          >
            <option value="student">Student</option>
            <option value="teacher">Teacher</option>
            <option value="sysadmin">System Administrator</option>
          </select>
          <button type="submit">Sign In</button>
        </form>
        <div className={`err${showErr ? " visible" : ""}`} id="loginErr">
          {errMsg || "Incorrect email, password, or role (e.g. pick Student for this account)."}
        </div>
        <p className="login-hint">
          New here? <Link to="/signup">Create an account</Link>
        </p>
      </div>
    </div>
  );
}