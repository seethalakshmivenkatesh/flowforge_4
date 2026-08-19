const Project = require('../models/Project');
const Task = require('../models/Task');
const ActivityLog = require('../models/ActivityLog');
const asyncHandler = require('../utils/asyncHandler');
const { ApiError, success } = require('../utils/ApiResponse');
const eventBus = require('../events/eventBus');
const { emitToProject } = require('../sockets');

// @route GET /api/projects
const getProjects = asyncHandler(async (req, res) => {
  const { status, priority, owner, search, archived } = req.query;
  const filter = {
    $or: [{ owner: req.user._id }, { members: req.user._id }],
  };
  if (status) filter.status = status;
  if (priority) filter.priority = priority;
  if (owner) filter.owner = owner;
  filter.archived = archived === 'true';
  if (search) filter.$text = { $search: search };

  const projects = await Project.find(filter)
    .populate('owner', 'name email avatar')
    .populate('members', 'name email avatar')
    .sort('-createdAt');

  success(res, 200, 'Projects fetched successfully', { projects, count: projects.length });
});

// @route POST /api/projects
const createProject = asyncHandler(async (req, res) => {
  const { name, description, status, priority, startDate, dueDate, members } = req.body;
  if (!name) throw new ApiError(400, 'Project name is required');

  const project = await Project.create({
    name,
    description,
    status,
    priority,
    startDate,
    dueDate,
    owner: req.user._id,
    members: members || [],
  });

  await ActivityLog.create({
    project: project._id,
    actor: req.user._id,
    action: `${req.user.name} created project "${project.name}"`,
  });

  eventBus.emit('project:created', { project, actorId: req.user._id });

  const populated = await project.populate([
    { path: 'owner', select: 'name email avatar' },
    { path: 'members', select: 'name email avatar' },
  ]);

  success(res, 201, 'Project created successfully', { project: populated });
});

// @route GET /api/projects/:id
const getProjectById = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id)
    .populate('owner', 'name email avatar')
    .populate('members', 'name email avatar');
  if (!project) throw new ApiError(404, 'Project not found');

  const taskStats = await Task.aggregate([
    { $match: { project: project._id } },
    { $group: { _id: '$status', count: { $sum: 1 } } },
  ]);

  success(res, 200, 'Project fetched successfully', { project, taskStats });
});

// @route PUT /api/projects/:id
const updateProject = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id);
  if (!project) throw new ApiError(404, 'Project not found');

  const allowedFields = ['name', 'description', 'status', 'priority', 'startDate', 'dueDate', 'progress'];
  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) project[field] = req.body[field];
  });

  const wasCompleted = project.status === 'Completed';
  await project.save();

  await ActivityLog.create({
    project: project._id,
    actor: req.user._id,
    action: `${req.user.name} updated project "${project.name}"`,
  });

  emitToProject(project._id, 'projectUpdated', project);

  if (project.status === 'Completed' && !wasCompleted) {
    eventBus.emit('project:completed', { project, actorId: req.user._id });
  }

  if (req.body.progress === 100 && project.status !== 'Completed') {
    project.status = 'Completed';
    await project.save();
    eventBus.emit('project:completed', { project, actorId: req.user._id });
  }

  success(res, 200, 'Project updated successfully', { project });
});

// @route DELETE /api/projects/:id
const deleteProject = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id);
  if (!project) throw new ApiError(404, 'Project not found');

  await Task.deleteMany({ project: project._id });
  await project.deleteOne();

  success(res, 200, 'Project deleted successfully');
});

// @route PUT /api/projects/:id/archive
const archiveProject = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id);
  if (!project) throw new ApiError(404, 'Project not found');
  project.archived = !project.archived;
  await project.save();
  success(res, 200, `Project ${project.archived ? 'archived' : 'unarchived'} successfully`, { project });
});

// @route POST /api/projects/:id/members
const addMember = asyncHandler(async (req, res) => {
  const { userId } = req.body;
  const project = await Project.findById(req.params.id);
  if (!project) throw new ApiError(404, 'Project not found');

  if (!project.members.includes(userId)) {
    project.members.push(userId);
    await project.save();
  }

  await ActivityLog.create({
    project: project._id,
    actor: req.user._id,
    action: `${req.user.name} added a new member to "${project.name}"`,
  });

  const populated = await project.populate('members', 'name email avatar');
  success(res, 200, 'Member added successfully', { project: populated });
});

// @route DELETE /api/projects/:id/members/:userId
const removeMember = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id);
  if (!project) throw new ApiError(404, 'Project not found');

  project.members = project.members.filter((m) => String(m) !== req.params.userId);
  await project.save();

  success(res, 200, 'Member removed successfully', { project });
});

// @route GET /api/projects/:id/activity
const getProjectActivity = asyncHandler(async (req, res) => {
  const activity = await ActivityLog.find({ project: req.params.id })
    .populate('actor', 'name avatar')
    .sort('-createdAt')
    .limit(100);
  success(res, 200, 'Activity fetched successfully', { activity });
});

module.exports = {
  getProjects,
  createProject,
  getProjectById,
  updateProject,
  deleteProject,
  archiveProject,
  addMember,
  removeMember,
  getProjectActivity,
};
