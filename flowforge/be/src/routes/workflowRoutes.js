const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getWorkflows,
  createWorkflow,
  getWorkflowById,
  updateWorkflow,
  deleteWorkflow,
  toggleWorkflow,
  testWorkflow,
  getWorkflowExecutions,
} = require('../controllers/workflowController');

router.use(protect);
router.route('/').get(getWorkflows).post(createWorkflow);
router.route('/:id').get(getWorkflowById).put(updateWorkflow).delete(deleteWorkflow);
router.post('/:id/toggle', toggleWorkflow);
router.post('/:id/test', testWorkflow);
router.get('/:id/executions', getWorkflowExecutions);

module.exports = router;
