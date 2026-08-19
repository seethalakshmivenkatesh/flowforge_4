// Evaluates a workflow's condition list against the event context.
// All conditions must pass (AND semantics) for the workflow to proceed.

function getFieldValue(field, context) {
  const { task, project } = context;
  switch (field) {
    case 'priority':
      return task ? task.priority : project ? project.priority : undefined;
    case 'status':
      return task ? task.status : project ? project.status : undefined;
    case 'assignee':
      return task && task.assignee ? String(task.assignee._id || task.assignee) : undefined;
    case 'project':
      return task && task.project ? String(task.project._id || task.project) : project ? String(project._id) : undefined;
    case 'dueDate':
      return task ? task.dueDate : project ? project.dueDate : undefined;
    default:
      return undefined;
  }
}

function evaluateCondition(condition, context) {
  const actual = getFieldValue(condition.field, context);
  const expected = condition.value;

  switch (condition.operator) {
    case 'equals':
      return String(actual) === String(expected);
    case 'notEquals':
      return String(actual) !== String(expected);
    case 'contains':
      return actual && String(actual).toLowerCase().includes(String(expected).toLowerCase());
    case 'before':
      return actual && new Date(actual) < new Date(expected || Date.now());
    case 'after':
      return actual && new Date(actual) > new Date(expected || Date.now());
    default:
      return false;
  }
}

function evaluateConditions(conditions = [], context) {
  if (!conditions.length) return true;
  return conditions.every((c) => evaluateCondition(c, context));
}

module.exports = { evaluateConditions };
