const crypto = require('crypto');
const Workflow = require('../models/Workflow');
const WorkflowExecution = require('../models/WorkflowExecution');
const Task = require('../models/Task');
const Project = require('../models/Project');
const asyncHandler = require('../utils/asyncHandler');
const { ApiError, success } = require('../utils/ApiResponse');
const { runWorkflow } = require('../workflow/engine');

// @route GET /api/workflows
const getWorkflows = asyncHandler(async (req, res) => {
  const { project, enabled, triggerType } = req.query;
  const filter = {};
  if (project) filter.project = project;
  if (enabled !== undefined) filter.enabled = enabled === 'true';
  if (triggerType) filter['trigger.type'] = triggerType;

  const workflows = await Workflow.find(filter).populate('createdBy', 'name avatar').sort('-createdAt');
  success(res, 200, 'Workflows fetched successfully', { workflows, count: workflows.length });
});

// @route POST /api/workflows
const createWorkflow = asyncHandler(async (req, res) => {
  const { name, description, project, trigger, conditions, actions } = req.body;
  if (!name || !project || !trigger?.type) {
    throw new ApiError(400, 'Workflow name, project and trigger type are required');
  }

  const proj = await Project.findById(project);
  if (!proj) throw new ApiError(404, 'Project not found');

  const workflow = await Workflow.create({
    name,
    description,
    project,
    createdBy: req.user._id,
    trigger,
    conditions: conditions || [],
    actions: actions || [],
    webhookToken: trigger.type === 'Webhook Received' ? crypto.randomBytes(16).toString('hex') : undefined,
  });

  success(res, 201, 'Workflow created successfully', { workflow });
});

// @route GET /api/workflows/:id
const getWorkflowById = asyncHandler(async (req, res) => {
  const workflow = await Workflow.findById(req.params.id).populate('createdBy', 'name avatar');
  if (!workflow) throw new ApiError(404, 'Workflow not found');
  success(res, 200, 'Workflow fetched successfully', { workflow });
});

// @route PUT /api/workflows/:id
const updateWorkflow = asyncHandler(async (req, res) => {
  const workflow = await Workflow.findById(req.params.id);
  if (!workflow) throw new ApiError(404, 'Workflow not found');

  const allowed = ['name', 'description', 'trigger', 'conditions', 'actions', 'enabled'];
  allowed.forEach((field) => {
    if (req.body[field] !== undefined) workflow[field] = req.body[field];
  });

  if (workflow.trigger.type === 'Webhook Received' && !workflow.webhookToken) {
    workflow.webhookToken = crypto.randomBytes(16).toString('hex');
  }

  await workflow.save();
  success(res, 200, 'Workflow updated successfully', { workflow });
});

// @route DELETE /api/workflows/:id
const deleteWorkflow = asyncHandler(async (req, res) => {
  const workflow = await Workflow.findById(req.params.id);
  if (!workflow) throw new ApiError(404, 'Workflow not found');
  await workflow.deleteOne();
  await WorkflowExecution.deleteMany({ workflow: workflow._id });
  success(res, 200, 'Workflow deleted successfully');
});

// @route POST /api/workflows/:id/toggle
const toggleWorkflow = asyncHandler(async (req, res) => {
  const workflow = await Workflow.findById(req.params.id);
  if (!workflow) throw new ApiError(404, 'Workflow not found');
  workflow.enabled = !workflow.enabled;
  await workflow.save();
  success(res, 200, `Workflow ${workflow.enabled ? 'enabled' : 'disabled'}`, { workflow });
});

// @route POST /api/workflows/:id/test
// Runs the workflow immediately against a sample or specified task, without needing a real trigger event.
const testWorkflow = asyncHandler(async (req, res) => {
  const workflow = await Workflow.findById(req.params.id);
  if (!workflow) throw new ApiError(404, 'Workflow not found');

  let task = null;
  if (req.body.taskId) {
    task = await Task.findById(req.body.taskId).populate('assignee').populate('project');
  } else {
    task = await Task.findOne({ project: workflow.project }).populate('assignee').populate('project');
  }

  const project = await Project.findById(workflow.project);
  const context = { task, project, actorId: req.user._id, workflow };

  const execution = await runWorkflow(workflow, context, 'Manual Test');
  success(res, 200, 'Workflow test executed', { execution });
});

// @route GET /api/workflows/:id/executions
const getWorkflowExecutions = asyncHandler(async (req, res) => {
  const { status } = req.query;
  const filter = { workflow: req.params.id };
  if (status && status !== 'All') filter.status = status;

  const executions = await WorkflowExecution.find(filter).sort('-createdAt').limit(200);
  success(res, 200, 'Executions fetched successfully', { executions, count: executions.length });
});

module.exports = {
  getWorkflows,
  createWorkflow,
  getWorkflowById,
  updateWorkflow,
  deleteWorkflow,
  toggleWorkflow,
  testWorkflow,
  getWorkflowExecutions,
};
