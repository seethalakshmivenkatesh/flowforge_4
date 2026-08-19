const Workflow = require('../models/Workflow');
const Project = require('../models/Project');
const asyncHandler = require('../utils/asyncHandler');
const { ApiError, success } = require('../utils/ApiResponse');
const { runWorkflow } = require('../workflow/engine');

// @route POST /api/webhooks/:workflowId
// Public-ish endpoint (validated by webhookToken) for external systems to trigger a workflow.
const receiveWebhook = asyncHandler(async (req, res) => {
  const workflow = await Workflow.findById(req.params.workflowId);
  if (!workflow) throw new ApiError(404, 'Webhook target not found');
  if (workflow.trigger.type !== 'Webhook Received') {
    throw new ApiError(400, 'This workflow is not configured to receive webhooks');
  }
  if (!workflow.enabled) throw new ApiError(400, 'This workflow is currently disabled');

  const providedToken = req.headers['x-webhook-token'] || req.query.token;
  if (!providedToken || providedToken !== workflow.webhookToken) {
    throw new ApiError(401, 'Invalid or missing webhook token');
  }

  const project = await Project.findById(workflow.project);
  const context = { task: null, project, actorId: workflow.createdBy, payload: req.body, workflow };

  const execution = await runWorkflow(workflow, context, 'Webhook Received');
  success(res, 200, 'Webhook received and workflow triggered', { executionId: execution._id, status: execution.status });
});

module.exports = { receiveWebhook };
