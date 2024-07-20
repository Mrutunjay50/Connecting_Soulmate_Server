const { MessageModel } = require("../../models/conversationModel");
const User = require("../../models/Users");
const { getConversations } = require("../getConversationData");

const updateLastLogin = async (userId, action) => {
  const user = await User.findByIdAndUpdate(
    userId,
    { lastLogin: new Date() },
    { new: true }
  );
  if (user) {
    console.log(`${user._id} ${action}.`);
  }
};

const getUnseenMessages = async (userId) => {
  try {
    // Count all messages where the user is the receiver and the message has not been seen
    const unseenMessageCount = await MessageModel.countDocuments({
      receiver: userId,
      seen: false,
    });

    return unseenMessageCount;
  } catch (error) {
    console.error("Error fetching unseen messages:", error);
    return [];
  }
};

const getConversationsWithOnlineStatus = async (userId, onlineUsers) => {
  const conversations = await getConversations(userId);
  return conversations.map((conversation) => {
    const isOnline = onlineUsers.has(conversation._id.toString());
    return {
      ...conversation,
      isOnline,
    };
  });
};

module.exports = {
  updateLastLogin,
  getUnseenMessages,
  getConversationsWithOnlineStatus,
};
