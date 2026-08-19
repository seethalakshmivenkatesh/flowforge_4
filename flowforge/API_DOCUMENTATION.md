# FlowForge API Documentation

Base URL: `http://localhost:5000/api`

All authenticated routes require an `Authorization: Bearer <token>` header. All responses follow the shape:

```json
{ "success": true, "message": "...", "data": { ... } }
```
or on error:
```json
{ "success": false, "message": "..." }
```

---

## Auth — `/api/auth`

| Method | Route | Auth | Description |
|---|---|---|---|
| POST | `/register` | No | Register a new user. Body: `name, email, password, role?` |
| POST | `/login` | No | Log in. Body: `email, password` |
| POST | `/logout` | Yes | Log out (client discards token) |
| GET | `/me` | Yes | Get current user |
| PUT | `/profile` | Yes | Update `name` / `avatar` |
| PUT | `/change-password` | Yes | Body: `currentPassword, newPassword` |
| POST | `/forgot-password` | No | Body: `email`. Returns a dev-mode reset token (no email service configured) |
| POST | `/reset-password/:token` | No | Body: `password` |

## Projects — `/api/projects`

| Method | Route | Description |
|---|---|---|
| GET | `/` | List projects (query: `status, priority, owner, search, archived`) |
| POST | `/` | Create project |
| GET | `/:id` | Get project + task status counts |
| PUT | `/:id` | Update project |
| DELETE | `/:id` | Delete project (cascades to its tasks) |
| PUT | `/:id/archive` | Toggle archive |
| POST | `/:id/members` | Add member. Body: `userId` |
| DELETE | `/:id/members/:userId` | Remove member |
| GET | `/:id/activity` | Project activity log |

## Tasks — `/api/tasks`

| Method | Route | Description |
|---|---|---|
| GET | `/` | List tasks (query: `project, status, priority, assignee, label, dueBefore, dueAfter, search`) |
| POST | `/` | Create task |
| GET | `/:id` | Get task |
| PUT | `/:id` | Update task (status changes trigger workflows) |
| DELETE | `/:id` | Delete task |
| POST | `/:id/comments` | Add comment. Body: `text` |
| PUT | `/:id/checklist` | Replace checklist. Body: `checklist: [{text, done}]` |

## Workflows — `/api/workflows`

| Method | Route | Description |
|---|---|---|
| GET | `/` | List workflows (query: `project, enabled, triggerType`) |
| POST | `/` | Create workflow: `{ name, project, trigger: {type}, conditions: [], actions: [] }` |
| GET | `/:id` | Get workflow |
| PUT | `/:id` | Update workflow |
| DELETE | `/:id` | Delete workflow + its execution history |
| POST | `/:id/toggle` | Enable/disable |
| POST | `/:id/test` | Run immediately against a task (body: `taskId?`) |
| GET | `/:id/executions` | Execution history (query: `status`) |

### Trigger types
`Task Created`, `Task Updated`, `Task Completed`, `Task Status Changed`, `Task Assigned`, `Task Overdue`, `Project Created`, `Project Completed`, `Comment Added`, `Webhook Received`

### Condition fields / operators
Fields: `priority, status, assignee, project, dueDate`
Operators: `equals, notEquals, contains, before, after`
Conditions are combined with **AND** semantics.

### Action types
`updateTask, assignTask, changeTaskStatus, sendNotification, addComment, createTask, updateProject, sendWebhook`

## Webhooks — `/api/webhooks`

| Method | Route | Description |
|---|---|---|
| POST | `/:workflowId` | Trigger a `Webhook Received` workflow. Requires `x-webhook-token` header (or `?token=`) matching the workflow's `webhookToken`. |

## Notifications — `/api/notifications`

| Method | Route | Description |
|---|---|---|
| GET | `/` | List notifications + unread count |
| PUT | `/read-all` | Mark all as read |
| PUT | `/:id/read` | Mark one as read |

## Dashboard — `/api/dashboard`

| Method | Route | Description |
|---|---|---|
| GET | `/summary` | Project/task counts, recent activity, upcoming deadlines |
| GET | `/charts` | Data for all 4 dashboard charts |
| GET | `/analytics` | Completion rates, workflow success/failure percentages |

## Users — `/api/users`

| Method | Route | Description |
|---|---|---|
| GET | `/` | List users (query: `search`) |

## Search — `/api/search`

| Method | Route | Description |
|---|---|---|
| GET | `/?q=term` | Search across projects, tasks, users, workflows |

## Health

| Method | Route | Description |
|---|---|---|
| GET | `/api/health` | Returns `{ success: true, message: "FlowForge API is running" }` |

---

## Socket.IO Events

Connect with `auth: { userId }`. Join a project room via `socket.emit('joinProject', projectId)`.

**Emitted by server:** `taskCreated`, `taskUpdated`, `taskDeleted`, `taskAssigned`, `taskStatusChanged`, `projectUpdated`, `notificationCreated`, `workflowExecuted`
