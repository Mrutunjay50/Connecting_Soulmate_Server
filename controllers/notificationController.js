const { populateNotification } = require("../helper/populateNotification");
const Notifications = require("../models/notifications");
const { getSignedUrlFromS3 } = require("../utils/s3Utils");

exports.getNotificationsForUser = async (req, res) => {
  try {
    const userId = req.params.userId;

    const notifications = await Notifications.find({
      $or: [{ notificationTo: userId }, { notificationBy: userId }],
    });

    const populatedNotifications = await Promise.all(notifications.map(async (notification) => {
      return await populateNotification(notification);
    }));

    res.status(200).json(populatedNotifications);
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