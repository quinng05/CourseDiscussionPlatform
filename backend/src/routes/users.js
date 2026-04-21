import { Router } from "express";
import bcrypt from "bcrypt";
import { getPool } from "../db/pool.js";
import * as mockStore from "../mockStore.js";

const router = Router();

function isDatabaseUnavailableError(e) {
  const code = e && typeof e === "object" ? e.code : undefined;
  return code === "ECONNREFUSED" || code === "ENOTFOUND" || code === "ER_ACCESS_DENIED_ERROR";
}

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
    return res.json(mockStore.getDemoUsers());
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
        if (isDatabaseUnavailableError(e2)) {
          return res.json(mockStore.getDemoUsers());
        }
        console.error(e2);
        return res.status(500).json({ error: "Could not list users" });
      }
    }
    if (isDatabaseUnavailableError(e)) {
      return res.json(mockStore.getDemoUsers());
    }
    console.error(e);
    return res.status(500).json({ error: "Could not list users" });
  }
});

router.post("/", requireSession, requireSysadmin, async (req, res) => {
  const pool = getPool();
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

  if (!pool) {
    const row = mockStore.addDemoUser({ email: em, name: nm, role: rl });
    return res.status(201).json(row);
  }

  const passwordHash = await bcrypt.hash(pw, 10);
  let conn;
  try {
    conn = await pool.getConnection();
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
    if (conn) {
      await conn.rollback();
    }
    if (e.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ error: "Email already registered" });
    }
    if (e.code === "ER_NO_SUCH_TABLE") {
      return res.status(500).json({ error: "User table not found; check schema" });
    }
    if (isDatabaseUnavailableError(e)) {
      const row = mockStore.addDemoUser({ email: em, name: nm, role: rl });
      return res.status(201).json(row);
    }
    console.error(e);
    return res.status(500).json({ error: "Could not create user" });
  } finally {
    conn?.release();
  }
});

export default router;
