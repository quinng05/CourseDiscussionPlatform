import { Router } from "express";
import bcrypt from "bcrypt";
import { getPool } from "../db/pool.js";

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

router.get("/", requireSession, requireSysadmin, async (req, res) => {
  const pool = getPool();
  if (!pool) {
    return res.status(503).json({ error: "Database required" });
  }
  try {
    const [rows] = await pool.query(
      `SELECT userId, email, name, userType, createdAt
       FROM \`User\`
       ORDER BY userType, name`,
    );
    return res.json(rows);
  } catch (e) {
    if (e.code === "ER_NO_SUCH_TABLE") {
      try {
        const [rows2] = await pool.query(
          `SELECT userId, email, name, userType, createdAt
           FROM \`user\`
           ORDER BY userType, name`,
        );
        return res.json(rows2);
      } catch (e2) {
        console.error(e2);
        return res.status(500).json({ error: "Could not list users" });
      }
    }
    console.error(e);
    return res.status(500).json({ error: "Could not list users" });
  }
});

router.post("/", requireSession, requireSysadmin, async (req, res) => {
  const pool = getPool();
  if (!pool) {
    return res.status(503).json({ error: "Database required" });
  }

  const { email, password, name, role, major, department } = req.body || {};
  const em = String(email || "").trim().toLowerCase();
  const nm = String(name || "").trim();
  const pw = String(password || "");
  const rl = String(role || "").toLowerCase().trim();

  if (!em || !pw || !nm || !rl) {
    return res
      .status(400)
      .json({ error: "email, password, name, and role are required" });
  }
  if (!["student", "teacher", "sysadmin"].includes(rl)) {
    return res.status(400).json({ error: "role must be student, teacher, or sysadmin" });
  }
  if (rl === "student" && !String(major || "").trim()) {
    return res.status(400).json({ error: "major is required for students" });
  }
  if (rl === "teacher" && !String(department || "").trim()) {
    return res.status(400).json({ error: "department is required for teachers" });
  }
  if (pw.length < 8) {
    return res.status(400).json({ error: "password must be at least 8 characters" });
  }

  const passwordHash = await bcrypt.hash(pw, 10);
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [ins] = await conn.query(
      `INSERT INTO \`User\` (email, name, passwordHash, userType)
       VALUES (?, ?, ?, ?)`,
      [em, nm, passwordHash, rl],
    );
    const userId = ins.insertId;

    if (rl === "student") {
      await conn.query(
        "INSERT INTO Student (userId, major) VALUES (?, ?)",
        [userId, String(major).trim()],
      );
    } else if (rl === "teacher") {
      await conn.query(
        "INSERT INTO Teacher (userId, department) VALUES (?, ?)",
        [userId, String(department).trim()],
      );
    } else {
      await conn.query("INSERT INTO SysAdmin (userId) VALUES (?)", [userId]);
    }

    await conn.commit();
    return res.status(201).json({
      userId,
      email: em,
      name: nm,
      userType: rl,
    });
  } catch (e) {
    await conn.rollback();
    if (e.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ error: "Email already registered" });
    }
    if (e.code === "ER_NO_SUCH_TABLE") {
      return res.status(500).json({ error: "User table not found; check schema" });
    }
    console.error(e);
    return res.status(500).json({ error: "Could not create user" });
  } finally {
    conn.release();
  }
});

export default router;
