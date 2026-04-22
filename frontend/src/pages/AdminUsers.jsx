import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../auth/useAuth.js";

export default function AdminUsers() {
  const { user } = useAuth();
  const [rows, setRows] = useState([]);
  const [loadErr, setLoadErr] = useState("");
  const [formErr, setFormErr] = useState("");
  const [okMsg, setOkMsg] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState("student");
  const [major, setMajor] = useState("");
  const [department, setDepartment] = useState("");

  // Delete form state
  const [deleteEmail, setDeleteEmail] = useState("");
  const [deleteErr, setDeleteErr] = useState("");
  const [deleteOkMsg, setDeleteOkMsg] = useState("");

  const load = useCallback(async () => {
    setLoadErr("");
    const r = await fetch("/api/users", { credentials: "include" });
    if (!r.ok) {
      const j = await r.json().catch(() => ({}));
      setLoadErr(j.error ? String(j.error) : "Could not load users.");
      setRows([]);
      return;
    }
    setRows(await r.json());
  }, []);

  useEffect(() => {
    if (user?.role !== "sysadmin") return undefined;
    const id = window.setTimeout(() => {
      void load();
    }, 0);
    return () => window.clearTimeout(id);
  }, [user?.role, load]);

  async function onCreate(e) {
    e.preventDefault();
    setFormErr("");
    setOkMsg("");
    const body = {
      email: email.trim(),
      password,
      name: name.trim(),
      role,
      major: major.trim(),
      department: department.trim(),
    };
    const r = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(body),
    });
    if (!r.ok) {
      const j = await r.json().catch(() => ({}));
      setFormErr(j.error ? String(j.error) : "Could not create user.");
      return;
    }
    setOkMsg("User created.");
    setEmail("");
    setPassword("");
    setName("");
    setMajor("");
    setDepartment("");
    await load();
  }

  async function onDelete(e) {
    e.preventDefault();
    setDeleteErr("");
    setDeleteOkMsg("");
    if (!deleteEmail.trim()) {
      setDeleteErr("Please enter an email to delete.");
      return;
    }
    const confirmed = window.confirm(`Are you sure you want to delete the account for ${deleteEmail}? This cannot be undone.`);
    if (!confirmed) return;
    const r = await fetch("/api/delete-account", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email: deleteEmail.trim() }),
    });
    if (!r.ok) {
      const j = await r.json().catch(() => ({}));
      setDeleteErr(j.error ? String(j.error) : "Could not delete user.");
      return;
    }
    setDeleteOkMsg(`Account for ${deleteEmail} deleted successfully.`);
    setDeleteEmail("");
    await load();
  }

  if (user?.role !== "sysadmin") {
    return (
      <div className="home-body account-page">
        <h1>Admin users</h1>
        <p className="alert alert--error" role="alert">
          This page is only available to system administrators.
        </p>
      </div>
    );
  }

  return (
    <div className="home-body account-page">
      <h1>User administration</h1>
      <p className="muted">
        Create student, teacher, or sysadmin accounts. Passwords must be at least 8 characters.
      </p>

      {loadErr ? (
        <p className="alert alert--error" role="alert">
          {loadErr}
        </p>
      ) : null}

      <section className="report-section">
        <h2>Existing users</h2>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Email</th>
                <th>Name</th>
                <th>Type</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((u) => (
                <tr key={u.userId}>
                  <td>{u.userId}</td>
                  <td>{u.email}</td>
                  <td>{u.name}</td>
                  <td>{u.userType}</td>
                  <td>
                    {u.createdAt
                      ? new Date(u.createdAt).toLocaleDateString()
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="report-section">
        <h2>Create user</h2>
        <form className="stack-form admin-user-form" onSubmit={onCreate}>
          <label htmlFor="auEmail">Email</label>
          <input
            id="auEmail"
            type="email"
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <label htmlFor="auName">Name</label>
          <input
            id="auName"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <label htmlFor="auPass">Temporary password</label>
          <input
            id="auPass"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
          />
          <label htmlFor="auRole">Role</label>
          <select
            id="auRole"
            value={role}
            onChange={(e) => setRole(e.target.value)}
          >
            <option value="student">Student</option>
            <option value="teacher">Teacher</option>
            <option value="sysadmin">Sysadmin</option>
          </select>
          {role === "student" && (
            <>
              <label htmlFor="auMajor">Major</label>
              <input
                id="auMajor"
                value={major}
                onChange={(e) => setMajor(e.target.value)}
                required
              />
            </>
          )}
          {role === "teacher" && (
            <>
              <label htmlFor="auDept">Department</label>
              <input
                id="auDept"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                required
              />
            </>
          )}
          <button type="submit" className="btn btn--primary">
            Create user
          </button>
        </form>
        {formErr ? (
          <p className="alert alert--error" role="alert">
            {formErr}
          </p>
        ) : null}
        {okMsg ? (
          <p className="alert alert--success" role="status">
            {okMsg}
          </p>
        ) : null}
      </section>

      <section className="report-section">
        <h2>Delete user</h2>
        <p className="muted">Enter the email of the account you want to permanently delete.</p>
        <form className="stack-form admin-user-form" onSubmit={onDelete}>
          <label htmlFor="delEmail">Email</label>
          <input
            id="delEmail"
            type="email"
            value={deleteEmail}
            onChange={(e) => setDeleteEmail(e.target.value)}
            required
          />
          <button type="submit" className="btn btn--danger">
            Delete user
          </button>
        </form>
        {deleteErr ? (
          <p className="alert alert--error" role="alert">
            {deleteErr}
          </p>
        ) : null}
        {deleteOkMsg ? (
          <p className="alert alert--success" role="status">
            {deleteOkMsg}
          </p>
        ) : null}
      </section>
    </div>
  );
}