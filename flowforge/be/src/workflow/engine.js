const Workflow = require('../models/Workflow');
const WorkflowExecution = require('../models/WorkflowExecution');
const ActivityLog = require('../models/ActivityLog');
const eventBus = require('../events/eventBus');
const { evaluateConditions } = require('./conditions');
const { executeAction } = require('./actions');
const { emitToProject, emitToUser } = require('../sockets');
const Notification = require('../models/Notification');

// Map internal event names -> Workflow trigger type strings
const EVENT_TO_TRIGGER = {
  'task:created': 'Task Created',
  'task:updated': 'Task Updated',
  'task:completed': 'Task Completed',
  'task:statusChanged': 'Task Status Changed',
  'task:assigned': 'Task Assigned',
  'task:overdue': 'Task Overdue',
  'project:created': 'Project Created',
  'project:completed': 'Project Completed',
  'comment:added': 'Comment Added',
  'webhook:received': 'Webhook Received',
};

async function runWorkflow(workflow, context, triggerEventName) {
  const execution = await WorkflowExecution.create({
    workflow: workflow._id,
    triggerEvent: triggerEventName,
    status: 'Running',
    startedAt: new Date(),
    context: { taskId: context.task?._id, projectId: context.project?._id || context.task?.project },
  });

  const start = Date.now();
  const actionsExecuted = [];

  try {
    const conditionsPass = evaluateConditions(workflow.conditions, context);

    if (!conditionsPass) {
      execution.status = 'Success';
      execution.finishedAt = new Date();
      execution.durationMs = Date.now() - start;
      execution.actionsExecuted = [];
      execution.errorMessage = 'Conditions not met - no actions executed';
      await execution.save();
      return execution;
    }

    for (const action of workflow.actions) {
      await executeAction(action, context);
      actionsExecuted.push(action.type);
    }

    workflow.executionCount += 1;
    workflow.lastExecutedAt = new Date();
    await workflow.save();

    execution.status = 'Success';
    execution.actionsExecuted = actionsExecuted;
    execution.finishedAt = new Date();
    execution.durationMs = Date.now() - start;
    await execution.save();

    await ActivityLog.create({
      project: context.project?._id || context.task?.project,
      actor: context.actorId,
      action: `Workflow "${workflow.name}" executed successfully`,
      meta: { workflowId: workflow._id, actionsExecuted },
    });

    emitToProject(context.project?._id || context.task?.project, 'workflowExecuted', {
      workflowId: workflow._id,
      name: workflow.name,
      status: 'Success',
    });
  } catch (err) {
    execution.status = 'Failed';
    execution.errorMessage = err.message;
    execution.actionsExecuted = actionsExecuted;
    execution.finishedAt = new Date();
    execution.durationMs = Date.now() - start;
    await execution.save();

    emitToProject(context.project?._id || context.task?.project, 'workflowExecuted', {
      workflowId: workflow._id,
      name: workflow.name,
      status: 'Failed',
      error: err.message,
    });

    if (context.actorId) {
      const n = await Notification.create({
        user: context.actorId,
        type: 'Workflow Failed',
        message: `Workflow "${workflow.name}" failed: ${err.message}`,
      });
      emitToUser(context.actorId, 'notificationCreated', n);
    }
  }

  return execution;
}

// Main entry point: given an internal event name + context, find & run matching workflows
async function handleEvent(eventName, context) {
  const triggerType = EVENT_TO_TRIGGER[eventName];
  if (!triggerType) return [];

  const projectId = context.project?._id || context.task?.project;
  if (!projectId) return [];

  const workflows = await Workflow.find({
    project: projectId,
    enabled: true,
    'trigger.type': triggerType,
  });

  const results = [];
  for (const workflow of workflows) {
    results.push(await runWorkflow(workflow, context, eventName));
  }
  return results;
}

// Wire the engine up to the app-wide event bus.
function registerWorkflowListeners() {
  Object.keys(EVENT_TO_TRIGGER).forEach((eventName) => {
    eventBus.on(eventName, async (context) => {
      try {
        await handleEvent(eventName, context);
      } catch (err) {
        console.error(`[WorkflowEngine] Error handling event ${eventName}:`, err.message);
      }
    });
  });
  console.log('[WorkflowEngine] Listening for domain events:', Object.keys(EVENT_TO_TRIGGER).join(', '));
}

module.exports = { handleEvent, runWorkflow, registerWorkflowListeners, EVENT_TO_TRIGGER };
