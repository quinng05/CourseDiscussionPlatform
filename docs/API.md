# HTTP API overview

Base URL: same origin as the web app, under `/api`. The Vite dev server proxies `/api` to the Express backend.

Unless noted, JSON request bodies use `Content-Type: application/json`. The session cookie (`cdp.sid`) is **httpOnly**; from the browser, send `credentials: "include"` on `fetch`.

## Authentication

| Method | Path | Auth | Description |
|--------|------|------|---------------|
| POST | `/api/login` | No | Body: `email`, `password`, `role` (`student` \| `teacher` \| `sysadmin`). Sets session. |
| POST | `/api/logout` | No | Destroys session. |
| GET | `/api/session` | No | Returns `{ userId, name, role }` or **401**. |
| POST | `/api/signup` | No | Self-register **student** or **teacher** only. Body: `email`, `password`, `name`, `role`, and `major` (students) or `department` (teachers). Password minimum length **8**. Requires MySQL. |
| POST | `/api/change-password` | Session | Body: `currentPassword`, `newPassword` (min **8**). Requires MySQL. |
| DELETE | `/api/delete-account` | Session | Body: `email`, `password`, `role`. Deletes the row only if it matches the **logged-in** user. |

## Forums and posts

| Method | Path | Auth | Description |
|--------|------|------|---------------|
| GET | `/api/forums` | Session | List forums (summary). |
| GET | `/api/forums/:id` | Session | Forum detail. |
| POST | `/api/forums` | Sysadmin | Create forum. |
| PUT | `/api/forums/:id` | Sysadmin | Update forum. |
| DELETE | `/api/forums/:id` | Sysadmin | Delete forum. |
| GET | `/api/forums/:id/posts` | Session | Threaded posts. |
| POST | `/api/posts` | Session | Reply (requires `parentPostId`). |
| PUT | `/api/posts/:postId` | Session | Edit own post. |
| DELETE | `/api/posts/:postId` | Session | Delete own post. |
| POST | `/api/ratings` | Session | Student rating/review. |

## Administration and reporting

| Method | Path | Auth | Description |
|--------|------|------|---------------|
| GET | `/api/users` | Sysadmin | List users (`userId`, `email`, `name`, `userType`, `createdAt`). |
| POST | `/api/users` | Sysadmin | Create any role; same password and subtype rules as sign-up. |
| GET | `/api/reports/forum-summary` | Session | Per-forum aggregates: rating count, average score (1–10), post count. |
| GET | `/api/reports/ratings-by-semester` | Session | Ratings grouped by semester. |

Endpoints that read or write the MySQL schema return **503** when the database pool is not configured (demo mode without `DB_*`).
