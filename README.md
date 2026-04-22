# Course Discussion Platform

A web app for students and instructors to discuss courses and leave ratings. Built with React + Vite (frontend) and Node/Express + MySQL (backend).

---

## Prerequisites

Before you start, make sure you have the following installed:

- **Node.js** v18 or later — [nodejs.org](https://nodejs.org)
- **npm** v9 or later (comes with Node)
- **MySQL** 8.0 or later — [dev.mysql.com/downloads](https://dev.mysql.com/downloads/mysql/)

To verify your versions:

```bash
node -v
npm -v
mysql --version
```

---

## 1. Install Dependencies

From the root of the project, run:

```bash
npm install
```

This installs dependencies for the root, frontend, and backend all at once (npm workspaces).

---

## 2. Set Up the Database

### Create the database

Open a MySQL shell (replace `root` with your MySQL username if different):

```bash
mysql -u root -p
```

Then run:

```sql
CREATE DATABASE coursediscussionplatform;
EXIT;
```

### Load the schema

From the root of the project:

```bash
mysql -u root -p coursediscussionplatform < backend/db/schema.sql
```

This creates all the tables: `User`, `Student`, `Teacher`, `SysAdmin`, `Course`, `Semester`, `CourseInstructor`, `Rating`, and `DiscussionPost`.

### Load sample data

```bash
mysql -u root -p < backend/db/sample/sample_data.sql
```

This populates the database with:
- 20 courses (CS, MATH, CHEM, PHYS, ENGL, ENGE)
- 20 users (students, teachers, and sysadmins)
- 5 semesters (Spring 2025, Fall 2025, Spring 2026, Summer 2026, Fall 2026)
- 5 course forums (CS4604, CS3214, MATH1226, ENGL1105, CHEM1035)
- 8 ratings and 5 discussion posts

> **To reload sample data at any point** (wipes and re-seeds everything):
> ```bash
> mysql -u root -p < backend/db/sample/sample_data.sql
> ```
>
> **To wipe all data without re-seeding:**
> ```bash
> mysql -u root -p < backend/db/sample/clear_samples.sql
> ```

---

## 3. Configure Environment Variables

Copy the example environment file into the backend directory:

```bash
cp backend/.env.example backend/.env
```

Open `backend/.env` and fill in your MySQL credentials:

```env
PORT=3000
SESSION_SECRET=use-a-long-random-string-in-production
CLIENT_ORIGIN=http://localhost:5173

DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password_here
DB_NAME=coursediscussionplatform
```

- **`DB_USER`** — your MySQL username (commonly `root` for local dev)
- **`DB_PASSWORD`** — your MySQL password (leave blank if you have none set)
- **`SESSION_SECRET`** — can be any string for local development

> **No database?** You can omit (or comment out) all four `DB_*` variables to run in demo mode. The app will serve mock forum and post data from memory. Login accepts any credentials and signup/change-password are disabled. The sample accounts in the table below still work in demo mode.

---

## 4. Run the App

From the root of the project:

```bash
npm run dev
```

This starts both the frontend and backend at the same time:

| Service  | URL                    |
|----------|------------------------|
| Frontend | http://localhost:5173  |
| Backend  | http://localhost:3000  |

Open **http://localhost:5173** in your browser. The frontend proxies all `/api` requests to the backend automatically — no extra configuration needed.

Both servers watch for file changes and reload automatically.

---

## Accounts, sign-up, and passwords

- **Sign in** uses `POST /api/login` with email, password, and the correct role for that account.
- **Self-service sign-up** (`/signup` in the UI, `POST /api/signup`) is limited to **student** and **teacher** accounts and requires a running MySQL database. Passwords must be at least **8** characters and are stored with **bcrypt**.
- **Change password** (`/account/password`, `POST /api/change-password`) verifies the current password, then stores the new one with bcrypt (database required).
- **Sysadmin user creation** (`/admin/users`, `GET`/`POST /api/users`) lists users and creates **student**, **teacher**, or **sysadmin** rows in a single transaction (sysadmin session required).
- **Reporting** (`/reports`, `GET /api/reports/forum-summary` and `GET /api/reports/ratings-by-semester`) returns SQL aggregates for forums and semesters (authenticated; database required).

See [docs/API.md](docs/API.md) for a concise route list.

---

## Sample Accounts

These accounts are included in the sample data and can be used to log in:

| Email                      | Password        | Role     |
|----------------------------|-----------------|----------|
| quinng05@vt.edu            | FireFly!88      | Student  |
| mmle04@vt.edu              | Sunrise#42      | Student  |
| professorjohndoe@vt.edu    | OceanWave$31    | Teacher  |
| professorjanedoe@vt.edu    | ThunderBolt!64  | Teacher  |
| sysadmin1@vt.edu           | CrimsonTide!83  | SysAdmin |

---

## Project Structure

```
CourseDiscussionPlatform/
├── docs/              # Extra documentation (e.g. API overview)
├── reports/           # Written report PDFs / deliverables (optional)
├── roles/             # Per-member contribution notes (see Roles.md)
├── frontend/          # React + Vite app (port 5173)
│   └── src/
│       ├── layout/    # Shared shell (nav + outlet)
│       ├── pages/     # Home, Login, Signup, Forum, Reports, Admin, …
│       └── auth/      # Auth context and hooks
├── backend/           # Express API server (port 3000)
│   ├── src/
│   │   ├── routes/    # auth, forums, posts, users, reports
│   │   ├── db/        # MySQL connection pool (pool.js)
│   │   └── mockStore.js  # In-memory mock data for demo mode
│   └── db/
│       ├── schema.sql           # Table definitions
│       └── sample/
│           ├── sample_data.sql  # Wipes and re-seeds all data
│           └── clear_samples.sql  # Wipes all data only
├── server/            # Legacy directory (unused — superseded by backend/)
├── Roles.md           # Index of team role files under roles/
└── package.json       # Root workspace config (run everything from here)
```
