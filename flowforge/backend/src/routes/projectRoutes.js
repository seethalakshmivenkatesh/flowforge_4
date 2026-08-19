const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getProjects,
  createProject,
  getProjectById,
  updateProject,
  deleteProject,
  archiveProject,
  addMember,
  removeMember,
  getProjectActivity,
} = require('../controllers/projectController');

router.use(protect);
router.route('/').get(getProjects).post(createProject);
router.route('/:id').get(getProjectById).put(updateProject).delete(deleteProject);
router.put('/:id/archive', archiveProject);
router.post('/:id/members', addMember);
router.delete('/:id/members/:userId', removeMember);
router.get('/:id/activity', getProjectActivity);

module.exports = router;
