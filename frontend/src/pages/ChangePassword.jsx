import { useState } from "react";

export default function ChangePassword() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setMsg("");
    setErr("");
    setBusy(true);
    const res = await fetch("/api/change-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    setBusy(false);
    if (res.status === 204) {
      setCurrentPassword("");
      setNewPassword("");
      setMsg("Password updated.");
      return;
    }
    const j = await res.json().catch(() => ({}));
    setErr(j.error ? String(j.error) : "Could not update password.");
  }

  return (
    <div className="home-body account-page">
      <h1>Change password</h1>
      <p className="muted">
        New passwords must be at least 8 characters. After a successful change, keep using the same email to sign in.
      </p>
      <form className="stack-form" onSubmit={onSubmit}>
        <label htmlFor="cpCur">Current password</label>
        <input
          id="cpCur"
          type="password"
          autoComplete="current-password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          required
        />
        <label htmlFor="cpNew">New password</label>
        <input
          id="cpNew"
          type="password"
          autoComplete="new-password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
          minLength={8}
        />
        <button type="submit" className="btn btn--primary" disabled={busy}>
          {busy ? "Saving…" : "Update password"}
        </button>
      </form>
      {msg ? (
        <p className="alert alert--success" role="status">
          {msg}
        </p>
      ) : null}
      {err ? (
        <p className="alert alert--error" role="alert">
          {err}
        </p>
      ) : null}
    </div>
  );
}
