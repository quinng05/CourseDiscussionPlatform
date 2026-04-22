import { Router } from "express";
import bcrypt from "bcrypt";
import { getPool } from "../db/pool.js";

const router = Router();

function loginCatchErrorResponse(e) {
  const code = e && typeof e === "object" ? e.code : undefined;
  if (code === "ECONNREFUSED" || code === "ENOTFOUND") {
    return {
      status: 503,
      error:
        "Cannot connect to MySQL. Start your database server and check DB_HOST/DB_PORT in .env, or remove DB_HOST (and related DB_* vars) to use demo login without a database.",
    };
  }
  if (code === "ER_ACCESS_DENIED_ERROR") {
    return {
      status: 503,
      error:
        "Database access denied. Check DB_USER and DB_PASSWORD in .env.",
    };
  }
  const sqlMessage =
    e && typeof e === "object" && e.sqlMessage ? String(e.sqlMessage) : "";
  const msg = e && typeof e === "object" && e.message ? String(e.message) : "";
  return {
    status: 500,
    error: sqlMessage || msg || String(code || "Login failed"),
  };
}

function isDatabaseUnavailableError(e) {
  const code = e && typeof e === "object" ? e.code : undefined;
  return code === "ECONNREFUSED" || code === "ENOTFOUND" || code === "ER_ACCESS_DENIED_ERROR";
}

function asUtf8(value) {
  if (value == null) return "";
  if (Buffer.isBuffer(value)) return value.toString("utf8");
  return String(value);
}

async function verifyPassword(stored, plain) {
  const s = asUtf8(stored);
  const p = asUtf8(plain);
  if (!s) return false;
  if (s.startsWith("$2")) {
    try {
      return await bcrypt.compare(p, s);
    } catch {
      return false;
    }
  }
  return p === s || p === s.trim();
}

function mapUserRow(row) {
  if (!row) return null;
  const lower = Object.fromEntries(
    Object.entries(row).map(([k, v]) => [k.toLowerCase(), v]),
  );
  const passwordHash =
    row.passwordHash ??
    row.passwordhash ??
    lower.passwordhash ??
    row.password_hash ??
    lower.password_hash;
  return {
    userId: row.userId ?? row.userid ?? lower.userid,
    email: asUtf8(row.email ?? lower.email),
    name: asUtf8(row.name ?? lower.name),
    passwordHash,
    userType: asUtf8(
      row.userType ??
        row.usertype ??
        lower.usertype ??
        row.user_type ??
        lower.user_type,
    ),
  };
}

async function findUserByEmail(pool, email) {
  const sql = (table) =>
    `SELECT * FROM ${table} WHERE LOWER(TRIM(\`email\`)) = LOWER(TRIM(?)) LIMIT 1`;
  for (const table of ["`User`", "`user`"]) {
    try {
      const [rows] = await pool.query(sql(table), [email]);
      if (rows[0]) return rows[0];
    } catch (e) {
      if (e.code === "ER_NO_SUCH_TABLE") continue;
      throw e;
    }
  }
  return null;
}

async function getPasswordHashRow(pool, userId) {
  for (const table of ["`User`", "`user`"]) {
    try {
      const [rows] = await pool.query(
        `SELECT passwordHash FROM ${table} WHERE userId = ? LIMIT 1`,
        [userId],
      );
      if (rows[0]) return rows[0];
    } catch (e) {
      if (e.code === "ER_NO_SUCH_TABLE") continue;
      throw e;
    }
  }
  return null;
}

async function updatePasswordForUser(pool, userId, passwordHash) {
  for (const table of ["`User`", "`user`"]) {
    try {
      const [r] = await pool.query(
        `UPDATE ${table} SET passwordHash = ? WHERE userId = ?`,
        [passwordHash, userId],
      );
      if (r.affectedRows > 0) return true;
    } catch (e) {
      if (e.code === "ER_NO_SUCH_TABLE") continue;
      throw e;
    }
  }
  return false;
}

router.post("/login", async (req, res) => {
  const { email, password, role } = req.body || {};
  if (!email || !password || !role) {
    return res
      .status(400)
      .json({ error: "email, password, and role required" });
  }

  const pool = getPool();
  if (!pool) {
    req.session.userId = 0;
    req.session.name = email.split("@")[0] || "User";
    req.session.role = role;
    return res.sendStatus(200);
  }

  const wantRole = String(role).toLowerCase().trim();

  try {
    const raw = await findUserByEmail(pool, email);
    const user = mapUserRow(raw);
    if (!user) return res.status(401).send("Unauthorized");
    const ok = await verifyPassword(user.passwordHash, password);
    if (!ok) return res.status(401).send("Unauthorized");
    if (String(user.userType).toLowerCase() !== wantRole) {
      return res.status(401).send("Unauthorized");
    }

    const sid = Number(user.userId);
    req.session.userId = Number.isFinite(sid) ? sid : 0;
    req.session.name = user.name;
    req.session.role = user.userType;
    return res.sendStatus(200);
  } catch (e) {
    console.error(e);
    if (isDatabaseUnavailableError(e)) {
      req.session.userId = 0;
      req.session.name = String(email).split("@")[0] || "User";
      req.session.role = wantRole;
      return res.sendStatus(200);
    }
    const { status, error } = loginCatchErrorResponse(e);
    return res.status(status).json({ error });
  }
});

router.post("/logout", (req, res) => {
  req.session.destroy(() => {
    res.clearCookie("cdp.sid");
    res.sendStatus(204);
  });
});

router.get("/session", (req, res) => {
  if (req.session.userId === undefined) {
    return res.status(401).json(null);
  }
  res.json({
    userId: req.session.userId,
    name: req.session.name,
    role: req.session.role,
  });
});

/** Self-service registration (student or teacher only). Passwords stored as bcrypt. */
router.post("/signup", async (req, res) => {
  const pool = getPool();
  if (!pool) {
    return res.status(503).json({
      error:
        "Database is required for sign-up. Configure DB_* in backend/.env.",
    });
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
  if (!["student", "teacher"].includes(rl)) {
    return res
      .status(400)
      .json({ error: "Sign-up is only available for student or teacher accounts" });
  }
  if (rl === "student" && !String(major || "").trim()) {
    return res.status(400).json({ error: "major is required for students" });
  }
  if (rl === "teacher" && !String(department || "").trim()) {
    return res
      .status(400)
      .json({ error: "department is required for teachers" });
  }
  if (pw.length < 8) {
    return res.status(400).json({ error: "password must be at least 8 characters" });
  }

  const existing = await findUserByEmail(pool, em);
  if (existing) {
    return res.status(409).json({ error: "An account with this email already exists" });
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
    } else {
      await conn.query(
        "INSERT INTO Teacher (userId, department) VALUES (?, ?)",
        [userId, String(department).trim()],
      );
    }
    await conn.commit();
    return res.status(201).json({ userId, email: em, name: nm, userType: rl });
  } catch (e) {
    await conn.rollback();
    if (e.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ error: "Email already registered" });
    }
    console.error(e);
    return res.status(500).json({ error: "Could not create account" });
  } finally {
    conn.release();
  }
});

router.post("/change-password", async (req, res) => {
  if (req.session.userId === undefined) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  const pool = getPool();
  if (!pool) {
    return res.status(503).json({ error: "Database required to change password" });
  }

  const { currentPassword, newPassword } = req.body || {};
  const cur = String(currentPassword || "");
  const neu = String(newPassword || "");
  if (!cur || !neu) {
    return res
      .status(400)
      .json({ error: "currentPassword and newPassword are required" });
  }
  if (neu.length < 8) {
    return res
      .status(400)
      .json({ error: "newPassword must be at least 8 characters" });
  }

  try {
    const row = await getPasswordHashRow(pool, req.session.userId);
    if (!row) return res.status(404).json({ error: "User not found" });

    const stored =
      row.passwordHash ?? row.passwordhash ?? row.PasswordHash ?? "";
    const ok = await verifyPassword(stored, cur);
    if (!ok) return res.status(401).json({ error: "Current password is incorrect" });

    const hash = await bcrypt.hash(neu, 10);
    const updated = await updatePasswordForUser(pool, req.session.userId, hash);
    if (!updated) {
      return res.status(500).json({ error: "Could not update password" });
    }
    return res.sendStatus(204);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Could not update password" });
  }
});

router.delete("/delete-account", async (req, res) => {
  if (req.session.userId === undefined) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  const pool = getPool();
  if (!pool) {
    return res.status(503).json({ error: "No database connection" });
  }

  const { email, password, role } = req.body || {};
  if (!email) {
    return res.status(400).json({ error: "email is required" });
  }

  try {
    const raw = await findUserByEmail(pool, email);
    const user = mapUserRow(raw);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Sysadmin can delete any account by email only
    if (req.session.role === "sysadmin") {
      for (const table of ["`User`", "`user`"]) {
        try {
          await pool.query(`DELETE FROM ${table} WHERE userId = ?`, [user.userId]);
          break;
        } catch (e) {
          if (e.code === "ER_NO_SUCH_TABLE") continue;
          throw e;
        }
      }
      return res.sendStatus(200);
    }

    // Regular users must verify password and role to delete their own account
    if (Number(user.userId) !== Number(req.session.userId)) {
      return res.status(403).json({ error: "You can only delete your own account" });
    }
    if (!password || !role) {
      return res.status(400).json({ error: "password and role required" });
    }
    const ok = await verifyPassword(user.passwordHash, password);
    if (!ok) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    if (String(user.userType).toLowerCase() !== String(role).toLowerCase().trim()) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    for (const table of ["`User`", "`user`"]) {
      try {
        await pool.query(`DELETE FROM ${table} WHERE userId = ?`, [user.userId]);
        break;
      } catch (e) {
        if (e.code === "ER_NO_SUCH_TABLE") continue;
        throw e;
      }
    }

    req.session.destroy(() => {
      res.clearCookie("cdp.sid");
      res.sendStatus(200);
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Could not delete account" });
  }
});

export default router;
