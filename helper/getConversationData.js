const mongoose = require('mongoose');
const InterestRequest = require('../models/InterestRequest');
const { MessageModel } = require('../models/messageModel');

const getConversations = async (userId) => {
  const acceptedRequests = await InterestRequest.find({
    $or: [{ interestRequestBy: userId }, { interestRequestTo: userId }],
    action: 'accepted'
  }).populate('interestRequestBy interestRequestTo');

  if (!acceptedRequests.length) {
    throw new Error('No accepted interest requests found');
  }

  let conversations = [];

  for (const request of acceptedRequests) {
    const otherUser = request.interestRequestBy._id.toString() === userId ? request.interestRequestTo : request.interestRequestBy;

    const lastMessage = await MessageModel.findOne({
      $or: [
        { sender: userId, receiver: otherUser._id },
        { sender: otherUser._id, receiver: userId }
      ]
    }).sort({ createdAt: -1 });

    conversations.push({
      requestId: request?._id,
      userId: otherUser?._id,
      objectId: otherUser?.userId,
      userName: otherUser?.basicDetails[0]?.name,
      lastMessage: lastMessage || {}
    });
  }

  return conversations;
};

module.exports = {
  getConversations
};
