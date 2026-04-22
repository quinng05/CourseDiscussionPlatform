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

function requireSysadmin(req, res, next) {
  if (req.session.role !== "sysadmin") {
    return res.status(403).json({ error: "Sysadmin only" });
  }
  next();
}

async function getForumById(pool, id) {
  const [rows] = await pool.query(
    `
      SELECT ci.courseInstructorId AS id,
             c.courseCode AS code,
             c.title AS title,
             u.name AS instructor,
             COALESCE(AVG(r.score), 0) AS avgRating,
             COUNT(r.ratingId) AS ratingCount
      FROM CourseInstructor ci
      JOIN Course c ON ci.courseCode = c.courseCode
      JOIN Teacher t ON ci.teacherId = t.userId
      JOIN User u ON t.userId = u.userId
      LEFT JOIN Rating r ON ci.courseInstructorId = r.courseInstructorId
      WHERE ci.courseInstructorId = ?
      GROUP BY ci.courseInstructorId, c.courseCode, c.title, u.name
    `,
    [id],
  );
  const row = rows[0];
  if (!row) return null;
  return {
    id: row.id,
    code: row.code,
    title: row.title,
    instructor: row.instructor,
    avgRating: Number(row.avgRating) / 2,
    ratingCount: Number(row.ratingCount),
  };
}

router.get("/:courseInstructorId/posts", requireSession, async (req, res) => {
  const id = Number(req.params.courseInstructorId);
  if (!Number.isFinite(id)) {
    return res.status(400).json({ error: "Invalid forum id" });
  }

  const pool = getPool();
  if (!pool) {
    return res.json(mockStore.getPosts(id));
  }

  try {
    const [rows] = await pool.query(
      `SELECT
        dp.postId,
        dp.postText AS text,
        dp.createdAt,
        dp.parentPostId,
        dp.ratingId,
        dp.authorId,
        dp.semesterId,
        COALESCE(u.name, 'Unknown') AS authorName,
        r.score,
        CASE WHEN s.term IS NOT NULL THEN CONCAT(s.term, ' ', s.year) ELSE NULL END AS semester
       FROM DiscussionPost dp
       LEFT JOIN User u ON dp.authorId = u.userId
       LEFT JOIN Rating r ON dp.ratingId = r.ratingId
       LEFT JOIN Semester s ON dp.semesterId = s.semesterId
       WHERE dp.courseInstructorId = ?
       ORDER BY dp.createdAt ASC`,
      [id]
    );
    console.log("Posts rows:", rows);

    // Build nested tree (top level posts with replies)
    const postMap = {};
    const topLevel = [];

    for (const row of rows) {
      postMap[row.postId] = { ...row, replies: [] };
    }
    for (const row of rows) {
      if (row.parentPostId) {
        if (postMap[row.parentPostId]) {
          postMap[row.parentPostId].replies.push(postMap[row.postId]);
        }
      } else {
        topLevel.push(postMap[row.postId]);
      }
    }

    return res.json(topLevel);
  } catch (e) {
    console.error(e);
    return res.json(mockStore.getPosts(id));
  }
});

router.get("/", requireSession, async (req, res) => {
  const pool = getPool();
  if (!pool) {
    return res.json(mockStore.getForums());
  }
  try {
    const [rows] = await pool.query(`
      SELECT ci.courseInstructorId AS id,
             c.courseCode AS code,
             c.title AS title,
             u.name AS instructor,
             COALESCE(AVG(r.score), 0) AS avgRating,
             COUNT(r.ratingId) AS ratingCount
      FROM CourseInstructor ci
      JOIN Course c ON ci.courseCode = c.courseCode
      JOIN Teacher t ON ci.teacherId = t.userId
      JOIN User u ON t.userId = u.userId
      LEFT JOIN Rating r ON ci.courseInstructorId = r.courseInstructorId
      GROUP BY ci.courseInstructorId, c.courseCode, c.title, u.name
      ORDER BY c.courseCode
    `);
    const mapped = rows.map((r) => ({
      id: r.id,
      code: r.code,
      title: r.title,
      instructor: r.instructor,
      avgRating: Number(r.avgRating) / 2,
      ratingCount: Number(r.ratingCount),
    }));
    mockStore.setForumsFromDb(mapped);
    return res.json(mapped);
  } catch (e) {
    console.error(e);
    return res.json(mockStore.getForums());
  }
});

router.get("/:courseInstructorId", requireSession, async (req, res) => {
  const id = Number(req.params.courseInstructorId);
  if (!Number.isFinite(id)) {
    return res.status(400).json({ error: "Invalid forum id" });
  }
  const pool = getPool();
  if (!pool) {
    const f = mockStore.getForums().find((x) => Number(x.id) === id);
    if (!f) return res.status(404).json({ error: "Forum not found" });
    return res.json(f);
  }
  try {
    const forum = await getForumById(pool, id);
    if (!forum) return res.status(404).json({ error: "Forum not found" });
    return res.json(forum);
  } catch (e) {
    console.error(e);
    const f = mockStore.getForums().find((x) => Number(x.id) === id);
    if (!f) return res.status(404).json({ error: "Forum not found" });
    return res.json(f);
  }
});

router.post("/", requireSession, requireSysadmin, async (req, res) => {
  const { code, title, instructor } = req.body || {};
  const courseCode = String(code || "").trim();
  const courseTitle = String(title || "").trim();
  const instructorName = String(instructor || "").trim();
  if (!courseCode || !courseTitle || !instructorName) {
    return res
      .status(400)
      .json({ error: "code, title, and instructor required" });
  }

  const pool = getPool();
  if (!pool) {
    const row = mockStore.addForum({
      code: courseCode,
      title: courseTitle,
      instructor: instructorName,
    });
    return res.status(201).json(row);
  }

  try {
    const [teachers] = await pool.query(
      `SELECT t.userId FROM Teacher t
       JOIN User u ON u.userId = t.userId
       WHERE u.name = ? LIMIT 1`,
      [instructorName],
    );
    const teacher = teachers[0];
    if (!teacher) {
      return res.status(400).json({ error: "No teacher found with that name" });
    }

    await pool.query(
      `INSERT INTO Course (courseCode, title, description, credits)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE title = VALUES(title), description = VALUES(description)`,
      [courseCode, courseTitle, courseTitle, 3],
    );

    const [ins] = await pool.query(
      `INSERT INTO CourseInstructor (courseCode, teacherId, createdByUserId)
       VALUES (?, ?, ?)`,
      [courseCode, teacher.userId, req.session.userId],
    );

    const newId = ins.insertId;
    const row = mockStore.addForum({
      id: newId,
      code: courseCode,
      title: courseTitle,
      instructor: instructorName,
    });
    return res.status(201).json(row);
  } catch (e) {
    if (e.code === "ER_DUP_ENTRY") {
      return res
        .status(409)
        .json({ error: "Forum already exists for this course and instructor" });
    }
    console.error(e);
    return res.status(500).json({ error: "Could not create forum" });
  }
});

router.put(
  "/:courseInstructorId",
  requireSession,
  requireSysadmin,
  async (req, res) => {
    const id = Number(req.params.courseInstructorId);
    if (!Number.isFinite(id)) {
      return res.status(400).json({ error: "Invalid forum id" });
    }
    const { code, title, instructor } = req.body || {};
    const courseCode = String(code || "").trim();
    const courseTitle = String(title || "").trim();
    const instructorName = String(instructor || "").trim();
    if (!courseCode || !courseTitle || !instructorName) {
      return res
        .status(400)
        .json({ error: "code, title, and instructor required" });
    }

    const pool = getPool();
    if (!pool) {
      const updated = mockStore.updateForum(id, {
        code: courseCode,
        title: courseTitle,
        instructor: instructorName,
      });
      if (!updated) return res.status(404).json({ error: "Forum not found" });
      return res.json(updated);
    }

    try {
      const [forums] = await pool.query(
        "SELECT courseCode, teacherId FROM CourseInstructor WHERE courseInstructorId = ?",
        [id],
      );
      const forum = forums[0];
      if (!forum) return res.status(404).json({ error: "Forum not found" });

      const [teachers] = await pool.query(
        `SELECT t.userId FROM Teacher t
         JOIN User u ON u.userId = t.userId
         WHERE u.name = ? LIMIT 1`,
        [instructorName],
      );
      const teacher = teachers[0];
      if (!teacher) {
        return res.status(400).json({ error: "No teacher found with that name" });
      }

      await pool.query(
        `INSERT INTO Course (courseCode, title, description, credits)
         VALUES (?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           title = VALUES(title),
           description = VALUES(description)`,
        [courseCode, courseTitle, courseTitle, 3],
      );

      await pool.query(
        `UPDATE CourseInstructor
         SET courseCode = ?, teacherId = ?
         WHERE courseInstructorId = ?`,
        [courseCode, teacher.userId, id],
      );

      if (forum.courseCode !== courseCode) {
        const [usage] = await pool.query(
          "SELECT COUNT(*) AS count FROM CourseInstructor WHERE courseCode = ?",
          [forum.courseCode],
        );
        if (Number(usage[0]?.count || 0) === 0) {
          await pool.query("DELETE FROM Course WHERE courseCode = ?", [
            forum.courseCode,
          ]);
        }
      }

      const updatedForum = await getForumById(pool, id);
      mockStore.updateForum(id, {
        code: courseCode,
        title: courseTitle,
        instructor: instructorName,
      });
      return res.json(updatedForum);
    } catch (e) {
      if (e.code === "ER_DUP_ENTRY") {
        return res
          .status(409)
          .json({ error: "Forum already exists for this course and instructor" });
      }
      console.error(e);
      return res.status(500).json({ error: "Could not update forum" });
    }
  },
);

router.delete(
  "/:courseInstructorId",
  requireSession,
  requireSysadmin,
  async (req, res) => {
    const id = Number(req.params.courseInstructorId);
    if (!Number.isFinite(id)) {
      return res.status(400).json({ error: "Invalid forum id" });
    }

    const pool = getPool();
    if (!pool) {
      const deleted = mockStore.deleteForum(id);
      if (!deleted) return res.status(404).json({ error: "Forum not found" });
      return res.sendStatus(204);
    }

    try {
      const [rows] = await pool.query(
        "SELECT courseCode FROM CourseInstructor WHERE courseInstructorId = ?",
        [id],
      );
      const row = rows[0];
      if (!row) return res.status(404).json({ error: "Forum not found" });

      await pool.query(
        "DELETE FROM CourseInstructor WHERE courseInstructorId = ?",
        [id],
      );

      const [usage] = await pool.query(
        "SELECT COUNT(*) AS count FROM CourseInstructor WHERE courseCode = ?",
        [row.courseCode],
      );
      if (Number(usage[0]?.count || 0) === 0) {
        await pool.query("DELETE FROM Course WHERE courseCode = ?", [row.courseCode]);
      }

      mockStore.deleteForum(id);
      return res.sendStatus(204);
    } catch (e) {
      console.error(e);
      return res.status(500).json({ error: "Could not delete forum" });
    }
  },
);

export default router;