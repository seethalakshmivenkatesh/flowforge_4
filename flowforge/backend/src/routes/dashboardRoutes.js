const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { getSummary, getCharts, getAnalytics } = require('../controllers/dashboardController');

router.use(protect);
router.get('/summary', getSummary);
router.get('/charts', getCharts);
router.get('/analytics', getAnalytics);

module.exports = router;
