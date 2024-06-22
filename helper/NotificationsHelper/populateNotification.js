const { getSignedUrlFromS3 } = require("../../utils/s3Utils");
const Notifications = require("../../models/notifications");
const AdminNotifications = require("../../models/adminNotification");

const populateNotification = async (notification) => {
  const populatedNotification = await Notifications.findById(notification._id)
    .populate('notificationBy', 'basicDetails.name userId selfDetails.profilePicture')
    .populate('notificationTo', 'basicDetails.name userId selfDetails.profilePicture');

    let profilePictureUrlBy = "";
    if (populatedNotification.notificationBy?.selfDetails?.[0]?.profilePicture) {
      profilePictureUrlBy = await getSignedUrlFromS3(populatedNotification.notificationBy.selfDetails[0].profilePicture);
      populatedNotification.notificationBy.selfDetails[0].profilePictureUrl = profilePictureUrlBy || "";
    }
  
    let profilePictureUrlTo = "";
    if (populatedNotification.notificationTo?.selfDetails?.[0]?.profilePicture) {
      profilePictureUrlTo = await getSignedUrlFromS3(populatedNotification.notificationTo.selfDetails[0].profilePicture);
      populatedNotification.notificationTo.selfDetails[0].profilePictureUrl = profilePictureUrlTo || "";
    }

  const formattedNotification = {
    notificationBy: {
      ...populatedNotification.notificationBy.toObject(),
      selfDetails: {
        ...populatedNotification.notificationBy.selfDetails[0],
        profilePictureUrl: profilePictureUrlBy,
      },
      basicDetails: populatedNotification.notificationBy?.basicDetails[0]?.name
    },
    notificationTo: {
      ...populatedNotification.notificationTo.toObject(),
      selfDetails: {
        ...populatedNotification.notificationTo.selfDetails[0],
        profilePictureUrl: profilePictureUrlTo,
      },
      basicDetails: populatedNotification.notificationTo?.basicDetails[0]?.name
    },
    notificationText: populatedNotification.notificationText,
    notificationType: populatedNotification.notificationType,
    _id: populatedNotification._id,
  };

  return formattedNotification;
};

const populateAdminNotification = async (notification) => {
  const populatedNotification = await AdminNotifications.findById(notification._id)
    .populate('notificationBy', 'basicDetails.name userId selfDetails.profilePicture')

  let profilePictureUrlBy = "";
  if (populatedNotification.notificationBy?.selfDetails?.[0]?.profilePicture) {
    profilePictureUrlBy = await getSignedUrlFromS3(populatedNotification.notificationBy.selfDetails[0].profilePicture);
    populatedNotification.notificationBy.selfDetails[0].profilePictureUrl = profilePictureUrlBy || "";
  }


  const formattedNotification = {
    notificationBy: {
      ...populatedNotification.notificationBy.toObject(),
      selfDetails: {
        ...populatedNotification.notificationBy?.selfDetails[0],
        profilePictureUrl: profilePictureUrlBy,
      },
      basicDetails: populatedNotification.notificationBy?.basicDetails[0]?.name
    },
    notificationText: populatedNotification.notificationText,
    notificationType: populatedNotification.notificationType,
    _id: populatedNotification._id,
  };

  return formattedNotification;
};

module.exports = { populateNotification, populateAdminNotification };
