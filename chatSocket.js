// chatSocket.js
const User = require("./models/Users");
const {
  MessageModel,
} = require("./models/conversationModel");
const {
  checkAcceptedInterestRequest,
} = require("./middleware/checkAcceptedInterestRequest");
const { sendAndCreateNotification } = require("./controllers/notificationController");
const { getConversationsWithOnlineStatus, updateLastLogin, getUnseenMessages } = require("./helper/socketHelperMethods/socketHelpers");
const { sendNotificationOnNewMessage } = require("./helper/NotificationsHelper/sendNotifications");

const onlineUsers = new Map();

exports.chatSocket = async (socket) => {
  socket.on("ONLINE", async (userId) => {
    socket.join(userId);
    onlineUsers.set(userId, socket.id);
    socket.broadcast.emit("USER_ONLINE");
    console.log(`${userId} connected: ${socket.id}`);
  });

  socket.on("OFFLINE", async (userId) => {
    onlineUsers.delete(userId);
    socket.broadcast.emit("USER_OFFLINE");
    // await updateLastLogin(userId, "logged out");
    console.log(`${userId} disconnected: ${socket.id}`);
  });

  socket.on("disconnect", async () => {
    let disconnectedUserId;
    for (let [userId, id] of onlineUsers) {
      if (id === socket.id) {
        disconnectedUserId = userId;
        onlineUsers.delete(userId);
        break;
      }
    }
    if (disconnectedUserId) {
      socket.broadcast.emit("USER_OFFLINE", disconnectedUserId);
      socket.emit("USER_OFFLINE", disconnectedUserId);
      await updateLastLogin(disconnectedUserId, "logged out");
      console.log(`${disconnectedUserId} disconnected: ${socket.id}`);
    }
  });

  socket.on("ON_CHAT_PAGE", async (userId) => {
      const data = await getConversationsWithOnlineStatus(userId, onlineUsers);
      // console.log("ON_CHAT_PAGE", data);
      socket.emit("CHAT_LISTING_ON_PAGE", data);
  });

  socket.on("ON_CHAT_INITIATED", async (data) => {
    const messages = await checkAcceptedInterestRequest(data, data?.page || 1, data?.limit || 20);
    // console.log("ON_CHAT_INITIATED", data);
    socket.emit("ALL_CHAT_MESSAGES", messages);
  });

  socket.on("UNSEEN_MESSAGES", async (userId) => {
    try {
      const unseenMessagesCount = await getUnseenMessages(userId);
      socket.emit("UNSEEN_MESSAGES", unseenMessagesCount);
    } catch (error) {
      console.error("Error fetching unseen messages:", error);
    }
  });

  socket.on("ON_NEW_MESSAGE", async (data) => {
    try {
    // Check if there are existing messages between sender and receiver
      const existingMessage = await MessageModel.findOne({
        $or: [
          { sender: data.sender, receiver: data.receiver },
          { sender: data.receiver, receiver: data.sender },
        ],
      });
      if (!existingMessage) {
        // Call notification function here if no existing messages
        await sendAndCreateNotification(data.sender, data.receiver, 'chatinitiated');
        console.log("Calling notification function...");
      }
      const newMessage = new MessageModel({
        text: data.message,
        sender: data.sender,
        receiver: data.receiver,
      });

      const savedMessage = await newMessage.save();
      await sendNotificationOnNewMessage(data);
      
      // socket.broadcast.emit(`NEW_MESSAGE`, savedMessage);
      socket.emit(`NEW_MESSAGE`, savedMessage);
      if (onlineUsers.has(data.receiver)) {
        socket.to(onlineUsers.get(data.receiver)).emit(`NEW_MESSAGE`, savedMessage);
      }

      // Fetch and emit updated conversation list to both users
      const senderConversations = await getConversationsWithOnlineStatus(data.sender, onlineUsers);
      const receiverConversations = await getConversationsWithOnlineStatus(data.receiver, onlineUsers);
      // console.log("NEW_MESSAGE", senderConversations, receiverConversations);
      socket.emit("CHAT_LISTING_ON_PAGE", senderConversations);
      if (onlineUsers.has(data.receiver)) {
        socket.to(onlineUsers.get(data.receiver)).emit("CHAT_LISTING_ON_PAGE", receiverConversations);
      }
    } catch (error) {
      console.error("Error creating new message:", error);
      socket.emit("error", { message: "Error creating new message" });
    }
  });

  socket.on("ON_EDIT_MESSAGE", async (data) => {
    try {

      const { senderId, receiverId, messageId, message } = data;

      // Find the message by ID
      const originalMessage = await MessageModel.findById(messageId);
  
      if (!originalMessage) {
        socket.emit("error", { message: "Message not found" });
        return;
      }
  
      // Check if the senderId matches the senderId of the message
      if (originalMessage.sender.toString() !== senderId) {
        socket.emit("error", { message: "You are not authorized to edit this message" });
        return;
      }
  
      // Update the message text and save
      originalMessage.text = message;
      originalMessage.isEdited = true;
      const updatedMessage = await originalMessage.save();
  
      console.log(`Message with ID ${messageId} updated`);
  
      // Notify other clients about the update
      socket.emit(`EDIT_MESSAGE`, updatedMessage);
      if (onlineUsers.has(receiverId)) {
        socket.to(onlineUsers.get(receiverId)).emit(`EDIT_MESSAGE`, updatedMessage);
      }

      const senderConversations = await getConversationsWithOnlineStatus(senderId, onlineUsers);
      const receiverConversations = await getConversationsWithOnlineStatus(receiverId, onlineUsers);
      // console.log("ON_EDIT_MESSAGE", senderConversations, receiverConversations);
      socket.emit("CHAT_LISTING_ON_PAGE", senderConversations);
      if (onlineUsers.has(receiverId)) {
        socket.to(onlineUsers.get(receiverId)).emit("CHAT_LISTING_ON_PAGE", receiverConversations);
      }
    } catch (error) {
      console.error("Error updating message:", error);
      socket.emit("error", { message: "Error updating message" });
    }
  });

  socket.on("ON_DELETE_MESSAGE", async (data) => {
    try {
      const { senderId, receiverId, messageId, userType } = data; // userType can be 'sender' or 'receiver'

      console.log(messageId, senderId, receiverId, userType)
      // Find the message by ID
      const message = await MessageModel.findById(messageId);

      if (!message) {
        socket.emit("error", { message: "Message not found" });
        return;
      }

      // Check if the message is the latest one in the conversation
      const latestMessage = await MessageModel.findOne({
        $or: [
          { sender: message.sender, receiver: message.receiver },
          { sender: message.receiver, receiver: message.sender },
        ],
      }).sort({ createdAt: -1 });

      const isLatestMessage =
        latestMessage && latestMessage._id.toString() === messageId;
        
      let updatedMessage;
      let isToBeDeleted = false;
      if (userType === "sender" && isLatestMessage) {
        // If the delete request comes from the sender and the message is the latest, delete it completely
        updatedMessage = await MessageModel.findByIdAndDelete(messageId);
        isToBeDeleted = true;
        console.log(
          `Message with ID ${messageId} deleted completely by sender`
        );
      } else {
        // Otherwise, update the visibility status
        let update;
        if (userType === "sender") {
          update = { senderVisible: false };
        } else if (userType === "receiver") {
          update = { receiverVisible: false };
        } else {
          socket.emit("error", { message: "Invalid user type" });
          return;
        }
        updatedMessage = await MessageModel.findByIdAndUpdate(messageId, update, { new: true });
        console.log(`Message with ID ${messageId} updated for ${userType}`);
      }

      // Notify the client about the update
      socket.emit(`DELETE_MESSAGE`, { ...updatedMessage.toObject(), isToBeDeleted });
      if (onlineUsers.has(receiverId)) {
        socket.to(onlineUsers.get(receiverId)).emit(`DELETE_MESSAGE`, { ...updatedMessage.toObject(), isToBeDeleted });
      }
      if (onlineUsers.has(senderId)) {
        socket.to(onlineUsers.get(senderId)).emit(`DELETE_MESSAGE`, { ...updatedMessage.toObject(), isToBeDeleted });
      }

      const senderConversations = await getConversationsWithOnlineStatus(senderId, onlineUsers);
      const receiverConversations = await getConversationsWithOnlineStatus(receiverId, onlineUsers);
      socket.emit("CHAT_LISTING_ON_PAGE", senderConversations);
      if (onlineUsers.has(receiverId)) {
        socket.to(onlineUsers.get(receiverId)).emit("CHAT_LISTING_ON_PAGE", receiverConversations);
      }
    } catch (error) {
      console.error("Error deleting message:", error);
      socket.emit("error", { message: "Error deleting message" });
    }
  });

  socket.on("ON_MESSAGE_SEEN", async (data) => {
    try {
      const { receiverId, senderId } = data;

          // Find all messages between sender and receiver that are not seen and update their seen flag
      const updateResult = await MessageModel.updateMany(
        { sender: senderId, receiver: receiverId, seen: false },
        { $set: { seen: true } }
      );

      if (updateResult.modifiedCount === 0) {
        throw new Error("No messages found to update");
      }
      // Find the message by its ID and update its seen flag
      // Fetch only the messages that were just updated
      const updatedMessages = await MessageModel.find({
        sender: senderId,
        receiver: receiverId,
        seen: true,
      })
      .sort({ updatedAt: -1 }) // Sort by updated time in descending order
      .limit(updateResult.modifiedCount); // Limit to the number of messages that were updated
  
      // Emit the updated conversations back to both users
      if (onlineUsers.has(senderId)) {
        socket.to(onlineUsers.get(senderId)).emit("ON_SEEN", updatedMessages);
      }
      if (onlineUsers.has(receiverId)) {
        socket.to(onlineUsers.get(receiverId)).emit("ON_SEEN", updatedMessages);
      }
      socket.emit("ON_SEEN", updatedMessages);

      // Fetch and emit updated conversation list to both users
      const userIdConversations = await getConversationsWithOnlineStatus(receiverId, onlineUsers);
      const senderConversations = await getConversationsWithOnlineStatus(senderId, onlineUsers);
      console.log("ON_MESSAGE_SEEN", senderConversations, userIdConversations);
      if (onlineUsers.has(receiverId)) {
        socket.to(onlineUsers.get(receiverId)).emit("CHAT_LISTING_ON_PAGE", userIdConversations);
      }
      if (onlineUsers.has(senderId)) {
        socket.to(onlineUsers.get(senderId)).emit("CHAT_LISTING_ON_PAGE", senderConversations);
      }
    } catch (error) {
      console.error("Error updating seen status:", error);
    }
  });
};
