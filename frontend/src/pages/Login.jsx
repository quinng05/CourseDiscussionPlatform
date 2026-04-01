import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/useAuth.js";

export default function Login() {
  const { user, loading, refresh } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("student");
  const [showErr, setShowErr] = useState(false);
  const [errMsg, setErrMsg] = useState("");

  if (!loading && user) {
    return <Navigate to="/" replace />;
  }

  async function doLogin(e) {
    e.preventDefault();
    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        email: email.trim(),
        password,
        role,
      }),
    });
    if (res.ok) {
      setShowErr(false);
      await refresh();
      navigate("/", { replace: true });
    } else {
      let msg =
        "Incorrect email, password, or role (e.g. pick Student for this account).";
      if (res.status >= 500) {
        const j = await res.json().catch(() => ({}));
        msg = j.error
          ? String(j.error)
          : "Server error — check the terminal running the API.";
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
          <input
            id="loginPass"
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

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
          {errMsg ||
            "Incorrect email, password, or role (e.g. pick Student for this account)."}
        </div>
      </div>
    </div>
  );
}
