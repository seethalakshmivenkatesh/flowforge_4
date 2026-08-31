const mongoose = require('mongoose');

// A single condition: field, operator, value
const conditionSchema = new mongoose.Schema(
  {
    field: { type: String, required: true }, // e.g. 'priority', 'status', 'assignee', 'project', 'dueDate'
    operator: { type: String, enum: ['equals', 'notEquals', 'before', 'after', 'contains'], default: 'equals' },
    value: { type: mongoose.Schema.Types.Mixed },
  },
  { _id: false }
);

// A single action to execute
const actionSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: [
        'updateTask',
        'assignTask',
        'changeTaskStatus',
        'sendNotification',
        'addComment',
        'createTask',
        'updateProject',
        'sendWebhook',
      ],
      required: true,
    },
    params: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { _id: false }
);

const workflowSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    trigger: {
      type: {
        type: String,
        enum: [
          'Task Created',
          'Task Updated',
          'Task Completed',
          'Task Status Changed',
          'Task Assigned',
          'Task Overdue',
          'Project Created',
          'Project Completed',
          'Comment Added',
          'Webhook Received',
        ],
        required: true,
      },
    },
    conditions: [conditionSchema],
    actions: [actionSchema],
    enabled: { type: Boolean, default: true, index: true },
    webhookToken: { type: String, unique: true, sparse: true },
    executionCount: { type: Number, default: 0 },
    lastExecutedAt: { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Workflow', workflowSchema);
