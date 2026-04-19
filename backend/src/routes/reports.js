import { Router } from "express";
import { getPool } from "../db/pool.js";

const router = Router();

function requireSession(req, res, next) {
  if (req.session.userId === undefined) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  next();
}

router.get("/forum-summary", requireSession, async (req, res) => {
  const pool = getPool();
  if (!pool) {
    return res.status(503).json({ error: "Database required for reports" });
  }
  try {
    const [rows] = await pool.query(`
      SELECT
        ci.courseInstructorId AS forumId,
        c.courseCode,
        c.title AS courseTitle,
        u.name AS instructorName,
        COUNT(DISTINCT r.ratingId) AS ratingCount,
        ROUND(AVG(r.score), 2) AS avgScoreOneToTen,
        COUNT(DISTINCT dp.postId) AS postCount
      FROM CourseInstructor ci
      JOIN Course c ON c.courseCode = ci.courseCode
      JOIN Teacher t ON t.userId = ci.teacherId
      JOIN User u ON u.userId = t.userId
      LEFT JOIN Rating r ON r.courseInstructorId = ci.courseInstructorId
      LEFT JOIN DiscussionPost dp ON dp.courseInstructorId = ci.courseInstructorId
      GROUP BY ci.courseInstructorId, c.courseCode, c.title, u.name
      ORDER BY c.courseCode
    `);
    const out = rows.map((r) => ({
      forumId: r.forumId,
      courseCode: r.courseCode,
      courseTitle: r.courseTitle,
      instructorName: r.instructorName,
      ratingCount: Number(r.ratingCount) || 0,
      avgScoreOneToTen: r.avgScoreOneToTen != null ? Number(r.avgScoreOneToTen) : null,
      avgOutOfFive:
        r.avgScoreOneToTen != null ? Number(r.avgScoreOneToTen) / 2 : null,
      postCount: Number(r.postCount) || 0,
    }));
    return res.json(out);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Could not build forum summary report" });
  }
});

router.get("/ratings-by-semester", requireSession, async (req, res) => {
  const pool = getPool();
  if (!pool) {
    return res.status(503).json({ error: "Database required for reports" });
  }
  try {
    const [rows] = await pool.query(`
      SELECT
        CONCAT(s.term, ' ', s.year) AS semesterLabel,
        s.term,
        s.year,
        COUNT(*) AS ratingCount,
        ROUND(AVG(r.score), 2) AS avgScoreOneToTen
      FROM Rating r
      JOIN Semester s ON s.semesterId = r.semesterId
      GROUP BY s.semesterId, s.term, s.year
      ORDER BY s.year DESC,
        CASE s.term WHEN 'Spring' THEN 1 WHEN 'Summer' THEN 2 WHEN 'Fall' THEN 3 ELSE 4 END
    `);
    return res.json(
      rows.map((r) => ({
        semesterLabel: r.semesterLabel,
        ratingCount: Number(r.ratingCount),
        avgScoreOneToTen: Number(r.avgScoreOneToTen),
        avgOutOfFive: Number(r.avgScoreOneToTen) / 2,
      })),
    );
  } catch (e) {
    console.error(e);
    return res
      .status(500)
      .json({ error: "Could not build semester ratings report" });
  }
});

export default router;
