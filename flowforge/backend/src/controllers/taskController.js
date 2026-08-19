const Task = require('../models/Task');
const Project = require('../models/Project');
const ActivityLog = require('../models/ActivityLog');
const Notification = require('../models/Notification');
const asyncHandler = require('../utils/asyncHandler');
const { ApiError, success } = require('../utils/ApiResponse');
const eventBus = require('../events/eventBus');
const { emitToProject, emitToUser } = require('../sockets');

const populateTask = (query) =>
  query
    .populate('assignee', 'name email avatar')
    .populate('reporter', 'name email avatar')
    .populate('comments.author', 'name avatar')
    .populate('project', 'name owner members');

// @route GET /api/tasks
const getTasks = asyncHandler(async (req, res) => {
  const { project, status, priority, assignee, label, dueBefore, dueAfter, search } = req.query;
  const filter = {};
  if (project) filter.project = project;
  if (status) filter.status = status;
  if (priority) filter.priority = priority;
  if (assignee) filter.assignee = assignee;
  if (label) filter.labels = label;
  if (dueBefore || dueAfter) {
    filter.dueDate = {};
    if (dueBefore) filter.dueDate.$lte = new Date(dueBefore);
    if (dueAfter) filter.dueDate.$gte = new Date(dueAfter);
  }
  if (search) filter.$text = { $search: search };

  const tasks = await populateTask(Task.find(filter)).sort('-createdAt');
  success(res, 200, 'Tasks fetched successfully', { tasks, count: tasks.length });
});

// @route POST /api/tasks
const createTask = asyncHandler(async (req, res) => {
  const { title, project, description, assignee, priority, dueDate, labels } = req.body;
  if (!title || !project) throw new ApiError(400, 'Task title and project are required');

  const proj = await Project.findById(project);
  if (!proj) throw new ApiError(404, 'Project not found');

  const task = await Task.create({
    title,
    description,
    project,
    assignee: assignee || null,
    reporter: req.user._id,
    priority,
    dueDate,
    labels: labels || [],
  });

  await ActivityLog.create({
    project,
    actor: req.user._id,
    action: `${req.user.name} created task "${task.title}"`,
  });

  const populated = await populateTask(Task.findById(task._id));
  emitToProject(project, 'taskCreated', populated);

  if (assignee) {
    const n = await Notification.create({
      user: assignee,
      type: 'Task Assigned',
      message: `You were assigned to task "${task.title}"`,
      link: `/tasks/${task._id}`,
    });
    emitToUser(assignee, 'notificationCreated', n);
  }

  eventBus.emit('task:created', { task: populated, project: proj, actorId: req.user._id });

  success(res, 201, 'Task created successfully', { task: populated });
});

// @route GET /api/tasks/:id
const getTaskById = asyncHandler(async (req, res) => {
  const task = await populateTask(Task.findById(req.params.id));
  if (!task) throw new ApiError(404, 'Task not found');
  success(res, 200, 'Task fetched successfully', { task });
});

// @route PUT /api/tasks/:id
const updateTask = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.id).populate('project', 'name owner members');
  if (!task) throw new ApiError(404, 'Task not found');

  const previousStatus = task.status;
  const previousAssignee = task.assignee ? String(task.assignee) : null;

  const allowed = ['title', 'description', 'status', 'priority', 'dueDate', 'labels', 'assignee'];
  allowed.forEach((field) => {
    if (req.body[field] !== undefined) task[field] = req.body[field];
  });

  await task.save();
  const populated = await populateTask(Task.findById(task._id));

  emitToProject(task.project._id, 'taskUpdated', populated);

  await ActivityLog.create({
    project: task.project._id,
    actor: req.user._id,
    action: `${req.user.name} updated task "${task.title}"`,
  });

  eventBus.emit('task:updated', { task: populated, project: task.project, actorId: req.user._id });

  // Status changed
  if (req.body.status && req.body.status !== previousStatus) {
    emitToProject(task.project._id, 'taskStatusChanged', populated);
    await ActivityLog.create({
      project: task.project._id,
      actor: req.user._id,
      action: `${req.user.name} moved "${task.title}" to ${task.status}`,
    });
    eventBus.emit('task:statusChanged', {
      task: populated,
      project: task.project,
      actorId: req.user._id,
      previousStatus,
    });

    if (task.status === 'Done') {
      eventBus.emit('task:completed', { task: populated, project: task.project, actorId: req.user._id });
      if (task.assignee) {
        const n = await Notification.create({
          user: task.assignee,
          type: 'Task Completed',
          message: `Task "${task.title}" was marked as Done`,
          link: `/tasks/${task._id}`,
        });
        emitToUser(task.assignee, 'notificationCreated', n);
      }
    }
  }

  // Assignee changed
  if (req.body.assignee && String(req.body.assignee) !== previousAssignee) {
    eventBus.emit('task:assigned', { task: populated, project: task.project, actorId: req.user._id });
    const n = await Notification.create({
      user: req.body.assignee,
      type: 'Task Assigned',
      message: `You were assigned to task "${task.title}"`,
      link: `/tasks/${task._id}`,
    });
    emitToUser(req.body.assignee, 'notificationCreated', n);
  }

  success(res, 200, 'Task updated successfully', { task: populated });
});

// @route DELETE /api/tasks/:id
const deleteTask = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.id);
  if (!task) throw new ApiError(404, 'Task not found');
  await task.deleteOne();
  emitToProject(task.project, 'taskDeleted', { _id: task._id });
  success(res, 200, 'Task deleted successfully');
});

// @route POST /api/tasks/:id/comments
const addComment = asyncHandler(async (req, res) => {
  const { text } = req.body;
  if (!text) throw new ApiError(400, 'Comment text is required');

  const task = await Task.findByIdAndUpdate(
    req.params.id,
    { $push: { comments: { author: req.user._id, text } } },
    { new: true }
  ).populate('project', 'name owner members');
  if (!task) throw new ApiError(404, 'Task not found');

  const populated = await populateTask(Task.findById(task._id));
  emitToProject(task.project._id, 'taskUpdated', populated);

  eventBus.emit('comment:added', { task: populated, project: task.project, actorId: req.user._id });

  if (task.assignee && String(task.assignee) !== String(req.user._id)) {
    const n = await Notification.create({
      user: task.assignee,
      type: 'Comment Added',
      message: `${req.user.name} commented on "${task.title}"`,
      link: `/tasks/${task._id}`,
    });
    emitToUser(task.assignee, 'notificationCreated', n);
  }

  success(res, 200, 'Comment added successfully', { task: populated });
});

// @route PUT /api/tasks/:id/checklist
const updateChecklist = asyncHandler(async (req, res) => {
  const { checklist } = req.body; // full replacement array [{text, done}]
  const task = await Task.findByIdAndUpdate(req.params.id, { checklist }, { new: true }).populate(
    'project',
    'name'
  );
  if (!task) throw new ApiError(404, 'Task not found');
  emitToProject(task.project._id, 'taskUpdated', task);
  success(res, 200, 'Checklist updated successfully', { task });
});

module.exports = {
  getTasks,
  createTask,
  getTaskById,
  updateTask,
  deleteTask,
  addComment,
  updateChecklist,
};
