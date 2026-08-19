const Project = require('../models/Project');
const Task = require('../models/Task');
const User = require('../models/User');
const Workflow = require('../models/Workflow');
const asyncHandler = require('../utils/asyncHandler');
const { success } = require('../utils/ApiResponse');

// @route GET /api/search?q=term
const globalSearch = asyncHandler(async (req, res) => {
  const q = req.query.q;
  if (!q || !q.trim()) return success(res, 200, 'Search results', { projects: [], tasks: [], users: [], workflows: [] });

  const regex = { $regex: q, $options: 'i' };
  const userProjectFilter = { $or: [{ owner: req.user._id }, { members: req.user._id }] };

  const projects = await Project.find({ ...userProjectFilter, name: regex }).limit(10);
  const projectIds = projects.length ? projects.map((p) => p._id) : (await Project.find(userProjectFilter).distinct('_id'));

  const [tasks, users, workflows] = await Promise.all([
    Task.find({ project: { $in: projectIds }, title: regex }).limit(10),
    User.find({ $or: [{ name: regex }, { email: regex }] }).select('name email avatar').limit(10),
    Workflow.find({ project: { $in: projectIds }, name: regex }).limit(10),
  ]);

  success(res, 200, 'Search results', { projects, tasks, users, workflows });
});

module.exports = { globalSearch };
