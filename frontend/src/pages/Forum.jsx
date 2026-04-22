import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../auth/useAuth.js";

const SEMESTER_OPTIONS = [
  { value: "1", label: "Spring 2026" },
  { value: "2", label: "Fall 2025" },
  { value: "3", label: "Spring 2025" },
  { value: "4", label: "Fall 2024" },
];

const SCORE_OPTIONS = [
  { value: "", label: "-- select --" },
  { value: "1", label: "1  (½★)" },
  { value: "2", label: "2  (1★)" },
  { value: "3", label: "3  (1½★)" },
  { value: "4", label: "4  (2★)" },
  { value: "5", label: "5  (2½★)" },
  { value: "6", label: "6  (3★)" },
  { value: "7", label: "7  (3½★)" },
  { value: "8", label: "8  (4★)" },
  { value: "9", label: "9  (4½★)" },
  { value: "10", label: "10 (5★)" },
];

function formatDate(ts) {
  if (!ts) return "";
  return new Date(ts).toLocaleDateString("en-US", {
    timeZone: "America/New_York",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function scoreLabel(score) {
  if (score === null || score === undefined) return "";
  const half = score / 2;
  const full = Math.floor(half);
  const hasH = half % 1 >= 0.5;
  return `${"★".repeat(full)}${hasH ? "½" : ""} (${score}/10)`;
}

function OtherRatingCard({ rating }) {
  const semesterLabel = rating.term && rating.year ? `${rating.term} ${rating.year}` : "";
  return (
    <div className="post other-rating-card">
      <div className="post-meta">
        <strong>{rating.authorName}</strong>
        {semesterLabel ? ` • ${semesterLabel}` : ""}
        {rating.createdAt ? ` • ${formatDate(rating.createdAt)}` : ""}
      </div>
      <div className="post-score">{scoreLabel(rating.score)}</div>
    </div>
  );
}

function MyRatingCard({ rating, onChanged }) {
  const [editing, setEditing] = useState(false);
  const [editScore, setEditScore] = useState(String(rating.score));
  const [editText, setEditText] = useState("");
  const semesterLabel = rating.term && rating.year ? `${rating.term} ${rating.year}` : "";

  async function saveEdit() {
    const score = Number(editScore);
    if (!score) return;
    const text = editText.trim();

    const scoreRes = await fetch(`/api/ratings/${rating.ratingId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ score }),
    });
    if (!scoreRes.ok) {
      window.alert("Could not update rating.");
      return;
    }

    if (text) {
      const postRes = await fetch(`/api/ratings/${rating.ratingId}/post`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ postText: text }),
      });
      if (!postRes.ok) {
        window.alert("Score saved, but could not attach review text.");
      }
    }

    setEditing(false);
    onChanged();
  }

  async function deleteRating() {
    if (!window.confirm("Delete your rating? This cannot be undone.")) return;
    const r = await fetch(`/api/ratings/${rating.ratingId}`, {
      method: "DELETE",
      credentials: "include",
    });
    if (!r.ok) {
      window.alert("Could not delete rating.");
      return;
    }
    onChanged();
  }

  return (
    <div className="post my-rating-card">
      <div className="post-meta">
        <strong>You</strong>
        {semesterLabel ? ` • ${semesterLabel}` : ""}
        {rating.createdAt ? ` • ${formatDate(rating.createdAt)}` : ""}
        <span className="my-rating-badge">your rating</span>
      </div>
      {editing ? (
        <div className="inline-edit-form">
          <select
            value={editScore}
            onChange={(e) => setEditScore(e.target.value)}
          >
            {SCORE_OPTIONS.filter((o) => o.value !== "").map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <textarea
            placeholder="Add a review (optional)"
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
          />
          <div className="form-btns">
            <button type="button" onClick={saveEdit}>Save</button>
            <button type="button" onClick={() => { setEditing(false); setEditScore(String(rating.score)); setEditText(""); }}>Cancel</button>
          </div>
        </div>
      ) : (
        <div className="post-score">{scoreLabel(rating.score)}</div>
      )}
      <div className="post-actions">
        {!editing && (
          <button type="button" className="edit-btn" onClick={() => setEditing(true)}>Edit</button>
        )}
        <button type="button" className="delete-btn" onClick={deleteRating}>Delete</button>
      </div>
    </div>
  );
}

function PostItem({ post, forumId, userId, onPosted, replyOpenId, setReplyOpenId }) {
  const [repliesOpen, setRepliesOpen] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState("");
  const [editScore, setEditScore] = useState("");
  const nReplies = post.replies?.length || 0;
  const formVisible = replyOpenId === post.postId;
  const isOwner = post.authorId === userId;
  const hasRating = post.ratingId != null;

  async function submitReply() {
    const text = replyText.trim();
    if (!text) {
      window.alert("Reply cannot be empty.");
      return;
    }
    const r = await fetch("/api/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        courseInstructorId: forumId,
        parentPostId: post.postId,
        postText: text,
      }),
    });
    if (!r.ok) {
      window.alert("Could not post reply.");
      return;
    }
    setReplyText("");
    setReplyOpenId(null);
    onPosted();
  }

  async function saveEdit() {
    const text = editText.trim();
    if (!hasRating && !text) {
      window.alert("Post text cannot be empty.");
      return;
    }

    // Only send text update if there is text to save
    if (text) {
      const postRes = await fetch(`/api/posts/${post.postId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ postText: text }),
      });
      if (!postRes.ok) {
        window.alert("Could not save edit.");
        return;
      }
    }

    // Update score if this post has a linked rating and score changed
    if (hasRating && editScore && Number(editScore) !== post.score) {
      const ratingRes = await fetch(`/api/ratings/${post.ratingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ score: Number(editScore) }),
      });
      if (!ratingRes.ok) {
        window.alert("Could not update score.");
        return;
      }
    }

    setEditing(false);
    onPosted();
  }

  async function deletePost() {
    if (!window.confirm("Delete this post? This cannot be undone.")) return;
    const r = await fetch(`/api/posts/${post.postId}`, {
      method: "DELETE",
      credentials: "include",
    });
    if (!r.ok) {
      window.alert("Could not delete post.");
      return;
    }
    onPosted();
  }

  return (
    <div className="post" data-post-id={post.postId}>
      <div className="post-meta">
        <strong>{post.anonymous ? "Anonymous" : post.authorName}</strong>
        {post.semester ? ` • ${post.semester}` : ""} • {formatDate(post.createdAt)}
      </div>
      {post.score != null && (
        <div className="post-score">{scoreLabel(post.score)}</div>
      )}
      {editing ? (
        <div className="inline-edit-form">
          {hasRating && (
            <select
              value={editScore}
              onChange={(e) => setEditScore(e.target.value)}
            >
              {SCORE_OPTIONS.filter((o) => o.value !== "").map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          )}
          <textarea
            placeholder={hasRating ? "Review text (optional)" : ""}
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
          />
          <div className="form-btns">
            <button type="button" onClick={saveEdit}>Save</button>
            <button type="button" onClick={() => setEditing(false)}>Cancel</button>
          </div>
        </div>
      ) : (
        post.text ? <div className="post-text">{post.text}</div> : null
      )}
      <div className="post-actions">
        {post.text && (
          <button
            type="button"
            className="reply-btn"
            onClick={() => setReplyOpenId(post.postId)}
          >
            Reply
          </button>
        )}
        {isOwner && !editing && (
          <>
            <button
              type="button"
              className="edit-btn"
              onClick={() => { setEditing(true); setEditText(post.text || ""); setEditScore(post.score != null ? String(post.score) : ""); }}
            >
              Edit
            </button>
            <button
              type="button"
              className="delete-btn"
              onClick={deletePost}
            >
              Delete
            </button>
          </>
        )}
        {nReplies > 0 && (
          <button
            type="button"
            className="replies-toggle"
            onClick={() => setRepliesOpen((o) => !o)}
          >
            {nReplies} repl{nReplies === 1 ? "y" : "ies"}{" "}
            {repliesOpen ? "▲" : "▼"}
          </button>
        )}
      </div>
      {nReplies > 0 && (
        <div className={`replies-list${repliesOpen ? " open" : ""}`}>
          {post.replies.map((r) => (
            <PostItem
              key={r.postId}
              post={r}
              forumId={forumId}
              userId={userId}
              onPosted={onPosted}
              replyOpenId={replyOpenId}
              setReplyOpenId={setReplyOpenId}
            />
          ))}
        </div>
      )}
      <div className={`inline-reply-form${formVisible ? " visible" : ""}`}>
        <textarea
          placeholder="Write a reply..."
          value={replyText}
          onChange={(e) => setReplyText(e.target.value)}
        />
        <div className="form-btns">
          <button type="button" onClick={submitReply}>
            Post reply
          </button>
          <button type="button" onClick={() => setReplyOpenId(null)}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Forum() {
  const { courseInstructorId } = useParams();
  const forumId = Number(courseInstructorId);
  const navigate = useNavigate();
  const { user } = useAuth();
  const [forum, setForum] = useState(null);
  const [posts, setPosts] = useState([]);
  const [replyOpenId, setReplyOpenId] = useState(null);
  const [score, setScore] = useState("");
  const [reviewText, setReviewText] = useState("");
  const [semester, setSemester] = useState("1");
  const [anon, setAnon] = useState(false);
  const [myRating, setMyRating] = useState(null);
  const [otherRatings, setOtherRatings] = useState([]);
  const [sortBy, setSortBy] = useState("date");
  const [sortDir, setSortDir] = useState("desc");
  const [typeFilter, setTypeFilter] = useState("all");
  const [semesterFilter, setSemesterFilter] = useState("all");

  const allItems = useMemo(() => [
    ...(myRating ? [{
      type: "myRating", data: myRating,
      createdAt: myRating.createdAt, score: myRating.score,
      semester: myRating.term && myRating.year ? `${myRating.term} ${myRating.year}` : null,
    }] : []),
    ...otherRatings.map((r) => ({
      type: "otherRating", data: r,
      createdAt: r.createdAt, score: r.score,
      semester: r.term && r.year ? `${r.term} ${r.year}` : null,
    })),
    ...posts.filter((p) => p.parentPostId == null).map((p) => ({
      type: "post", data: p,
      createdAt: p.createdAt, score: p.score ?? null,
      semester: p.semester ?? null,
    })),
  ], [myRating, otherRatings, posts]);

  const semesters = useMemo(() => {
    const seen = new Set();
    return allItems.map((i) => i.semester).filter((s) => s && !seen.has(s) && seen.add(s));
  }, [allItems]);

  const visibleItems = useMemo(() => {
    let items = allItems;
    if (typeFilter === "ratings") {
      items = items.filter((i) => i.type === "myRating" || i.type === "otherRating");
    } else if (typeFilter === "posts") {
      items = items.filter((i) => i.type === "post");
    }
    if (semesterFilter !== "all") {
      items = items.filter((i) => i.semester === semesterFilter);
    }
    return [...items].sort((a, b) => {
      const aVal = sortBy === "score" ? (a.score ?? -1) : (a.createdAt ? new Date(a.createdAt).getTime() : 0);
      const bVal = sortBy === "score" ? (b.score ?? -1) : (b.createdAt ? new Date(b.createdAt).getTime() : 0);
      return sortDir === "asc" ? aVal - bVal : bVal - aVal;
    });
  }, [allItems, typeFilter, semesterFilter, sortBy, sortDir]);

  const loadAll = useCallback(async () => {
    if (!Number.isFinite(forumId)) {
      navigate("/", { replace: true });
      return;
    }
    const [fr, pr, mr, or_] = await Promise.all([
      fetch(`/api/forums/${forumId}`, { credentials: "include" }),
      fetch(`/api/forums/${forumId}/posts`, { credentials: "include" }),
      fetch(`/api/forums/${forumId}/my-rating`, { credentials: "include" }),
      fetch(`/api/forums/${forumId}/ratings`, { credentials: "include" }),
    ]);
    if (!fr.ok) {
      navigate("/", { replace: true });
      return;
    }
    setForum(await fr.json());
    setPosts(pr.ok ? await pr.json() : []);
    setMyRating(mr.ok ? await mr.json() : null);
    setOtherRatings(or_.ok ? await or_.json() : []);
  }, [forumId, navigate]);

  useEffect(() => {
    if (!Number.isFinite(forumId)) {
      navigate("/", { replace: true });
      return;
    }
    let cancelled = false;
    (async () => {
      const [fr, pr, mr, or_] = await Promise.all([
        fetch(`/api/forums/${forumId}`, { credentials: "include" }),
        fetch(`/api/forums/${forumId}/posts`, { credentials: "include" }),
        fetch(`/api/forums/${forumId}/my-rating`, { credentials: "include" }),
        fetch(`/api/forums/${forumId}/ratings`, { credentials: "include" }),
      ]);
      if (cancelled) return;
      if (!fr.ok) {
        navigate("/", { replace: true });
        return;
      }
      setForum(await fr.json());
      setPosts(pr.ok ? await pr.json() : []);
      setMyRating(mr.ok ? await mr.json() : null);
      setOtherRatings(or_.ok ? await or_.json() : []);
    })();
    return () => {
      cancelled = true;
    };
  }, [forumId, navigate]);

  async function submitRating() {
    if (!score) {
      window.alert("Please select a score.");
      return;
    }
    const semLabel =
      SEMESTER_OPTIONS.find((o) => o.value === semester)?.label || "";
    const r = await fetch("/api/ratings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        courseInstructorId: forumId,
        score: Number(score),
        reviewText: reviewText.trim(),
        semesterLabel: semLabel,
        anonymous: anon,
      }),
    });
    if (!r.ok) {
      const err = await r.json().catch(() => ({}));
      window.alert(err.error || "Could not submit.");
      return;
    }
    setScore("");
    setReviewText("");
    setAnon(false);
    await loadAll();
  }

  if (!forum) {
    return <div className="app-loading">Loading…</div>;
  }

  return (
    <div className="forum-page">
      <div className="forum-toolbar">
        <button
          type="button"
          className="back-btn"
          onClick={() => navigate("/")}
        >
          ← Back to forums
        </button>
      </div>

      <div id="forumHeader">
        <h2>
          {forum.title} ({forum.code})
        </h2>
        <div className="sub">with {forum.instructor}</div>
        <div className="avg">
          Average rating:{" "}
          <strong>{Number(forum.avgRating).toFixed(1)} / 5</strong>
          <span style={{ color: "#777" }}> ({forum.ratingCount} ratings)</span>
        </div>
      </div>

      <div id="postsArea">
        <div className="filter-bar">
          <button
            className={`filter-btn${sortBy === "date" ? " active" : ""}`}
            onClick={() => sortBy === "date" ? setSortDir((d) => d === "asc" ? "desc" : "asc") : setSortBy("date")}
          >
            Date {sortBy === "date" ? (sortDir === "asc" ? "↑" : "↓") : ""}
          </button>
          <button
            className={`filter-btn${sortBy === "score" ? " active" : ""}`}
            onClick={() => sortBy === "score" ? setSortDir((d) => d === "asc" ? "desc" : "asc") : setSortBy("score")}
          >
            Score {sortBy === "score" ? (sortDir === "asc" ? "↑" : "↓") : ""}
          </button>

          <div className="filter-sep" />

          <button className={`filter-btn${typeFilter === "all" ? " active" : ""}`} onClick={() => setTypeFilter("all")}>All</button>
          <button className={`filter-btn${typeFilter === "ratings" ? " active" : ""}`} onClick={() => setTypeFilter("ratings")}>Ratings</button>
          <button className={`filter-btn${typeFilter === "posts" ? " active" : ""}`} onClick={() => setTypeFilter("posts")}>Posts</button>

          {semesters.length > 0 && (
            <>
              <div className="filter-sep" />
              <button className={`filter-btn${semesterFilter === "all" ? " active" : ""}`} onClick={() => setSemesterFilter("all")}>All</button>
              {semesters.map((s) => (
                <button
                  key={s}
                  className={`filter-btn${semesterFilter === s ? " active" : ""}`}
                  onClick={() => setSemesterFilter(s)}
                >
                  {s}
                </button>
              ))}
            </>
          )}
        </div>

        <div id="postList">
          {visibleItems.map((item) => {
            if (item.type === "myRating") {
              return <MyRatingCard key="my-rating" rating={item.data} onChanged={loadAll} />;
            }
            if (item.type === "otherRating") {
              return <OtherRatingCard key={item.data.ratingId} rating={item.data} />;
            }
            return (
              <PostItem
                key={item.data.postId}
                post={item.data}
                forumId={forumId}
                userId={user?.userId}
                onPosted={loadAll}
                replyOpenId={replyOpenId}
                setReplyOpenId={setReplyOpenId}
              />
            );
          })}
          {visibleItems.length === 0 && (
            <p className="filter-empty">No items match the current filters.</p>
          )}
        </div>
      </div>

      {user?.role === "student" && (
        <div id="submitPanel">
          <h3>Leave a rating or review</h3>
          <div className="submit-score-row">
            <label htmlFor="scoreSelect">Score (1–10):</label>
            <select
              id="scoreSelect"
              value={score}
              onChange={(e) => setScore(e.target.value)}
            >
              {SCORE_OPTIONS.map((o) => (
                <option key={o.label} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <textarea
            id="reviewText"
            placeholder="Optional: write a review (leave blank to submit score only)"
            value={reviewText}
            onChange={(e) => setReviewText(e.target.value)}
          />
          <div className="submit-options">
            <label htmlFor="semesterSelect">
              Semester:
              <select
                id="semesterSelect"
                value={semester}
                onChange={(e) => setSemester(e.target.value)}
              >
                {SEMESTER_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <input
                type="checkbox"
                checked={anon}
                onChange={(e) => setAnon(e.target.checked)}
              />{" "}
              Anonymous
            </label>
            <button type="button" onClick={submitRating}>
              Submit
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
