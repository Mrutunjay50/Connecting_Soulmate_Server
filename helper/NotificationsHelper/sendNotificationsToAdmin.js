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