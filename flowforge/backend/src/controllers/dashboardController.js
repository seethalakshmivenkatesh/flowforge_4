const Project = require('../models/Project');
const Task = require('../models/Task');
const Workflow = require('../models/Workflow');
const WorkflowExecution = require('../models/WorkflowExecution');
const ActivityLog = require('../models/ActivityLog');
const asyncHandler = require('../utils/asyncHandler');
const { success } = require('../utils/ApiResponse');

// @route GET /api/dashboard/summary
const getSummary = asyncHandler(async (req, res) => {
  const userProjectFilter = { $or: [{ owner: req.user._id }, { members: req.user._id }] };
  const projects = await Project.find(userProjectFilter).select('_id status');
  const projectIds = projects.map((p) => p._id);

  const [totalTasks, completedTasks, pendingTasks, overdueTasks, activeWorkflows, recentActivity] =
    await Promise.all([
      Task.countDocuments({ project: { $in: projectIds } }),
      Task.countDocuments({ project: { $in: projectIds }, status: 'Done' }),
      Task.countDocuments({ project: { $in: projectIds }, status: { $ne: 'Done' } }),
      Task.countDocuments({ project: { $in: projectIds }, status: { $ne: 'Done' }, dueDate: { $lt: new Date() } }),
      Workflow.countDocuments({ project: { $in: projectIds }, enabled: true }),
      ActivityLog.find({ project: { $in: projectIds } }).sort('-createdAt').limit(10).populate('actor', 'name avatar'),
    ]);

  const upcomingDeadlines = await Task.find({
    project: { $in: projectIds },
    status: { $ne: 'Done' },
    dueDate: { $gte: new Date(), $lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
  })
    .populate('assignee', 'name avatar')
    .sort('dueDate')
    .limit(10);

  success(res, 200, 'Dashboard summary fetched successfully', {
    totalProjects: projects.length,
    activeProjects: projects.filter((p) => p.status === 'In Progress' || p.status === 'Planning').length,
    completedProjects: projects.filter((p) => p.status === 'Completed').length,
    totalTasks,
    completedTasks,
    pendingTasks,
    overdueTasks,
    activeWorkflows,
    recentActivity,
    upcomingDeadlines,
  });
});

// @route GET /api/dashboard/charts
const getCharts = asyncHandler(async (req, res) => {
  const userProjectFilter = { $or: [{ owner: req.user._id }, { members: req.user._id }] };
  const projects = await Project.find(userProjectFilter).select('_id name progress');
  const projectIds = projects.map((p) => p._id);

  const taskStatusDistribution = await Task.aggregate([
    { $match: { project: { $in: projectIds } } },
    { $group: { _id: '$status', count: { $sum: 1 } } },
  ]);

  const tasksByPriority = await Task.aggregate([
    { $match: { project: { $in: projectIds } } },
    { $group: { _id: '$priority', count: { $sum: 1 } } },
  ]);

  const tasksCompletedOverTime = await Task.aggregate([
    { $match: { project: { $in: projectIds }, status: 'Done' } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$updatedAt' } },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
    { $limit: 30 },
  ]);

  const teamWorkload = await Task.aggregate([
    { $match: { project: { $in: projectIds }, assignee: { $ne: null }, status: { $ne: 'Done' } } },
    { $group: { _id: '$assignee', count: { $sum: 1 } } },
    { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
    { $unwind: '$user' },
    { $project: { count: 1, name: '$user.name' } },
  ]);

  const projectProgress = projects.map((p) => ({ name: p.name, progress: p.progress }));

  success(res, 200, 'Chart data fetched successfully', {
    taskStatusDistribution,
    tasksByPriority,
    tasksCompletedOverTime,
    teamWorkload,
    projectProgress,
  });
});

// @route GET /api/dashboard/analytics
const getAnalytics = asyncHandler(async (req, res) => {
  const userProjectFilter = { $or: [{ owner: req.user._id }, { members: req.user._id }] };
  const projects = await Project.find(userProjectFilter).select('_id status');
  const projectIds = projects.map((p) => p._id);

  const totalTasks = await Task.countDocuments({ project: { $in: projectIds } });
  const completedTasks = await Task.countDocuments({ project: { $in: projectIds }, status: 'Done' });
  const overdueTasks = await Task.countDocuments({
    project: { $in: projectIds },
    status: { $ne: 'Done' },
    dueDate: { $lt: new Date() },
  });

  const completedProjects = projects.filter((p) => p.status === 'Completed').length;

  const workflowExecutions = await WorkflowExecution.find({
    workflow: { $in: await Workflow.find({ project: { $in: projectIds } }).distinct('_id') },
  });

  const successCount = workflowExecutions.filter((e) => e.status === 'Success').length;
  const failedCount = workflowExecutions.filter((e) => e.status === 'Failed').length;
  const totalExecutions = workflowExecutions.length;

  success(res, 200, 'Analytics fetched successfully', {
    projectCompletionRate: projects.length ? Math.round((completedProjects / projects.length) * 100) : 0,
    taskCompletionRate: totalTasks ? Math.round((completedTasks / totalTasks) * 100) : 0,
    overdueTasks,
    workflowExecutionCount: totalExecutions,
    successfulWorkflowPercentage: totalExecutions ? Math.round((successCount / totalExecutions) * 100) : 0,
    failedWorkflowPercentage: totalExecutions ? Math.round((failedCount / totalExecutions) * 100) : 0,
  });
});

module.exports = { getSummary, getCharts, getAnalytics };
