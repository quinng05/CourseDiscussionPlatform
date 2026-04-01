import { Router } from "express";
import * as mockStore from "../mockStore.js";

const router = Router();

function requireSession(req, res, next) {
  if (req.session.userId === undefined) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  next();
}

router.post("/posts", requireSession, (req, res) => {
  const { courseInstructorId, parentPostId, postText } = req.body || {};
  const forumId = Number(courseInstructorId);
  const text = String(postText || "").trim();
  if (!forumId || !text) {
    return res
      .status(400)
      .json({ error: "courseInstructorId and postText required" });
  }
  const pid = parentPostId != null ? Number(parentPostId) : null;
  if (pid) {
    const reply = mockStore.addReply(forumId, pid, {
      authorName: req.session.name || "You",
      text,
    });
    if (!reply) return res.status(404).json({ error: "Parent post not found" });
    return res.status(201).json(reply);
  }
  return res.status(400).json({ error: "parentPostId required for reply" });
});

router.post("/ratings", requireSession, (req, res) => {
  if (req.session.role !== "student") {
    return res.status(403).json({ error: "Students only" });
  }
  const { courseInstructorId, score, reviewText, semesterLabel, anonymous } =
    req.body || {};
  const forumId = Number(courseInstructorId);
  const s = Number(score);
  if (!forumId || !Number.isFinite(s) || s < 1 || s > 10) {
    return res
      .status(400)
      .json({ error: "courseInstructorId and score 1–10 required" });
  }
  const text = String(reviewText || "").trim();
  const post = mockStore.addTopLevelPost(forumId, {
    authorName: anonymous ? "Anonymous" : req.session.name || "You",
    anonymous: Boolean(anonymous),
    semester: semesterLabel || null,
    score: s,
    text,
  });
  return res.status(201).json(post);
});

export default router;
