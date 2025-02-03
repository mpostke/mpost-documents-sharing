const express = require('express');
const router = express.Router();
const messageController = require('../controllers/MessageController');

router.post('/add-message', messageController.addMessage);
router.post('/acknowledge', messageController.acknowledgeMessage);
router.get('/messages/:documentId', messageController.getMessagesByDocument);

module.exports = router;
