const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getTasks,
  createTask,
  getTaskById,
  updateTask,
  deleteTask,
  addComment,
  updateChecklist,
} = require('../controllers/taskController');

router.use(protect);
router.route('/').get(getTasks).post(createTask);
router.route('/:id').get(getTaskById).put(updateTask).delete(deleteTask);
router.post('/:id/comments', addComment);
router.put('/:id/checklist', updateChecklist);

module.exports = router;
