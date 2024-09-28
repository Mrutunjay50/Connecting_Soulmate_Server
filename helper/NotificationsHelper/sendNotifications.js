const axios = require('axios');
const dotenv = require("dotenv");
const User = require("../../models/Users");
const io = require("../../socket");
const { events } = require("../../utils/eventsConstants");

dotenv.config();

// Function to send notifications via OneSignal API
const sendPushNotification = async (data) => {
    try {
      const response = await axios.post('https://api.onesignal.com/notifications', data, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Basic ${process.env.ONESIGNAL_API_KEY}`, // REST API Key
        },
      });
      console.log('Push notification sent successfully:', response.data);
    } catch (error) {
      console.error('Error sending push notification:', error.response.data);
    }
};

exports.sendNotificationToAdmins = async (formattedNotification) => {
    try {
      const adminAndSpecialUsers = await User.find({ accessType: { $in: [0, 1] } }).select('_id');
  
      adminAndSpecialUsers.forEach(user => {
        io.getIO().emit(`${events.NOTIFICATION}/${user._id}`, formattedNotification);
      });

      // OneSignal notification payload
      const notificationData = {
        app_id: process.env.ONESIGNAL_APP_ID,
        // contents: { en: formattedNotification },
        contents: { en: 'You have a new notification' },
        include_aliases : {"external_id": externalUserIds},
      };
  
      // Send notification
      await sendPushNotification(notificationData);
    } catch (error) {
      console.error("Error sending notification to admins:", error);
    }
};

exports.sendNotificationForChatInitiation = async (formattedNotification, requestBy, requestTo) => {
    try {
      // Set up a 2-second delay to trigger the INITIATE_CHAT_WITH_USER event
      setTimeout(() => {
        io.getIO().emit(`${events.INITIATECHATWITHUSER}/${requestBy}`, formattedNotification);
        io.getIO().emit(`${events.INITIATECHATWITHUSER}/${requestTo}`, formattedNotification);
      }, 2000); // 2000 ms = 2 seconds

      const notificationData = {
        app_id: process.env.ONESIGNAL_APP_ID,
        // contents: { en: formattedNotification },
        contents: { en: 'You can now initiate a chat with a user' },
        include_aliases : {"external_id": [requestBy]},
      };
      await sendPushNotification(notificationData);
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
        // Format the notification message
        const messageContent = `${sender.basicDetails.firstName} sent you a message: ${data.message}`;

        // OneSignal notification payload
        const notificationData = {
          app_id: process.env.ONESIGNAL_APP_ID,
        //   contents: { en: messageContent },
          contents: { en: `You have a new message: ${data.message}` },
          include_aliases : {"external_id": [data.reciever]},
        };

        // Send notification
        await sendPushNotification(notificationData);
    } catch (error) {
        console.error("Error sending notification to the reciever:", error);
    }
};