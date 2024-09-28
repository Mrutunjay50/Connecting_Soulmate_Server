const User = require("../../models/Users");
const io = require("../../socket");
const { events } = require("../../utils/eventsConstants");

exports.sendNotificationToAdmins = async (formattedNotification) => {
    try {
      const adminAndSpecialUsers = await User.find({ accessType: { $in: [0, 1] } }).select('_id');
  
      adminAndSpecialUsers.forEach(user => {
        io.getIO().emit(`${events.NOTIFICATION}/${user._id}`, formattedNotification);
      });
    } catch (error) {
      console.error("Error sending notification to admins:", error);
    }
};

exports.sendNotificationForChatInitiation = async (formattedNotification, requestBy, requestTo) => {
    try {
      // Set up a 2-second delay to trigger the INITIATE_CHAT_WITH_USER event
      setTimeout(() => {
        console.log(events.INITIATECHATWITHUSER);
        io.getIO().emit(`${events.INITIATECHATWITHUSER}/${requestBy}`, formattedNotification);
        io.getIO().emit(`${events.INITIATECHATWITHUSER}/${requestTo}`, formattedNotification);
      }, 2000); // 2000 ms = 2 seconds
    } catch (error) {
      console.error("Error sending notification to admins:", error);
    }
};


exports.sendNotificationOnNewMessage = async (data) => {
    try {
        console.log(events.ONMESSAGENOTIFICATION);
        io.getIO().emit(`${events.ONMESSAGENOTIFICATION}/${data.reciever}`, formattedNotification);
    } catch (error) {
        console.error("Error sending notification to admins:", error);
    }
};