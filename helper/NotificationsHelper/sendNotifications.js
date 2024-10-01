const axios = require('axios');
const dotenv = require("dotenv");
const User = require("../../models/Users");
const io = require("../../socket");
const { events } = require("../../utils/eventsConstants");

dotenv.config();

const FRONTEND_URL = process.env.FRONTEND_URL

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

exports.sendApprovedNotificationToUser = async (data) => {
    try {

        // OneSignal notification payload
        const notificationData = {
            app_id: process.env.ONESIGNAL_APP_ID,
            contents: { en: 'Your profile has been approved by an admin!' },
            include_player_ids: [...data],
            url: `${FRONTEND_URL}/user-dashboard`,
        };

        // Send notification
        await sendPushNotification(notificationData);
    } catch (error) {
        console.error("Error sending approval notification to users:", error);
    }
};

exports.sendNotificationToAdmins = async (formattedNotification, notificationType = "") => {
    try {
        if(notificationType === "approval"){
            // Find all admin users
            const admins = await User.find({ accessType : '0' }); // Adjust the query based on your user schema
            const adminIds = admins.map(admin => admin._id);
            // Emit the notification to all admins
            adminIds.forEach(adminId => {
              io.getIO().emit(`${events.ADMINNOTIFICATION}/${adminId}`, formattedNotification);
            });
            // Extract all browserIds (as arrays) from users
            const browserIds = admins?.map(user => user.browserIds) // Extract browserIds array
            .flat() // Flatten the array of arrays
            .filter(id => id); // Ensure non-null browserIds

            // OneSignal notification payload
            const notificationData = {
                app_id: process.env.ONESIGNAL_APP_ID,
                contents: { en: `${formattedNotification?.notificationBy?.basicDetails} requested for profile approval` },
                include_player_ids: [...browserIds],
                url: `${FRONTEND_URL}/admin/approval-lists?page=1`,
            };

            // Send notification
            await sendPushNotification(notificationData);
        }else{
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

            if(notificationType === "reported"){
                // OneSignal notification payload
                const notificationData = {
                    app_id: process.env.ONESIGNAL_APP_ID,
                    contents: { en: `${formattedNotification?.notificationBy?.name || "user"} reported ${formattedNotification?.notificationTo?.name || "user"}` },
                    include_player_ids: [...browserIds],
                    url: `${FRONTEND_URL}/admin/report-lists`,
                };

                // Send notification
                await sendPushNotification(notificationData);
            }
        }
    } catch (error) {
        console.error("Error sending notification to admins:", error);
    }
};

// Function to send chat initiation notifications
exports.sendNotificationForChatInitiation = async (formattedNotification, requestBy, requestTo) => {
    try {
        const chatUrl = `${FRONTEND_URL}/chat`;
        
        // Set up a 2-second delay to trigger the INITIATE_CHAT_WITH_USER event
        setTimeout(() => {
            io.getIO().emit(`${events.INITIATECHATWITHUSER}/${requestBy}`, formattedNotification);
            io.getIO().emit(`${events.INITIATECHATWITHUSER}/${requestTo}`, formattedNotification);
        }, 2000); // 2000 ms = 2 seconds

        // Fetch browserIds and basicDetails for both requestBy and requestTo users
        const users = await User.find({ _id: { $in: [requestBy, requestTo] } }).select('_id browserIds basicDetails');

        // Separate out the requestBy and requestTo users
        const userBy = users.find(user => String(user._id) === String(requestBy));
        const userTo = users.find(user => String(user._id) === String(requestTo));

        console.log(userTo);
        // Ensure we have the basic details and name from both users
        const userByName = userBy?.basicDetails[0]?.name || 'Another user';
        const userToName = userTo?.basicDetails[0]?.name || 'Another user';

        // Extract all browserIds (as arrays) from users
        const browserIdsBy = userBy?.browserIds || [];
        const browserIdsTo = userTo?.browserIds || [];

        // Send OneSignal notification to requestTo user (mentioning requestBy's name)
        if (browserIdsTo.length > 0) {
            const notificationDataTo = {
                app_id: process.env.ONESIGNAL_APP_ID,
                headings: { en: 'Chat' },
                contents: { en: `You can now initiate a chat with ${userByName}` }, // Mention requestBy's name
                include_player_ids: [...browserIdsTo],
                url: chatUrl,
            };
            
            setTimeout(async () => {
                await sendPushNotification(notificationDataTo);
            }, 2000);
        }

        // Send OneSignal notification to requestBy user (mentioning requestTo's name)
        if (browserIdsBy.length > 0) {
            const notificationDataBy = {
                app_id: process.env.ONESIGNAL_APP_ID,
                headings: { en: 'Chat' },
                contents: { en: `You can now initiate a chat with ${userToName}` }, // Mention requestTo's name
                include_player_ids: [...browserIdsBy],
                url: chatUrl,
            };
            
            setTimeout(async () => {
                await sendPushNotification(notificationDataBy);
            }, 2000);
        }

    } catch (error) {
        console.error("Error sending notification for chat initiation:", error);
    }
};


exports.sendNotificationForRequests = async (formattedNotification, requestBy, requestTo, type) => {
    try {
        // Emit notification event
        io.getIO().emit(`${events.NOTIFICATION}/${requestBy}`, formattedNotification);
        io.getIO().emit(`${events.NOTIFICATION}/${requestTo}`, formattedNotification);

        // Fetch browserIds for both requestBy and requestTo users
        let users;
        let redirectUrl;
        let content;
        let otherUser;
        // Set the redirect URL based on the notification type
        switch (type) {
            case 'interestRequestSent':
                redirectUrl = `${FRONTEND_URL}/inbox/interests/recieved`;
                users = await User.find({ _id: { $in: [requestTo] } }).select('_id browserIds');
                content = "You recieved a interest request."
                break;
            case 'profileRequestSent':
                redirectUrl = `${FRONTEND_URL}/inbox/profiles/recieved`;
                users = await User.find({ _id: { $in: [requestTo] } }).select('_id browserIds');
                content = "You recieved a profile request."
                break;
            case 'interestRequestAccepted':
                redirectUrl = `${FRONTEND_URL}/inbox/interests/accepted`;
                users = await User.find({ _id: { $in: [requestBy] } }).select('_id basicDetails browserIds');
                otherUser = await User.findById(requestTo).select('_id basicDetails'); // Fetching single user
                content = `Your interest request to ${Array.isArray(otherUser.basicDetails) ? otherUser.basicDetails[0]?.name : "user"} was accepted.`;
                break;
            case 'profileRequestAccepted':
                redirectUrl = `${FRONTEND_URL}/inbox/profiles/accepted`;
                users = await User.find({ _id: { $in: [requestBy] } }).select('_id basicDetails browserIds');
                otherUser = await User.findById(requestTo).select('_id basicDetails'); // Fetching single user
                content = `Your profile request to ${Array.isArray(otherUser.basicDetails) ? otherUser.basicDetails[0]?.name : "user"} was accepted.`;
                break;
            default:
                redirectUrl = `${FRONTEND_URL}/`;
                users = await User.find({ _id: { $in: [requestBy] } }).select('_id browserIds');
                content = "You have a new notification."
                break;
        }
        
        // Extract all browserIds (as arrays) from users
        const browserIds = users?.map(user => user.browserIds)
            .flat()
            .filter(id => id); // Ensure non-null browserIds

        if (browserIds?.length > 0) {
            // OneSignal notification payload
            const notificationData = {
                app_id: process.env.ONESIGNAL_APP_ID,
                headings: { en: 'Inbox' },
                contents: { en: content },
                include_player_ids: [...browserIds],
                url: redirectUrl, // Use the dynamic redirect URL based on the notification type
            };

            // Send notification
            await sendPushNotification(notificationData);
        }
    } catch (error) {
        console.error("Error sending notification for sent Requests:", error);
    }
};

exports.sendNotificationOnNewMessage = async (data) => {
    try {
        const chatUrl = `${FRONTEND_URL}/chat`
        console.log(data, "trigger newmessage push notification")
        // Fetch sender and receiver data from the database, including browserIds
        const sender = await User.findById(data.sender).select('_id basicDetails selfDetails browserIds');
        const receiver = await User.findById(data.receiver).select('_id browserIds');
        
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
            receiver: data.receiver, // The recipient's ID
            timestamp: sender.createdAt, // Add a timestamp if needed
        };

        console.log(events.ONMESSAGENOTIFICATION);
        io.getIO().emit(`${events.ONMESSAGENOTIFICATION}/${data.receiver}`, formattedNotificationData);

        // Format the notification message
        const messageContent = `${sender.basicDetails.firstName} sent you a message: ${data.message}`;
        
        // Extract browserIds for both sender and receiver
        const browserIds = [...(receiver.browserIds || [])].filter(id => id); // Ensure non-null browserIds

        // OneSignal notification payload
        const notificationData = {
            app_id: process.env.ONESIGNAL_APP_ID,
            headings: { en: 'New Message' },
            contents: { en: messageContent },
            include_player_ids: [...browserIds],
            url: chatUrl,
        };

        // Send notification
        await sendPushNotification(notificationData);
    } catch (error) {
        console.error("Error sending notification to the receiver:", error);
    }
};
