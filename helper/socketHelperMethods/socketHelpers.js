const mongoose = require("mongoose");
const { ObjectId } = mongoose.Types;
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
    const unseenMessages = await MessageModel.aggregate([
      {
        $match: {
          receiver: new ObjectId(userId),
          seen: false
        }
      },
      {
        $group: {
          _id: "$sender",
        }
      },
      {
        $count: "unseenMessageCount"
      }
    ]);

    return unseenMessages.length > 0 ? unseenMessages[0].unseenMessageCount : 0;
  } catch (error) {
    console.error("Error fetching unseen messages:", error);
    return [];
  }
};

const getConversationsWithOnlineStatus = async (userId, onlineUsers) => {
  const conversations = await getConversations(userId);
  if (!conversations || conversations.length === 0) {
    return []; // Return an empty array or handle it as needed
  }
  return conversations.map((conversation) => {
    const isOnline = onlineUsers.has(conversation?._id?.toString());
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
