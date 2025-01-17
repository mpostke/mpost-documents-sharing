const express = require('express');
const router = express.Router();
const { createNotification, getNotifications, markNotificationAsRead, markAllNotificationsAsRead } = require('../controllers/NotificationController');
const authenticate = require('../middlewares/jwt'); // Replace with your auth middleware

router.post('/', authenticate, createNotification);
router.get('/', authenticate, getNotifications);
router.get('/mark-as-read/:id', authenticate, markNotificationAsRead);
router.get('/mark-all-as-read', authenticate, markAllNotificationsAsRead);

module.exports = router;
