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
      console.error("Error sending notification to users for chatInitiation:", error);
    }
};


exports.sendNotificationOnNewMessage = async (data) => {
    try {
        // Fetch sender data from the database
        const sender = await User.findById(data.sender); // Assuming `data.sender` is the sender's ID
        
        if (!sender) {
            throw new Error('Sender not found');
        }
        // Format the notification data
        const formattedNotificationData = {
            message: data.message, // The message content
            sender: {
                id: sender._id, // Sender ID
                basicDetails : sender.basicDetails || [], // Sender name
                avatarDetails: sender.selfDetails || [], // Sender profile picture
            },
            reciever: data.reciever, // The recipient's ID
            timestamp: sender.createdAt, // Add a timestamp if needed
        };
        console.log(events.ONMESSAGENOTIFICATION);
        io.getIO().emit(`${events.ONMESSAGENOTIFICATION}/${data.reciever}`, formattedNotificationData);
    } catch (error) {
        console.error("Error sending notification to the reciever:", error);
    }
};