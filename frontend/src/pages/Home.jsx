import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/useAuth.js";

export default function Home() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [searchType, setSearchType] = useState("title");
  const [searchInput, setSearchInput] = useState("");
  const [forums, setForums] = useState([]);
  const [loadError, setLoadError] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [newCode, setNewCode] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [newInstructor, setNewInstructor] = useState("");

  const loadForums = useCallback(async () => {
    setLoadError(null);
    const r = await fetch("/api/forums", { credentials: "include" });
    if (!r.ok) {
      setLoadError("Could not load forums.");
      return;
    }
    const data = await r.json();
    setForums(Array.isArray(data) ? data : []);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoadError(null);
      const r = await fetch("/api/forums", { credentials: "include" });
      if (cancelled) return;
      if (!r.ok) {
        setLoadError("Could not load forums.");
        return;
      }
      const data = await r.json();
      setForums(Array.isArray(data) ? data : []);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    const q = searchInput.toLowerCase();
    return forums.filter((f) => {
      if (searchType === "code") return f.code.toLowerCase().includes(q);
      if (searchType === "instructor")
        return f.instructor.toLowerCase().includes(q);
      return f.title.toLowerCase().includes(q);
    });
  }, [forums, searchType, searchInput]);

  async function createForum() {
    const code = newCode.trim();
    const title = newTitle.trim();
    const instructor = newInstructor.trim();
    if (!code || !title || !instructor) {
      window.alert("All fields required.");
      return;
    }
    const r = await fetch("/api/forums", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ code, title, instructor }),
    });
    if (!r.ok) {
      const err = await r.json().catch(() => ({}));
      window.alert(err.error || "Could not create forum.");
      return;
    }
    setModalOpen(false);
    setNewCode("");
    setNewTitle("");
    setNewInstructor("");
    await loadForums();
  }

  return (
    <div className="home-page">
      <nav>
        <strong>Course Discussion Platform</strong>
        <span>
          {user?.name} ({user?.role})
        </span>
        <button
          type="button"
          onClick={() => signOut().then(() => navigate("/login"))}
        >
          Sign out
        </button>
      </nav>

      <div className="home-body">
        <h1>Find a course forum</h1>
        {loadError && (
          <p style={{ color: "crimson", marginBottom: 8 }}>{loadError}</p>
        )}

        <div className="search-row">
          <select
            value={searchType}
            onChange={(e) => setSearchType(e.target.value)}
          >
            <option value="title">Title</option>
            <option value="code">Code</option>
            <option value="instructor">Instructor</option>
          </select>
          <input
            type="text"
            placeholder="Search..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </div>

        {user?.role === "sysadmin" && (
          <div id="adminCreate">
            <button type="button" onClick={() => setModalOpen(true)}>
              + Create New Forum
            </button>
          </div>
        )}

        <div id="resultCount">Showing {filtered.length} forum(s)</div>
        <div id="cardList">
          {filtered.map((f) => (
            <div
              key={f.id}
              className="card"
              role="button"
              tabIndex={0}
              onClick={() => navigate(`/forum/${f.id}`)}
              onKeyDown={(e) => e.key === "Enter" && navigate(`/forum/${f.id}`)}
            >
              <div>
                <div className="card-title">
                  {f.title} ({f.code})
                </div>
                <div className="card-sub">
                  with {f.instructor} — {f.ratingCount} ratings
                </div>
              </div>
              <div className="card-rating">
                {Number(f.avgRating).toFixed(1)} / 5
              </div>
            </div>
          ))}
        </div>
        <div id="noResults" className={filtered.length === 0 ? "visible" : ""}>
          No forums match your search.
        </div>
      </div>

      <div
        className={`modal-overlay${modalOpen ? " open" : ""}`}
        role="presentation"
      >
        <div
          className="modal"
          role="dialog"
          aria-modal="true"
          onClick={(e) => e.stopPropagation()}
        >
          <h2>Create New Forum</h2>
          <label>Course Code</label>
          <input
            type="text"
            placeholder="e.g. CS4604"
            value={newCode}
            onChange={(e) => setNewCode(e.target.value)}
          />
          <label>Course Title</label>
          <input
            type="text"
            placeholder="e.g. Intro to Database Mgmt"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
          />
          <label>Instructor Name</label>
          <input
            type="text"
            placeholder="e.g. Dr. Nizamani"
            value={newInstructor}
            onChange={(e) => setNewInstructor(e.target.value)}
          />
          <div className="modal-btns">
            <button type="button" onClick={() => setModalOpen(false)}>
              Cancel
            </button>
            <button type="button" onClick={createForum}>
              Create
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
