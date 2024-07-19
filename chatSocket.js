// chatSocket.js
const getUserDetailsFromToken = require("./helper/getUserDetailsFromToken");
const User = require("./models/Users");
const {
  MessageModel,
} = require("./models/conversationModel");
const {
  checkAcceptedInterestRequest,
} = require("./middleware/checkAcceptedInterestRequest");
const { getConversations } = require("./helper/getConversationData");
const { sendAndCreateNotification } = require("./controllers/notificationController");

const onlineUsers = new Map();

const getConversationsWithOnlineStatus = async (userId) => {
  const conversations = await getConversations(userId);
  return conversations.map(conversation => {
    const isOnline = onlineUsers.has(conversation._id.toString());
    return {
      ...conversation,
      isOnline,
    };
  });
};

exports.chatSocket = async (socket) => {
  socket.on("ONLINE", async (userId) => {
    socket.join(userId);
    onlineUsers.set(userId, socket.id);
    socket.broadcast.emit("USER_ONLINE");
    console.log(`${userId} connected: ${socket.id}`);
  });

  socket.on("OFFLINE", (userId) => {
    onlineUsers.delete(userId);
    socket.broadcast.emit("USER_OFFLINE");
    console.log(`${userId} disconnected: ${socket.id}`);
  });

  socket.on("disconnect", () => {
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
      console.log(`${disconnectedUserId} disconnected: ${socket.id}`);
    }
  });

  socket.on("ON_CHAT_PAGE", async (userId) => {
      const data = await getConversationsWithOnlineStatus(userId);
      console.log("ON_CHAT_PAGE", data);
      socket.emit("CHAT_LISTING_ON_PAGE", data);
  });

  socket.on("ON_CHAT_INITIATED", async (data) => {
    const messages = await checkAcceptedInterestRequest(data);
    console.log("ON_CHAT_INITIATED", data);
    socket.emit("ALL_CHAT_MESSAGES", messages);
  });

  socket.on("ON_NEW_MESSAGE", async (data) => {
    try {
      // console.log(data);
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
      // socket.broadcast.emit(`NEW_MESSAGE`, savedMessage);
      socket.emit(`NEW_MESSAGE`, savedMessage);
      if (onlineUsers.has(data.receiver)) {
        socket.to(onlineUsers.get(data.receiver)).emit(`NEW_MESSAGE`, savedMessage);
      }

      // Update conversation listing for the sender and receiver
      // const otherUserIdConversation = await getConversationsWithOnlineStatus(data.receiver);

      // const conversation = await getConversationsWithOnlineStatus(data.sender);
      // socket.emit("CHAT_LISTING_ON_PAGE", conversation);

      // Fetch and emit updated conversation list to both users
      const senderConversations = await getConversationsWithOnlineStatus(data.sender);
      const receiverConversations = await getConversationsWithOnlineStatus(data.receiver);
      console.log("NEW_MESSAGE", senderConversations, receiverConversations);
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

      const { userId, messageId, message } = data;

      // Find the message by ID
      const originalMessage = await MessageModel.findById(messageId);
  
      if (!originalMessage) {
        socket.emit("error", { message: "Message not found" });
        return;
      }
  
      // Check if the userId matches the senderId of the message
      if (originalMessage.sender.toString() !== userId) {
        socket.emit("error", { message: "You are not authorized to edit this message" });
        return;
      }
  
      // Update the message text and save
      originalMessage.text = message;
      originalMessage.isEdited = true;
      const updatedMessage = await originalMessage.save();
  
      console.log(`Message with ID ${messageId} updated`);
  
      // Notify other clients about the update
      // socket.broadcast.emit(`EDIT_MESSAGE`, updatedMessage);
      socket.emit(`EDIT_MESSAGE`, updatedMessage);
      if (onlineUsers.has(originalMessage.receiver.toString())) {
        socket.to(onlineUsers.get(originalMessage.receiver.toString())).emit(`EDIT_MESSAGE`, updatedMessage);
      }

      const senderConversations = await getConversationsWithOnlineStatus(userId);
      const receiverConversations = await getConversationsWithOnlineStatus(originalMessage.receiver);
      console.log("ON_EDIT_MESSAGE", senderConversations, receiverConversations);
      socket.emit("CHAT_LISTING_ON_PAGE", senderConversations);
      if (onlineUsers.has(originalMessage.receiver.toString())) {
        socket.to(onlineUsers.get(originalMessage.receiver.toString())).emit("CHAT_LISTING_ON_PAGE", receiverConversations);
      }
    } catch (error) {
      console.error("Error updating message:", error);
      socket.emit("error", { message: "Error updating message" });
    }
  });

  socket.on("ON_DELETE_MESSAGE", async (data) => {
    try {
      // console.log(data);
      const { messageId, userId, userType } = data; // userType can be 'sender' or 'receiver'

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
      // socket.broadcast.emit(`DELETE_MESSAGE`, { ...updatedMessage.toObject(), isToBeDeleted });
      if (onlineUsers.has(message.receiver.toString())) {
        socket.to(onlineUsers.get(message.receiver.toString())).emit(`DELETE_MESSAGE`, { ...updatedMessage.toObject(), isToBeDeleted });
      }

      const senderConversations = await getConversationsWithOnlineStatus(userId);
      const receiverConversations = await getConversationsWithOnlineStatus(message.receiver);
      console.log("ON_DELETE_MESSAGE", senderConversations, receiverConversations);
      socket.emit("CHAT_LISTING_ON_PAGE", senderConversations);
      if (onlineUsers.has(message.receiver.toString())) {
        socket.to(onlineUsers.get(message.receiver.toString())).emit("CHAT_LISTING_ON_PAGE", receiverConversations);
      }
    } catch (error) {
      console.error("Error deleting message:", error);
      socket.emit("error", { message: "Error deleting message" });
    }
  });

  socket.on("ON_MESSAGE_SEEN", async (data) => {
    try {
      const { userId, messageId } = data;
      // Find the message by its ID and update its seen flag
      const updatedMessage = await MessageModel.findOneAndUpdate(
        { _id: messageId, receiver : userId },
        { $set: { seen: true } },
        { new: true }
      );
  
      if (!updatedMessage) {
        throw new Error("Message not found");
      }
  
      // Emit the updated conversations back to both users
      // socket.emit("ON_SEEN", updatedMessage);
      // socket.broadcast.emit("ON_SEEN", updatedMessage);
      if (onlineUsers.has(updatedMessage.sender.toString())) {
        socket.to(onlineUsers.get(updatedMessage.sender.toString())).emit("ON_SEEN", updatedMessage);
      }
      if (onlineUsers.has(updatedMessage.receiver.toString())) {
        socket.to(onlineUsers.get(updatedMessage.receiver.toString())).emit("ON_SEEN", updatedMessage);
      }

      // Fetch and emit updated conversation list to both users
      const userIdConversations = await getConversationsWithOnlineStatus(updatedMessage.receiver);
      const senderConversations = await getConversationsWithOnlineStatus(updatedMessage.sender);
      console.log("ON_MESSAGE_SEEN", senderConversations, userIdConversations);
      if (onlineUsers.has(updatedMessage.receiver.toString())) {
        socket.to(onlineUsers.get(updatedMessage.receiver.toString())).emit("CHAT_LISTING_ON_PAGE", userIdConversations);
      }
      if (onlineUsers.has(updatedMessage.sender.toString())) {
        socket.to(onlineUsers.get(updatedMessage.sender.toString())).emit("CHAT_LISTING_ON_PAGE", senderConversations);
      }
    } catch (error) {
      console.error("Error updating seen status:", error);
    }
  });
};
