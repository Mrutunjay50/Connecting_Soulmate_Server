const { populateNotification, populateAdminNotification, populateNotificationOfUsersForAdmin } = require("../helper/NotificationsHelper/populateNotification");
const { sendNotificationToAdmins } = require("../helper/NotificationsHelper/sendNotificationsToAdmin");
const AdminNotifications = require("../models/adminNotification");
const Notifications = require("../models/notifications");
const io = require("../socket");
// const { getPublicUrlFromS3 } = require("../utils/s3Utils");

exports.getNotificationsForUser = async (req, res) => {
  try {
    const userId = req.params.userId;
    const { page = 1, limit = 100 } = req.query;
    
    const pageNumber = parseInt(page, 10);
    const pageSize = parseInt(limit, 10);
    const skip = (pageNumber - 1) * pageSize;

    const totalRecords = await Notifications.countDocuments({
      $or: [{ notificationTo: userId }, { notificationBy: userId }],
      notificationType: { $nin: ["chatinitiated", "blockedusers", "reported"] }
    });

    const notifications = await Notifications.find({
      $or: [{ notificationTo: userId }, { notificationBy: userId }],
      notificationType: { $nin: ["chatinitiated", "blockedusers", "reported"] }
    })
    .sort({ updatedAt: -1 })
    .skip(skip)
    .limit(pageSize);

    const populatedNotifications = await Promise.all(notifications.map(async (notification) => {
      return await populateNotification(notification);
    }));

    const totalPages = Math.ceil(totalRecords / pageSize);

    res.status(200).json({
      notifications: populatedNotifications,
      totalRecords,
      totalPages,
      currentPage: pageNumber,
      hasNextPage: skip + pageSize < totalRecords,
      hasPreviousPage: skip > 0,
      nextPage: pageNumber + 1,
      previousPage: pageNumber - 1
    });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};



exports.getAdminNotificationsForUser = async (req, res) => {
  try {
    const { page = 1, limit = 100 } = req.query;
    
    const pageNumber = parseInt(page, 10);
    const pageSize = parseInt(limit, 10);
    const skip = (pageNumber - 1) * pageSize;

    const totalRecords = await AdminNotifications.countDocuments();

    const notifications = await AdminNotifications.find()
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(pageSize)
      .populate('notificationBy', 'basicDetails.name userId');

    const totalPages = Math.ceil(totalRecords / pageSize);

    res.status(200).json({
      notifications,
      totalRecords,
      totalPages,
      currentPage: pageNumber,
      hasNextPage: skip + pageSize < totalRecords,
      hasPreviousPage: skip > 0,
      nextPage: pageNumber + 1,
      previousPage: pageNumber - 1
    });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};


exports.getAllUsersNotificationsForAdmin = async (req, res) => {
  try {
    const { page = 1, limit = 100 } = req.query;
    
    const pageNumber = parseInt(page, 10);
    const pageSize = parseInt(limit, 10);
    const skip = (pageNumber - 1) * pageSize;

    const totalRecords = await Notifications.countDocuments();

    const notifications = await Notifications.find()
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(pageSize)
      .populate('notificationBy', 'basicDetails.name userId')
      .populate('notificationTo', 'basicDetails.name userId');

    const totalPages = Math.ceil(totalRecords / pageSize);

    res.status(200).json({
      notifications,
      totalRecords,
      totalPages,
      currentPage: pageNumber,
      hasNextPage: skip + pageSize < totalRecords,
      hasPreviousPage: skip > 0,
      nextPage: pageNumber + 1,
      previousPage: pageNumber - 1
    });
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
      const notification = await Notifications.findOneAndUpdate(
        {
          notificationTo: receiverId,
          notificationBy: senderId,
          notificationType: notificationType,
        },
        {
          notificationTo: receiverId,
          notificationBy: senderId,
          notificationText: `You have received a ${notificationType?.toLowerCase()} notification from user ${senderId}`,
          notificationType: notificationType,
        },
        {
          new: true, // Return the updated document
          upsert: true, // Create the document if it doesn't exist
          setDefaultsOnInsert: true, // Apply default values if creating
        }
      );
  
      // Find all admin users
      const formattedNotification = await populateNotificationOfUsersForAdmin(notification);
      sendNotificationToAdmins(formattedNotification);
      // // Emit the notification to all admins
  
    } catch (error) {
      console.log('Error sending notification:', error);
    }
  };