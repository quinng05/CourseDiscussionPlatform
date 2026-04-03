import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { Router } from "express";
import bcrypt from "bcrypt";
import { getPool } from "../db/pool.js";

const router = Router();

// #region agent log
const AGENT_INGEST =
  "http://127.0.0.1:7243/ingest/018aa5d6-2f3e-4372-8476-b6b91784f640";
const AGENT_LOG_FILE = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../../.cursor/debug.log",
);
function agentLog(payload) {
  const line = JSON.stringify({ ...payload, timestamp: Date.now() }) + "\n";
  try {
    fs.mkdirSync(path.dirname(AGENT_LOG_FILE), { recursive: true });
    fs.appendFileSync(AGENT_LOG_FILE, line);
  } catch {
    /* ignore */
  }
  fetch(AGENT_INGEST, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...payload, timestamp: Date.now() }),
  }).catch(() => {});
}
// #endregion

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
      error: "Database access denied. Check DB_USER and DB_PASSWORD in .env.",
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

/** mysql2 often returns lowercase column names; handle any casing. */
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

/** Seed SQL uses `user`; schema DDL may use `User` — match both on case-sensitive MySQL. */
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

router.post("/login", async (req, res) => {
  const { email, password, role } = req.body || {};
  if (!email || !password || !role) {
    // #region agent log
    agentLog({
      hypothesisId: "H-body",
      location: "auth.js:login",
      message: "login rejected missing fields",
      data: {
        hasEmail: !!email,
        hasPassword: !!password,
        hasRole: !!role,
        contentType: req.headers["content-type"],
      },
    });
    // #endregion
    return res
      .status(400)
      .json({ error: "email, password, and role required" });
  }

  const pool = getPool();
  // #region agent log
  agentLog({
    hypothesisId: "H5",
    location: "auth.js:login",
    message: "pool and client shape",
    data: {
      poolActive: !!pool,
      emailDomain: String(email).includes("@")
        ? String(email).split("@")[1]?.slice(0, 24)
        : "none",
      emailLocalLen: String(email).split("@")[0]?.length ?? 0,
      passwordLen: String(password).length,
      role,
    },
  });
  // #endregion
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
    // #region agent log
    agentLog({
      hypothesisId: "H2",
      location: "auth.js:login:afterLookup",
      message: "db row lookup",
      data: {
        rowFound: !!raw,
        rowKeyCount: raw ? Object.keys(raw).length : 0,
        rowKeySample: raw ? Object.keys(raw).slice(0, 12) : [],
        mappedHasPasswordField: !!(user && user.passwordHash),
        mappedUserType: user?.userType ?? null,
      },
    });
    // #endregion
    if (!user) {
      // #region agent log
      agentLog({
        hypothesisId: "H2",
        location: "auth.js:login",
        message: "outcome 401 noUser",
        data: {},
      });
      // #endregion
      return res.status(401).send("Unauthorized");
    }
    const ok = await verifyPassword(user.passwordHash, password);
    // #region agent log
    agentLog({
      hypothesisId: "H3",
      location: "auth.js:login",
      message: "password verify",
      data: {
        ok,
        storedLooksBcrypt: String(user.passwordHash || "").startsWith("$2"),
      },
    });
    // #endregion
    if (!ok) {
      // #region agent log
      agentLog({
        hypothesisId: "H3",
        location: "auth.js:login",
        message: "outcome 401 badPassword",
        data: {},
      });
      // #endregion
      return res.status(401).send("Unauthorized");
    }
    if (String(user.userType).toLowerCase() !== wantRole) {
      // #region agent log
      agentLog({
        hypothesisId: "H4",
        location: "auth.js:login",
        message: "outcome 401 badRole",
        data: { wantRole, gotType: user.userType },
      });
      // #endregion
      return res.status(401).send("Unauthorized");
    }

    const sid = Number(user.userId);
    req.session.userId = Number.isFinite(sid) ? sid : 0;
    req.session.name = user.name;
    req.session.role = user.userType;
    // #region agent log
    agentLog({
      hypothesisId: "H4-session",
      location: "auth.js:login",
      message: "outcome 200 before send",
      data: { sessionUserId: req.session.userId },
    });
    // #endregion
    return res.sendStatus(200);
  } catch (e) {
    console.error(e);
    // #region agent log
    agentLog({
      hypothesisId: "H1",
      location: "auth.js:login:catch",
      message: "login exception",
      data: {
        code: e?.code,
        name: e?.name,
        errMsg:
          e && typeof e === "object" && "message" in e
            ? String(e.message).slice(0, 200)
            : String(e).slice(0, 200),
        clientError: loginCatchErrorResponse(e).error.slice(0, 120),
      },
    });
    // #endregion
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
  res.json({ name: req.session.name, role: req.session.role });
});

router.delete("/delete-account", async (req, res) => {
  const { email, password, role } = req.body || {};
  if (!email || !password || !role) {
    return res.status(400).json({ error: "email, password, and role required" });
  }

  const pool = getPool();
  if (!pool) {
    return res.status(503).json({ error: "No database connection" });
  }

  try {
    const raw = await findUserByEmail(pool, email);
    const user = mapUserRow(raw);
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    const ok = await verifyPassword(user.passwordHash, password);
    if (!ok) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    if (String(user.userType).toLowerCase() !== String(role).toLowerCase().trim()) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Delete the user — cascades to Student/Teacher/SysAdmin due to ON DELETE CASCADE
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
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Could not delete account" });
  }
});

export default router;
