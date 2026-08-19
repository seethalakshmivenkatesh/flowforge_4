const Notification = require('../models/Notification');
const asyncHandler = require('../utils/asyncHandler');
const { ApiError, success } = require('../utils/ApiResponse');

// @route GET /api/notifications
const getNotifications = asyncHandler(async (req, res) => {
  const notifications = await Notification.find({ user: req.user._id }).sort('-createdAt').limit(100);
  const unreadCount = await Notification.countDocuments({ user: req.user._id, read: false });
  success(res, 200, 'Notifications fetched successfully', { notifications, unreadCount });
});

// @route PUT /api/notifications/:id/read
const markAsRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id },
    { read: true },
    { new: true }
  );
  if (!notification) throw new ApiError(404, 'Notification not found');
  success(res, 200, 'Notification marked as read', { notification });
});

// @route PUT /api/notifications/read-all
const markAllAsRead = asyncHandler(async (req, res) => {
  await Notification.updateMany({ user: req.user._id, read: false }, { read: true });
  success(res, 200, 'All notifications marked as read');
});

module.exports = { getNotifications, markAsRead, markAllAsRead };
