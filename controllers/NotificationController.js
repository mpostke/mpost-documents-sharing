const Notification = require('../models/NotificationModel');
const mongoose = require('mongoose');

// Create a new notification
exports.createNotification = async (req, res) => {
  try {
    const { title, message } = req.body;

    const notification = new Notification({ title, message });
    await notification.save();

    res.status(201).json({ message: 'Notification created', notification });
  } catch (error) {
    res.status(500).json({ message: 'Error creating notification', error });
  }
};

// Get all notifications
exports.getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find();
    res.status(200).json(notifications);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching notifications', error });
  }
};



exports.markNotificationAsRead = async (req, res) => {
  const { id } = req.params;

  try {
    // Validate the ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid notification ID" });
    }

    const notification = await Notification.findById(id);

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    // Mark the notification as read
    notification.hasBeenRead = true;
    await notification.save();

    res.status(200).json({ message: "Notification marked as read" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Error marking notification as read", error });
  }
};


exports.markAllNotificationsAsRead = async (req, res) => {
    const userId = req.user._id;  // Assuming `req.user` contains the authenticated user
  
    try {
      const notifications = await Notification.updateMany(
        { user: userId },
        { hasBeenRead: true }
      );
  
      if (notifications.nModified > 0) {
        res.status(200).json({ message: "All notifications marked as read" });
      } else {
        res.status(404).json({ message: "No unread notifications found" });
      }
    } catch (error) {
      res.status(500).json({ message: "Error marking all notifications as read", error });
    }
  };
  