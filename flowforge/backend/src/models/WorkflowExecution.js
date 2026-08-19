const mongoose = require('mongoose');

const workflowExecutionSchema = new mongoose.Schema(
  {
    workflow: { type: mongoose.Schema.Types.ObjectId, ref: 'Workflow', required: true, index: true },
    triggerEvent: { type: String, required: true },
    status: { type: String, enum: ['Success', 'Failed', 'Running'], default: 'Running', index: true },
    startedAt: { type: Date, default: Date.now },
    finishedAt: { type: Date },
    durationMs: { type: Number },
    actionsExecuted: [{ type: String }],
    errorMessage: { type: String },
    context: { type: mongoose.Schema.Types.Mixed },
  },
  { timestamps: true }
);

module.exports = mongoose.model('WorkflowExecution', workflowExecutionSchema);
