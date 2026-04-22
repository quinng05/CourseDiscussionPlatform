import { Router } from "express";
import { getPool } from "../db/pool.js";
import * as mockStore from "../mockStore.js";

const router = Router();

function requireSession(req, res, next) {
  if (req.session.userId === undefined) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  next();
}

// Reply to an existing post
router.post("/posts", requireSession, async (req, res) => {
  const { courseInstructorId, parentPostId, postText } = req.body || {};
  const forumId = Number(courseInstructorId);
  const text = String(postText || "").trim();
  if (!forumId || !text) {
    return res.status(400).json({ error: "courseInstructorId and postText required" });
  }
  const pid = parentPostId != null ? Number(parentPostId) : null;
  if (!pid) return res.status(400).json({ error: "parentPostId required for reply" });

  const pool = getPool();
  if (!pool) {
    const reply = mockStore.addReply(forumId, pid, {
      authorName: req.session.name || "You",
      text,
    });
    if (!reply) return res.status(404).json({ error: "Parent post not found" });
    return res.status(201).json(reply);
  }

  try {
    const [result] = await pool.query(
      `INSERT INTO DiscussionPost (postText, courseInstructorId, authorId, parentPostId)
       VALUES (?, ?, ?, ?)`,
      [text, forumId, req.session.userId, pid]
    );
    return res.status(201).json({ postId: result.insertId, postText: text, parentPostId: pid });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Could not save reply" });
  }
});

// Get all orphaned ratings for a forum (no linked DiscussionPost), excluding the current user's own
router.get("/forums/:courseInstructorId/ratings", requireSession, async (req, res) => {
  const forumId = Number(req.params.courseInstructorId);
  if (!Number.isFinite(forumId)) return res.status(400).json({ error: "Invalid forum id" });

  const pool = getPool();
  if (!pool) return res.json([]);

  try {
    const [rows] = await pool.query(
      `SELECT r.ratingId, r.score, r.createdAt, r.semesterId, s.term, s.year, u.name AS authorName
       FROM Rating r
       LEFT JOIN DiscussionPost dp ON r.ratingId = dp.ratingId
       LEFT JOIN Semester s ON r.semesterId = s.semesterId
       JOIN User u ON r.studentId = u.userId
       WHERE r.courseInstructorId = ? AND r.studentId != ? AND dp.postId IS NULL
       ORDER BY r.createdAt ASC`,
      [forumId, req.session.userId]
    );
    return res.json(rows);
  } catch (e) {
    console.error(e);
    return res.json([]);
  }
});

// Get the current user's orphaned rating (no linked DiscussionPost) for a forum
router.get("/forums/:courseInstructorId/my-rating", requireSession, async (req, res) => {
  const forumId = Number(req.params.courseInstructorId);
  if (!Number.isFinite(forumId)) return res.status(400).json({ error: "Invalid forum id" });

  const pool = getPool();
  if (!pool) return res.json(null);

  try {
    const [rows] = await pool.query(
      `SELECT r.ratingId, r.score, r.createdAt, r.semesterId, s.term, s.year
       FROM Rating r
       LEFT JOIN DiscussionPost dp ON r.ratingId = dp.ratingId
       LEFT JOIN Semester s ON r.semesterId = s.semesterId
       WHERE r.courseInstructorId = ? AND r.studentId = ? AND dp.postId IS NULL
       LIMIT 1`,
      [forumId, req.session.userId]
    );
    return res.json(rows[0] || null);
  } catch (e) {
    console.error(e);
    return res.json(null);
  }
});

// Add review text to an orphaned rating, converting it to a full DiscussionPost
router.post("/ratings/:ratingId/post", requireSession, async (req, res) => {
  const ratingId = Number(req.params.ratingId);
  const text = String(req.body?.postText || "").trim();
  if (!Number.isFinite(ratingId) || !text) {
    return res.status(400).json({ error: "postText required" });
  }

  const pool = getPool();
  if (!pool) return res.status(503).json({ error: "No database connection" });

  try {
    const [[rating]] = await pool.query(
      `SELECT r.ratingId, r.courseInstructorId, r.semesterId
       FROM Rating r
       LEFT JOIN DiscussionPost dp ON r.ratingId = dp.ratingId
       WHERE r.ratingId = ? AND r.studentId = ? AND dp.postId IS NULL`,
      [ratingId, req.session.userId]
    );
    if (!rating) {
      return res.status(404).json({ error: "Rating not found or already has a post" });
    }
    const [result] = await pool.query(
      `INSERT INTO DiscussionPost (postText, courseInstructorId, authorId, ratingId, semesterId)
       VALUES (?, ?, ?, ?, ?)`,
      [text, rating.courseInstructorId, req.session.userId, ratingId, rating.semesterId]
    );
    return res.status(201).json({ postId: result.insertId });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Could not create post" });
  }
});

// Update an orphaned rating's score (author only)
router.put("/ratings/:ratingId", requireSession, async (req, res) => {
  const ratingId = Number(req.params.ratingId);
  const score = Number(req.body?.score);
  if (!Number.isFinite(ratingId) || !Number.isFinite(score) || score < 1 || score > 10) {
    return res.status(400).json({ error: "score 1–10 required" });
  }

  const pool = getPool();
  if (!pool) return res.status(503).json({ error: "No database connection" });

  try {
    const [result] = await pool.query(
      `UPDATE Rating SET score = ? WHERE ratingId = ? AND studentId = ?`,
      [score, ratingId, req.session.userId]
    );
    if (result.affectedRows === 0) return res.status(404).json({ error: "Rating not found or not yours" });
    return res.json({ ratingId, score });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Could not update rating" });
  }
});

// Delete an orphaned rating (author only)
router.delete("/ratings/:ratingId", requireSession, async (req, res) => {
  const ratingId = Number(req.params.ratingId);
  if (!Number.isFinite(ratingId)) return res.status(400).json({ error: "Invalid rating id" });

  const pool = getPool();
  if (!pool) return res.status(503).json({ error: "No database connection" });

  try {
    const [result] = await pool.query(
      `DELETE FROM Rating WHERE ratingId = ? AND studentId = ?`,
      [ratingId, req.session.userId]
    );
    if (result.affectedRows === 0) return res.status(404).json({ error: "Rating not found or not yours" });
    return res.sendStatus(204);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Could not delete rating" });
  }
});

// Create a new rating + top level post
router.post("/ratings", requireSession, async (req, res) => {
  if (req.session.role !== "student") {
    return res.status(403).json({ error: "Students only" });
  }
  const { courseInstructorId, score, reviewText, semesterLabel, anonymous } = req.body || {};
  const forumId = Number(courseInstructorId);
  const s = Number(score);
  if (!forumId || !Number.isFinite(s) || s < 1 || s > 10) {
    return res.status(400).json({ error: "courseInstructorId and score 1–10 required" });
  }
  const text = String(reviewText || "").trim();

  const pool = getPool();
  if (!pool) {
    const post = mockStore.addTopLevelPost(forumId, {
      authorName: anonymous ? "Anonymous" : req.session.name || "You",
      anonymous: Boolean(anonymous),
      semester: semesterLabel || null,
      score: s,
      text,
    });
    return res.status(201).json(post);
  }

  try {
    // Look up semesterId from the label e.g. "Spring 2026"
    let semesterId = null;
    if (semesterLabel) {
      const parts = semesterLabel.trim().split(" ");
      const term = parts[0];        // e.g. "Spring"
      const year = Number(parts[1]); // e.g. 2026
      const [semRows] = await pool.query(
        `SELECT semesterId FROM Semester WHERE term = ? AND year = ? LIMIT 1`,
        [term, year]
      );
      if (semRows.length === 0) {
        return res.status(400).json({ error: `Semester "${semesterLabel}" not found in database` });
      }
      semesterId = semRows[0].semesterId;
    } else {
      return res.status(400).json({ error: "semesterLabel is required" });
    }

    // Insert rating
    const [ratingResult] = await pool.query(
      `INSERT INTO Rating (score, courseInstructorId, studentId, semesterId)
       VALUES (?, ?, ?, ?)`,
      [s, forumId, req.session.userId, semesterId, text]
    );
    const ratingId = ratingResult.insertId;

    // Insert discussion post linked to rating
    const [postResult] = await pool.query(
      `INSERT INTO DiscussionPost (postText, courseInstructorId, authorId, ratingId, semesterId)
       VALUES (?, ?, ?, ?, ?)`,
      [text, forumId, req.session.userId, ratingId, semesterId]
    );

    return res.status(201).json({ postId: postResult.insertId, ratingId, score: s, text });
  } catch (e) {
    if (e.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ error: "You have already rated this course for this semester" });
    }
    console.error(e);
    return res.status(500).json({ error: "Could not save rating" });
  }
});

// Edit a post (author only)
router.put("/posts/:postId", requireSession, async (req, res) => {
  const postId = Number(req.params.postId);
  const text = String(req.body?.postText || "").trim();
  if (!Number.isFinite(postId) || !text) {
    return res.status(400).json({ error: "postText required" });
  }

  const pool = getPool();
  if (!pool) return res.status(503).json({ error: "No database connection" });

  try {
    const [result] = await pool.query(
      `UPDATE DiscussionPost SET postText = ? WHERE postId = ? AND authorId = ?`,
      [text, postId, req.session.userId]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Post not found or not yours" });
    }
    return res.json({ postId, postText: text });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Could not update post" });
  }
});

// Delete a post (author only)
// DiscussionPost.ratingId → Rating has no cascade from post deletion, so we
// must look up and delete the linked rating ourselves after removing the post.
router.delete("/posts/:postId", requireSession, async (req, res) => {
  const postId = Number(req.params.postId);
  if (!Number.isFinite(postId)) {
    return res.status(400).json({ error: "Invalid post id" });
  }

  const pool = getPool();
  if (!pool) return res.status(503).json({ error: "No database connection" });

  try {
    // Fetch the linked ratingId before deletion
    const [[post]] = await pool.query(
      `SELECT ratingId FROM DiscussionPost WHERE postId = ? AND authorId = ?`,
      [postId, req.session.userId]
    );
    if (!post) {
      return res.status(404).json({ error: "Post not found or not yours" });
    }

    await pool.query(
      `DELETE FROM DiscussionPost WHERE postId = ?`,
      [postId]
    );

    // Clean up the orphaned rating if one was attached
    if (post.ratingId != null) {
      await pool.query(`DELETE FROM Rating WHERE ratingId = ?`, [post.ratingId]);
    }

    return res.sendStatus(204);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Could not delete post" });
  }
});

export default router;