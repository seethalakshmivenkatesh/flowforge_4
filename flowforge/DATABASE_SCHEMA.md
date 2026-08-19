# FlowForge Database Schema

MongoDB via Mongoose. All timestamps (`createdAt`/`updatedAt`) are automatic (`{ timestamps: true }`).

## User
| Field | Type | Notes |
|---|---|---|
| name | String | required |
| email | String | required, unique, indexed |
| password | String | hashed with bcrypt, `select: false` |
| avatar | String | |
| role | Enum | `Admin`, `Project Manager`, `Member` |
| resetPasswordToken / resetPasswordExpires | String / Date | `select: false` |

## Project
| Field | Type | Notes |
|---|---|---|
| name | String | required |
| description | String | |
| status | Enum | `Planning`, `In Progress`, `On Hold`, `Completed` — indexed |
| priority | Enum | `Low`, `Medium`, `High`, `Critical` |
| startDate / dueDate | Date | |
| owner | ObjectId → User | required, indexed |
| members | [ObjectId → User] | |
| progress | Number | 0–100 |
| archived | Boolean | |

Text index on `name` + `description` for search.

## Task
| Field | Type | Notes |
|---|---|---|
| title | String | required |
| description | String | |
| project | ObjectId → Project | required, indexed |
| assignee | ObjectId → User | indexed |
| reporter | ObjectId → User | required |
| status | Enum | `Todo`, `In Progress`, `Review`, `Done` — indexed |
| priority | Enum | `Low`, `Medium`, `High`, `Critical` |
| dueDate | Date | |
| labels | [String] | |
| attachments | [{filename, url, uploadedAt}] | |
| comments | [{author → User, text, createdAt}] | subdocuments |
| checklist | [{text, done}] | subdocuments |

Text index on `title` + `description`.

## Workflow
| Field | Type | Notes |
|---|---|---|
| name | String | required |
| description | String | |
| project | ObjectId → Project | required, indexed |
| createdBy | ObjectId → User | required |
| trigger.type | Enum | see trigger list in API docs |
| conditions | [{field, operator, value}] | AND semantics |
| actions | [{type, params}] | executed in order |
| enabled | Boolean | indexed |
| webhookToken | String | unique, sparse — set when trigger is `Webhook Received` |
| executionCount | Number | |
| lastExecutedAt | Date | |

## WorkflowExecution
| Field | Type | Notes |
|---|---|---|
| workflow | ObjectId → Workflow | indexed |
| triggerEvent | String | internal event name that fired this run |
| status | Enum | `Success`, `Failed`, `Running` — indexed |
| startedAt / finishedAt | Date | |
| durationMs | Number | |
| actionsExecuted | [String] | action types that ran successfully |
| errorMessage | String | |
| context | Mixed | taskId/projectId snapshot |

## Notification
| Field | Type | Notes |
|---|---|---|
| user | ObjectId → User | required, indexed |
| type | Enum | see notification types in API docs |
| message | String | required |
| link | String | frontend route to deep-link to |
| read | Boolean | indexed |

## ActivityLog
| Field | Type | Notes |
|---|---|---|
| project | ObjectId → Project | indexed |
| actor | ObjectId → User | |
| action | String | human-readable, e.g. "Seetha assigned Task A to Arun" |
| meta | Mixed | optional structured detail |

---

## Relationships

```
User ──owns/participates──▶ Project ──contains──▶ Task ──has──▶ Comments (embedded)
Project ──has──▶ Workflow ──has──▶ WorkflowExecution
User ──receives──▶ Notification
Project / User ──generates──▶ ActivityLog
```

## Indexes

- `User.email` — unique
- `Project.status`, `Project.owner`, text index on name/description
- `Task.project`, `Task.assignee`, `Task.status`, text index on title/description
- `Workflow.project`, `Workflow.enabled`, `Workflow.webhookToken` (unique, sparse)
- `WorkflowExecution.workflow`, `WorkflowExecution.status`
- `Notification.user`, `Notification.read`
- `ActivityLog.project`
