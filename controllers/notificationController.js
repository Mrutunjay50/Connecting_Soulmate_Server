const { populateNotification, populateAdminNotification, populateNotificationOfUsersForAdmin } = require("../helper/NotificationsHelper/populateNotification");
const AdminNotifications = require("../models/adminNotification");
const Notifications = require("../models/notifications");
const io = require("../socket");
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


  exports.sendAndCreateNotification = async (senderId, receiverId, notificationType) => {
    try {
      if (!["chatinitiated", "blockedusers", "reported"].includes(notificationType)) {
        throw new Error("Invalid notification type");
      }
  
      // Create or update notification for the receiver
      const notification = await Notification.findOneAndUpdate(
        {
          notificationTo: receiverId,
          notificationBy: senderId,
          notificationType: notificationType,
        },
        {
          notificationTo: receiverId,
          notificationBy: senderId,
          notificationText: `You have received a ${notificationType.replace(/([a-z])([A-Z])/g, '$1 $2').toLowerCase()} notification from user ${senderId}`,
          notificationType: notificationType,
        },
        {
          new: true, // Return the updated document
          upsert: true, // Create the document if it doesn't exist
          setDefaultsOnInsert: true, // Apply default values if creating
        }
      );
  
      // Find all admin users
      const admins = await User.find({ accessType : '0' }); // Adjust the query based on your user schema
      const adminIds = admins.map(admin => admin._id);
      const formattedNotification = await populateNotificationOfUsersForAdmin(notification);
      // Emit the notification to all admins
      adminIds.forEach(adminId => {
        io.getIO().emit(`notification/${adminId}`, formattedNotification);
      });
  
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  };