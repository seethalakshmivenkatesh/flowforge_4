const express = require('express');
const router = express.Router();
const { receiveWebhook } = require('../controllers/webhookController');

// Intentionally NOT behind `protect` - external systems authenticate via webhookToken instead.
router.post('/:workflowId', receiveWebhook);

module.exports = router;
