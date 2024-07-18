const BlockedUser = require("../models/blockedUser");
const { MessageModel } = require("../models/conversationModel");
const { InterestRequests, ProfileRequests } = require("../models/interests");
const Notifications = require("../models/notifications");
const Report = require("../models/reports");
const ShortList = require("../models/shortlistUsers");

exports.deleteUserRelatedData = async (userId) => {
    try {
      // Delete from BlockedUser collection
      await BlockedUser.deleteMany({ $or: [{ blockedBy: userId }, { blockedUser: userId }] });
  
      // Delete from Request collection (both sent and received)
      await InterestRequests.deleteMany({ $or: [{ interestRequestBy: userId }, { interestRequestTo: userId }] });
      await ProfileRequests.deleteMany({ $or: [{ profileRequestBy: userId }, { profileRequestTo: userId }] });
      await Report.deleteMany({ $or: [{ reportedBy: userId }, { reportedOne: userId }] });
      await Notifications.deleteMany({ $or: [{ notificationTo: userId }, { notificationBy: userId }] });
      await MessageModel.deleteMany({ $or: [{ receiver: userId }, { sender: userId }] })
  
      // Delete from Shortlist collection (both sent and received)
      await ShortList.deleteMany({ $or: [{ user: userId }, { shortlistedUser: userId }] });
  
      // If there are other relevant collections, add similar deleteMany queries here
  
      return `User-related data for user ID ${userId} has been successfully deleted.`;
    } catch (error) {
      console.error("Error deleting user-related data:", error);
      throw new Error("Internal Server Error");
    }
  };