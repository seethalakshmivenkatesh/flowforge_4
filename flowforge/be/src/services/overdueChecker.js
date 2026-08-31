const Task = require('../models/Task');
const eventBus = require('../events/eventBus');

// Periodically scans for tasks that just became overdue and emits 'task:overdue'
// so any "Task Overdue" workflows can react. Uses a lightweight in-memory guard
// (lastCheckedOverdue) to avoid re-firing the same task event repeatedly.
const alreadyFired = new Set();

async function checkOverdueTasks() {
  const now = new Date();
  const overdue = await Task.find({
    dueDate: { $lt: now },
    status: { $ne: 'Done' },
  })
    .populate('assignee', 'name email')
    .populate('project', 'name owner members');

  for (const task of overdue) {
    const key = String(task._id);
    if (alreadyFired.has(key)) continue;
    alreadyFired.add(key);
    eventBus.emit('task:overdue', { task, project: task.project, actorId: task.reporter });
  }
}

function startOverdueChecker(intervalMs = 60 * 1000) {
  setInterval(() => {
    checkOverdueTasks().catch((err) => console.error('[OverdueChecker] error:', err.message));
  }, intervalMs);
  console.log(`[OverdueChecker] Running every ${intervalMs / 1000}s`);
}

module.exports = { startOverdueChecker, checkOverdueTasks };
