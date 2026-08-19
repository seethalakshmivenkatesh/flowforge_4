export const TRIGGER_OPTIONS = [
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
];

export const CONDITION_FIELDS = ['priority', 'status', 'assignee', 'project', 'dueDate'];
export const CONDITION_OPERATORS = ['equals', 'notEquals', 'contains', 'before', 'after'];

export const ACTION_TYPES = [
  'updateTask',
  'assignTask',
  'changeTaskStatus',
  'sendNotification',
  'addComment',
  'createTask',
  'updateProject',
  'sendWebhook',
];

export const ACTION_LABELS = {
  updateTask: 'Update Task',
  assignTask: 'Assign Task',
  changeTaskStatus: 'Change Task Status',
  sendNotification: 'Send Notification',
  addComment: 'Add Comment',
  createTask: 'Create Task',
  updateProject: 'Update Project',
  sendWebhook: 'Send Webhook',
};
