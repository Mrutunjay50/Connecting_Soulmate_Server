// chatSocket.js
const getUserDetailsFromToken = require("./helper/getUserDetailsFromToken");
const User = require("./models/Users");
const {
  ConversationModel,
  MessageModel,
} = require("./models/conversationModel");
const getConversation = require("./helper/getConversation");
const {
  checkAcceptedInterestRequest,
} = require("./middleware/checkAcceptedInterestRequest");
const { getConversations } = require("./helper/getConversationData");

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
    // console.log(data);
    const messages = await checkAcceptedInterestRequest(data);
    socket.emit("ALL_CHAT_MESSAGES", messages);
  });

  socket.on("ON_NEW_MESSAGE", async (data) => {
    try {
      console.log(data);
      const newMessage = new MessageModel({
        text: data.message,
        sender: data.sender,
        receiver: data.receiver,
      });

      const savedMessage = await newMessage.save();
      console.log(data.channelId);
      socket.emit(`NEW_MESSAGE_ON_${data.channelId.toString()}`, savedMessage);
      const conversation = await getConversations(data.sender);
      socket.emit("CHAT_LISTING_ON_PAGE", conversation);
    } catch (error) {
      console.error("Error creating new message:", error);
      socket.emit("error", { message: "Error creating new message" });
    }
  });

  socket.on("seen", async (msgByUserId) => {
    let conversation = await ConversationModel.findOne({
      $or: [
        { sender: user._id, receiver: msgByUserId },
        { sender: msgByUserId, receiver: user._id },
      ],
    });

    const conversationMessageId = conversation?.messages || [];

    await MessageModel.updateMany(
      { _id: { $in: conversationMessageId }, msgByUserId: msgByUserId },
      { $set: { seen: true } }
    );

    const conversationSender = await getConversation(user._id.toString());
    const conversationReceiver = await getConversation(msgByUserId);

    socket.to(user._id.toString()).emit("conversation", conversationSender);
    socket.to(msgByUserId).emit("conversation", conversationReceiver);
  });

  socket.on("disconnect", () => {
    onlineUser.delete(user?._id?.toString());
    console.log("User disconnected:", socket.id);
  });
};
