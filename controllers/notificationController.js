const { populateNotification, populateAdminNotification } = require("../helper/NotificationsHelper/populateNotification");
const AdminNotifications = require("../models/adminNotification");
const Notifications = require("../models/notifications");
// const { getPublicUrlFromS3 } = require("../utils/s3Utils");

exports.getNotificationsForUser = async (req, res) => {
  try {
    const userId = req.params.userId;
    const { page = 1, limit = 100 } = req.query;
    const skip = (page - 1) * limit;

    const notifications = await Notifications.find({
      $or: [{ notificationTo: userId }, { notificationBy: userId }],
      notificationType: { $nin: ["chatinitiated", "blockedusers", "reported"] }
    })
    .sort({ updatedAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

    const populatedNotifications = await Promise.all(notifications.map(async (notification) => {
      return await populateNotification(notification);
    }));

    res.status(200).json(populatedNotifications);
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};


exports.getAdminNotificationsForUser = async (req, res) => {
  try {
    const { page = 1, limit = 100 } = req.query;
    const skip = (page - 1) * limit;

    const notifications = await AdminNotifications.find()
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('notificationBy', 'basicDetails.name userId');

    res.status(200).json(notifications);
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.getAllUsersNotificationsForAdmin = async (req, res) => {
  try {
    const { page = 1, limit = 100 } = req.query;
    const skip = (page - 1) * limit;

    const notifications = await Notifications.find()
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('notificationBy', 'basicDetails.name userId')
      .populate('notificationTo', 'basicDetails.name userId');

    res.status(200).json(notifications);
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.notificationsSeen = async (req, res) => {
    try {
      const userId = req.params.userId;
  
      // Find notifications where the userId is either in notificationTo or notificationBy
      const notifications = await Notifications.find({
        $or: [{ notificationTo: userId }, { notificationBy: userId }],
      });
  
      res.status(200).json(notifications);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  };