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
        // Fetch admin and special users, including their browserIds
        const adminAndSpecialUsers = await User.find({ accessType: { $in: [0, 1] } }).select('_id browserIds');
        
        adminAndSpecialUsers.forEach(user => {
            io.getIO().emit(`${events.NOTIFICATION}/${user._id}`, formattedNotification);
        });

        // Extract all browserIds (as arrays) from users
        const browserIds = adminAndSpecialUsers
            .map(user => user.browserIds) // Extract browserIds array
            .flat() // Flatten the array of arrays
            .filter(id => id); // Ensure non-null browserIds

        // OneSignal notification payload
        const notificationData = {
            app_id: process.env.ONESIGNAL_APP_ID,
            contents: { en: 'You have a new notification' },
            include_player_ids: [...browserIds],
        };

        // Send notification
        await sendPushNotification(notificationData);
    } catch (error) {
        console.error("Error sending notification to admins:", error);
    }
};

// Function to send chat initiation notifications
exports.sendNotificationForChatInitiation = async (formattedNotification, requestBy, requestTo) => {
    try {
        // Set up a 2-second delay to trigger the INITIATE_CHAT_WITH_USER event
        setTimeout(() => {
            io.getIO().emit(`${events.INITIATECHATWITHUSER}/${requestBy}`, formattedNotification);
            io.getIO().emit(`${events.INITIATECHATWITHUSER}/${requestTo}`, formattedNotification);
        }, 2000); // 2000 ms = 2 seconds

        // Fetch browserIds for both requestBy and requestTo users
        const users = await User.find({ _id: { $in: [requestBy, requestTo] } }).select('_id browserIds');
        
        // Extract all browserIds (as arrays) from users
        const browserIds = users
            .map(user => user.browserIds)
            .flat()
            .filter(id => id); // Ensure non-null browserIds

        if (browserIds?.length > 0) {
            // OneSignal notification payload
            const notificationData = {
                app_id: process.env.ONESIGNAL_APP_ID,
                contents: { en: 'You can now initiate a chat with a user' },
                include_player_ids: [...browserIds],
            };

            // Send notification
            await sendPushNotification(notificationData);
        }
    } catch (error) {
        console.error("Error sending notification for chat initiation:", error);
    }
};

exports.sendNotificationForRequests = async (formattedNotification, requestBy, requestTo) => {
    try {
        // Emit notification event
        io.getIO().emit(`${events.NOTIFICATION}/${requestBy}`, formattedNotification);
        io.getIO().emit(`${events.NOTIFICATION}/${requestTo}`, formattedNotification);

        // Fetch browserIds for both requestBy and requestTo users
        let users = await User.find({ _id: { $in: [requestBy] } }).select('_id browserIds');
        
        // Extract all browserIds (as arrays) from users
        const browserIds = users
            .map(user => user.browserIds)
            .flat()
            .filter(id => id); // Ensure non-null browserIds

        if (browserIds?.length > 0) {
            // OneSignal notification payload
            const notificationData = {
                app_id: process.env.ONESIGNAL_APP_ID,
                contents: { en: 'You have a new Notification' },
                include_player_ids: [...browserIds],
            };

            console.log('subscribed user Id', browserIds);

            // Send notification
            await sendPushNotification(notificationData);
        }
    } catch (error) {
        console.error("Error sending notification for sent Requests:", error);
    }
};

exports.sendNotificationOnNewMessage = async (data) => {
    try {
        // Fetch sender and receiver data from the database, including browserIds
        const sender = await User.findById(data.sender).select('_id basicDetails selfDetails browserIds');
        const receiver = await User.findById(data.reciever).select('_id browserIds');
        
        if (!sender) {
            throw new Error('Sender not found');
        }

        // Format the notification data
        const formattedNotificationData = {
            message: data.message, // The message content
            sender: {
                id: sender._id, // Sender ID
                basicDetails: sender.basicDetails || [], // Sender name
                avatarDetails: sender.selfDetails || [], // Sender profile picture
            },
            reciever: data.reciever, // The recipient's ID
            timestamp: sender.createdAt, // Add a timestamp if needed
        };

        console.log(events.ONMESSAGENOTIFICATION);
        io.getIO().emit(`${events.ONMESSAGENOTIFICATION}/${data.reciever}`, formattedNotificationData);

        // Format the notification message
        const messageContent = `${sender.basicDetails.firstName} sent you a message: ${data.message}`;
        
        // Extract browserIds for both sender and receiver
        const browserIds = [...(receiver.browserIds || [])].filter(id => id); // Ensure non-null browserIds

        // OneSignal notification payload
        const notificationData = {
            app_id: process.env.ONESIGNAL_APP_ID,
            contents: { en: messageContent },
            include_player_ids: [...browserIds],
        };

        // Send notification
        await sendPushNotification(notificationData);
    } catch (error) {
        console.error("Error sending notification to the receiver:", error);
    }
};
