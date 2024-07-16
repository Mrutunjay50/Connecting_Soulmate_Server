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

exports.chatSocket = async (socket) => {
  const onlineUser = new Set();
  const token = socket.handshake.auth.token || "";
  const user = await getUserDetailsFromToken(token);
  if (user) {
    socket.user = user; // Store user in socket for later use
    socket.join(user?._id?.toString());
    onlineUser.add(user?._id?.toString());
  } else {
    new Error("Authentication error");
    console.log("nakko no user here");
  }

  socket.on("ON_CHAT_PAGE", async (userId) => {
    const data = await getConversations(userId);
    socket.emit("CHAT_LISTING_ON_PAGE", data);
  });

  socket.on("ON_CHAT_INITIATED", async (data) => {
    console.log(data);
    const messages = await checkAcceptedInterestRequest(data);
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
      socket.broadcast.emit(`NEW_MESSAGE`, savedMessage);
      socket.emit(`NEW_MESSAGE`, savedMessage);
      const conversation = await getConversations(data.sender);
      socket.emit("CHAT_LISTING_ON_PAGE", conversation);
    } catch (error) {
      console.error("Error creating new message:", error);
      socket.emit("error", { message: "Error creating new message" });
    }
  });

  socket.on("ON_EDIT_MESSAGE", async (data) => {
    try {
      console.log(data);

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
      socket.broadcast.emit(`EDIT_MESSAGE`, updatedMessage);
      socket.emit(`EDIT_MESSAGE`, updatedMessage);

      // Update conversation listing for the sender
      const conversation = await getConversations(userId);
      socket.emit("CHAT_LISTING_ON_PAGE", conversation);
    } catch (error) {
      console.error("Error updating message:", error);
      socket.emit("error", { message: "Error updating message" });
    }
  });

  socket.on("ON_DELETE_MESSAGE", async (data) => {
    try {
      console.log(data);
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
      socket.broadcast.emit(`DELETE_MESSAGE`, { ...updatedMessage.toObject(), isToBeDeleted });

      // Fetch updated conversation
      const conversation = await getConversations(userId);
      socket.emit("CHAT_LISTING_ON_PAGE", conversation);
    } catch (error) {
      console.error("Error deleting message:", error);
      socket.emit("error", { message: "Error deleting message" });
    }
  });

  // socket.on("seen", async (msgByUserId) => {
  //   let conversation = await ConversationModel.findOne({
  //     $or: [
  //       { sender: user._id, receiver: msgByUserId },
  //       { sender: msgByUserId, receiver: user._id },
  //     ],
  //   });

  //   const conversationMessageId = conversation?.messages || [];

  //   await MessageModel.updateMany(
  //     { _id: { $in: conversationMessageId }, msgByUserId: msgByUserId },
  //     { $set: { seen: true } }
  //   );

  //   const conversationSender = await getConversation(user._id.toString());
  //   const conversationReceiver = await getConversation(msgByUserId);

  //   socket.to(user._id.toString()).emit("conversation", conversationSender);
  //   socket.to(msgByUserId).emit("conversation", conversationReceiver);
  // });

  socket.on("disconnect", () => {
    onlineUser.delete(user?._id?.toString());
    console.log("User disconnected:", socket.id);
  });
};
