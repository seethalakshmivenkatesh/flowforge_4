# FlowForge

**FlowForge** is a full-stack workflow automation and project management platform, built with the MERN stack (MongoDB, Express, React, Node.js). It combines project management, task tracking, a Kanban board, team collaboration, and a Zapier-style visual workflow automation engine into one product.

---

## ✨ Features

- **Authentication** — JWT auth, bcrypt password hashing, protected routes, role-based access (Admin / Project Manager / Member), forgot/reset password flow, profile management.
- **Dashboard** — live stats, Recharts visualizations (tasks over time, status distribution, project progress, team workload), recent activity, upcoming deadlines.
- **Projects** — full CRUD, members, statuses, priorities, progress tracking, archiving, per-project activity feed.
- **Tasks** — full CRUD, comments, checklists, labels, assignment, due dates.
- **Kanban Board** — drag-and-drop columns (Todo → In Progress → Review → Done), backed by real API calls and real-time sync.
- **Workflow Automation (core feature)** — build `Trigger → Condition → Action` rules with a visual React Flow builder. Backend engine listens on a domain event bus, evaluates conditions (AND semantics), and executes actions (8 types) — entirely server-side.
- **Webhooks** — external systems can POST to `/api/webhooks/:workflowId` (with a token) to trigger a workflow.
- **Real-time** — Socket.IO powers live task updates, notifications, and workflow execution events.
- **Notifications** — in-app, real-time, with an unread badge and notification center.
- **Analytics** — completion rates, overdue tasks, workflow success/failure rates.
- **Global Search** — search projects, tasks, users, and workflows from the top nav.

This is a **real working application** — there is no mocked data or fake API responses. Every screen is backed by MongoDB through the Express REST API.

---

## 🧱 Tech Stack

**Frontend:** React 18, Vite, Tailwind CSS, React Router, Axios, React Hook Form, Recharts, React Flow, Socket.IO client, Lucide icons.

**Backend:** Node.js, Express, MongoDB + Mongoose, JWT, bcryptjs, Socket.IO, Helmet, express-rate-limit, express-mongo-sanitize.

---

## 📁 Project Structure

```
flowforge/
├── backend/
│   ├── src/
│   │   ├── config/          # DB connection
│   │   ├── controllers/     # Route handlers / business logic
│   │   ├── middleware/      # auth, role check, error handler
│   │   ├── models/          # Mongoose schemas
│   │   ├── routes/          # Express routers
│   │   ├── services/        # overdue task checker, etc.
│   │   ├── events/          # app-wide event bus
│   │   ├── workflow/        # engine, condition evaluator, action executor
│   │   ├── sockets/         # Socket.IO wiring
│   │   └── server.js
│   ├── seed.js -> src/seed.js
│   ├── .env.example
│   └── package.json
└── frontend/
    ├── src/
    │   ├── api/              # axios instance + endpoint definitions
    │   ├── components/       # reusable UI components
    │   ├── context/          # Auth & Socket context providers
    │   ├── layouts/          # Sidebar, Navbar, AppLayout
    │   ├── pages/             # route-level pages
    │   ├── features/workflow-builder/
    │   └── App.jsx / main.jsx
    ├── .env.example
    └── package.json
```

---

## 🚀 Setup Instructions

### Prerequisites
- Node.js 18+
- MongoDB running locally (or a free MongoDB Atlas cluster) — no paid services required.

### 1. Backend

```bash
cd backend
cp .env.example .env
# edit .env and set MONGO_URI / JWT_SECRET as needed
npm install
npm run seed     # optional: creates demo users, a project, tasks, and the demo workflow
npm run dev       # starts the API on http://localhost:5000
```

### 2. Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev       # starts the app on http://localhost:5173
```

### 3. Log in

If you ran `npm run seed`, use any of these (password: `password123`):

| Role             | Email                  |
|------------------|-------------------------|
| Admin            | admin@flowforge.dev     |
| Project Manager  | pm@flowforge.dev        |
| Member           | divya@flowforge.dev     |
| Member           | karthik@flowforge.dev   |

Otherwise, register a new account from the Register page.

---

## 🔐 Environment Variables

**backend/.env**
```
MONGO_URI=mongodb://127.0.0.1:27017/flowforge
JWT_SECRET=replace_this_with_a_long_random_secret
JWT_EXPIRES_IN=7d
PORT=5000
CLIENT_URL=http://localhost:5173
NODE_ENV=development
```

**frontend/.env**
```
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

---

## 🧩 How the Workflow Engine Works

1. Controllers (`taskController`, `projectController`, etc.) emit domain events onto a Node `EventEmitter`-based event bus (e.g. `task:statusChanged`, `task:created`, `project:completed`).
2. `workflow/engine.js` listens for these events, maps them to `Workflow.trigger.type` values, and queries MongoDB for enabled workflows on the relevant project matching that trigger.
3. For each matching workflow, `workflow/conditions.js` evaluates all conditions with **AND** semantics (e.g. `priority equals High`).
4. If conditions pass, `workflow/actions.js` executes each action in order (update task, assign task, change status, send notification, add comment, create task, update project, or send an outbound webhook).
5. Every run is recorded as a `WorkflowExecution` document with status (`Success` / `Failed` / `Running`), duration, actions executed, and any error — visible on the Execution History page.
6. Real-time events (`workflowExecuted`, `notificationCreated`, etc.) are pushed to connected clients over Socket.IO, scoped by project or user room.

A demo workflow — **"High Priority Task Completion"** — is created by the seed script: *when a task's status changes and its priority is High, notify all project members.*

---

## 📡 API Overview

See [`API_DOCUMENTATION.md`](./API_DOCUMENTATION.md) for the full endpoint reference.

## 🗄️ Database Schema

See [`DATABASE_SCHEMA.md`](./DATABASE_SCHEMA.md) for model fields and relationships.

---

## 🛡️ Security

- Passwords hashed with bcrypt (10 salt rounds)
- JWT-based stateless auth with Bearer tokens
- Helmet for secure HTTP headers
- express-rate-limit on all `/api` routes
- express-mongo-sanitize to prevent NoSQL injection
- CORS restricted to `CLIENT_URL`
- Centralized error handler that never leaks stack traces in production
- Webhook endpoints protected by a per-workflow random token (`x-webhook-token` header or `?token=`)

---

## 🩺 Troubleshooting

### "bad auth : Authentication failed" / login or register fails right away

This is a **MongoDB Atlas connection error**, not a bug in the app — it means the backend couldn't authenticate to your Atlas cluster, so every request that touches the database fails. Check the backend terminal (`npm run dev`); it will now print exactly which of these is wrong:

1. **Database Access → Database Users** — the username/password in `MONGO_URI` must match a **Database User** you created in Atlas, not your Atlas *login* email/password. Create one under Database Access if you haven't.
2. **Special characters in the password** — if your DB user's password contains `@ # % : /` etc., URL-encode them in the connection string (e.g. `p@ss` → `p%40ss`), or reset the password to something alphanumeric.
3. **Network Access → IP Access List** — your current machine's IP must be allowed. For local development, add `0.0.0.0/0` (allow from anywhere) or click "Add Current IP Address".
4. **Cluster paused** — free-tier Atlas clusters auto-pause after inactivity. Resume it from the Atlas dashboard if needed.
5. Double-check `MONGO_URI` in `backend/.env` includes the database name and matches exactly what Atlas gives you under **Connect → Drivers**.

### "Cannot reach the server" on login/register

The frontend can't reach the backend at all. Confirm the backend is running (`npm run dev` in `backend/`) on port 5000, and that `VITE_API_URL` in `frontend/.env` points to `http://localhost:5000/api`.

### Login "works" but immediately redirects back to /login

You likely have a stale token in the browser from a previous database. Open DevTools → Application → Local Storage → clear `ff_token` and `ff_user`, then log in again.

---



- No paid services are used anywhere — email delivery for password resets is simulated by returning the reset token directly in the API response (clearly marked as dev-mode) since no SMTP provider is configured.
- All Mongoose models include appropriate indexes (email, project references, assignee, status fields) for query performance.
