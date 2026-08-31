const Task = require('../models/Task');
const Project = require('../models/Project');
const Notification = require('../models/Notification');
const ActivityLog = require('../models/ActivityLog');
const { emitToProject, emitToUser } = require('../sockets');

// Each action handler receives (params, context) and mutates state / sends notifications.
// context = { task, project, actorId, workflow }

async function notifyUsers(userIds, { type, message, link, project }) {
  const notifications = await Notification.insertMany(
    userIds.filter(Boolean).map((user) => ({ user, type, message, link }))
  );
  notifications.forEach((n) => {
    emitToUser(n.user, 'notificationCreated', n);
  });
  if (project) {
    emitToProject(project, 'notificationCreated', { count: notifications.length });
  }
  return notifications;
}

async function actionUpdateTask(params, context) {
  if (!context.task) throw new Error('updateTask requires a task in context');
  const updated = await Task.findByIdAndUpdate(context.task._id, params, { new: true });
  context.task = updated;
  emitToProject(updated.project, 'taskUpdated', updated);
  return updated;
}

async function actionAssignTask(params, context) {
  if (!context.task) throw new Error('assignTask requires a task in context');
  const updated = await Task.findByIdAndUpdate(context.task._id, { assignee: params.userId }, { new: true });
  context.task = updated;
  emitToProject(updated.project, 'taskAssigned', updated);
  await notifyUsers([params.userId], {
    type: 'Task Assigned',
    message: `You were assigned to task "${updated.title}"`,
    link: `/tasks/${updated._id}`,
    project: updated.project,
  });
  return updated;
}

async function actionChangeTaskStatus(params, context) {
  if (!context.task) throw new Error('changeTaskStatus requires a task in context');
  const updated = await Task.findByIdAndUpdate(context.task._id, { status: params.status }, { new: true });
  context.task = updated;
  emitToProject(updated.project, 'taskStatusChanged', updated);
  return updated;
}

async function actionSendNotification(params, context) {
  const project = context.project?._id || context.task?.project;
  let targetUsers = [];

  if (params.target === 'assignee' && context.task?.assignee) {
    targetUsers = [context.task.assignee];
  } else if (params.target === 'projectMembers' && project) {
    const proj = await Project.findById(project).select('members owner');
    targetUsers = [...(proj?.members || []), proj?.owner];
  } else if (params.userId) {
    targetUsers = [params.userId];
  }

  const message = params.message || `Workflow notification for "${context.task?.title || context.project?.name || 'item'}"`;
  return notifyUsers(targetUsers, {
    type: 'Workflow Executed',
    message,
    link: context.task ? `/tasks/${context.task._id}` : `/projects/${project}`,
    project,
  });
}

async function actionAddComment(params, context) {
  if (!context.task) throw new Error('addComment requires a task in context');
  const updated = await Task.findByIdAndUpdate(
    context.task._id,
    { $push: { comments: { author: context.actorId, text: params.text || 'Automated comment' } } },
    { new: true }
  );
  context.task = updated;
  emitToProject(updated.project, 'taskUpdated', updated);
  return updated;
}

async function actionCreateTask(params, context) {
  const project = params.project || context.project?._id || context.task?.project;
  const created = await Task.create({
    title: params.title || 'Untitled automated task',
    description: params.description || '',
    project,
    assignee: params.assignee || null,
    reporter: context.actorId,
    status: 'Todo',
    priority: params.priority || 'Medium',
    dueDate: params.dueDate,
  });
  emitToProject(project, 'taskCreated', created);
  return created;
}

async function actionUpdateProject(params, context) {
  const projectId = context.project?._id || context.task?.project;
  const updated = await Project.findByIdAndUpdate(projectId, params, { new: true });
  context.project = updated;
  emitToProject(updated._id, 'projectUpdated', updated);
  return updated;
}

async function actionSendWebhook(params, context) {
  if (!params.url) throw new Error('sendWebhook requires a target url');
  const payload = { task: context.task, project: context.project, triggeredAt: new Date() };
  try {
    const res = await fetch(params.url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return { status: res.status };
  } catch (err) {
    throw new Error(`Webhook delivery failed: ${err.message}`);
  }
}

const actionHandlers = {
  updateTask: actionUpdateTask,
  assignTask: actionAssignTask,
  changeTaskStatus: actionChangeTaskStatus,
  sendNotification: actionSendNotification,
  addComment: actionAddComment,
  createTask: actionCreateTask,
  updateProject: actionUpdateProject,
  sendWebhook: actionSendWebhook,
};

async function executeAction(action, context) {
  const handler = actionHandlers[action.type];
  if (!handler) throw new Error(`Unknown action type: ${action.type}`);
  return handler(action.params || {}, context);
}

module.exports = { executeAction, actionHandlers };
