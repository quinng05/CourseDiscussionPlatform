import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/useAuth.js";

export default function Signup() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState("student");
  const [major, setMajor] = useState("");
  const [department, setDepartment] = useState("");
  const [errMsg, setErrMsg] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!loading && user) {
    return <Navigate to="/" replace />;
  }

  async function onSubmit(e) {
    e.preventDefault();
    setErrMsg("");
    setSubmitting(true);
    const body = {
      email: email.trim(),
      password,
      name: name.trim(),
      role,
      major: major.trim(),
      department: department.trim(),
    };
    const res = await fetch("/api/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(body),
    });
    setSubmitting(false);
    if (res.ok) {
      navigate("/login", {
        replace: true,
        state: { signedUp: true, email: email.trim() },
      });
      return;
    }
    const j = await res.json().catch(() => ({}));
    setErrMsg(j.error ? String(j.error) : "Could not create account.");
  }

  return (
    <div className="login-page">
      <div className="login-box">
        <h1>Create an account</h1>
        <p>Students and instructors can register. Sysadmin accounts are created by an existing administrator.</p>
        <form onSubmit={onSubmit}>
          <label htmlFor="suName">Display name</label>
          <input
            id="suName"
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <label htmlFor="suEmail">VT Email</label>
          <input
            id="suEmail"
            type="email"
            autoComplete="email"
            placeholder="pid@vt.edu"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <label htmlFor="suPass">Password (min 8 characters)</label>
          <input
            id="suPass"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
          />
          <label htmlFor="suRole">I am a…</label>
          <select
            id="suRole"
            value={role}
            onChange={(e) => setRole(e.target.value)}
          >
            <option value="student">Student</option>
            <option value="teacher">Teacher</option>
          </select>
          {role === "student" && (
            <>
              <label htmlFor="suMajor">Major</label>
              <input
                id="suMajor"
                value={major}
                onChange={(e) => setMajor(e.target.value)}
                required
              />
            </>
          )}
          {role === "teacher" && (
            <>
              <label htmlFor="suDept">Department</label>
              <input
                id="suDept"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                required
              />
            </>
          )}
          <button type="submit" disabled={submitting}>
            {submitting ? "Creating…" : "Create account"}
          </button>
        </form>
        {errMsg ? (
          <div className="err visible" role="alert">
            {errMsg}
          </div>
        ) : null}
        <p className="login-hint">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
