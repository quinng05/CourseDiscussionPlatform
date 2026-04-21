import { useCallback, useEffect, useState } from "react";
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
  return new Date(ts).toLocaleString("en-US", {
    timeZone: "America/New_York",
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function scoreLabel(score) {
  if (score === null || score === undefined) return "";
  const half = score / 2;
  const full = Math.floor(half);
  const hasH = half % 1 >= 0.5;
  return `${"★".repeat(full)}${hasH ? "½" : ""} (${score}/10)`;
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

    const postRes = await fetch(`/api/posts/${post.postId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ postText: text || post.text || "" }),
    });
    if (!postRes.ok) {
      window.alert("Could not save edit.");
      return;
    }

    if (hasRating && editScore) {
      const ratingRes = await fetch(`/api/ratings/${post.ratingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ score: Number(editScore) }),
      });
      if (!ratingRes.ok) {
        window.alert("Text saved, but could not update score.");
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
        <button
          type="button"
          className="reply-btn"
          onClick={() => setReplyOpenId(post.postId)}
        >
          Reply
        </button>
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

  const loadAll = useCallback(async () => {
    if (!Number.isFinite(forumId)) {
      navigate("/", { replace: true });
      return;
    }
    const requests = [
      fetch(`/api/forums/${forumId}`, { credentials: "include" }),
      fetch(`/api/forums/${forumId}/posts`, { credentials: "include" }),
      fetch(`/api/forums/${forumId}/my-rating`, { credentials: "include" }),
    ];
    const [fr, pr, mr] = await Promise.all(requests);
    if (!fr.ok) {
      navigate("/", { replace: true });
      return;
    }
    setForum(await fr.json());
    setPosts(pr.ok ? await pr.json() : []);
    setMyRating(mr.ok ? await mr.json() : null);
  }, [forumId, navigate]);

  useEffect(() => {
    if (!Number.isFinite(forumId)) {
      navigate("/", { replace: true });
      return;
    }
    let cancelled = false;
    (async () => {
      const [fr, pr, mr] = await Promise.all([
        fetch(`/api/forums/${forumId}`, { credentials: "include" }),
        fetch(`/api/forums/${forumId}/posts`, { credentials: "include" }),
        fetch(`/api/forums/${forumId}/my-rating`, { credentials: "include" }),
      ]);
      if (cancelled) return;
      if (!fr.ok) {
        navigate("/", { replace: true });
        return;
      }
      setForum(await fr.json());
      setPosts(pr.ok ? await pr.json() : []);
      setMyRating(mr.ok ? await mr.json() : null);
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
        <div id="postList">
          {myRating && (
            <MyRatingCard
              key={myRating.ratingId}
              rating={myRating}
              forumId={forumId}
              onChanged={loadAll}
            />
          )}
          {posts.map((p) => (
            <PostItem
              key={p.postId}
              post={p}
              forumId={forumId}
              userId={user?.userId}
              onPosted={loadAll}
              replyOpenId={replyOpenId}
              setReplyOpenId={setReplyOpenId}
            />
          ))}
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
