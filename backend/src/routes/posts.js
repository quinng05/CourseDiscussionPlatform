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

export default router;