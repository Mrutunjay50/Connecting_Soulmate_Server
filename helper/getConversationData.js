const mongoose = require('mongoose');
const {InterestRequests} = require('../models/interests');
const { MessageModel } = require('../models/conversationModel');
const { getPublicUrlFromS3 } = require('../utils/s3Utils');

const getConversations = async (userId) => {
  const acceptedRequests = await InterestRequests.find({
    $or: [{ interestRequestBy: userId }, { interestRequestTo: userId }],
    action: 'accepted'
  }).populate('interestRequestBy interestRequestTo');

  if (!acceptedRequests.length) {
    // throw new Error('No accepted interest requests found');
    console.log('no request found for this user')
  }

  let conversations = [];

  for (const request of acceptedRequests) {
    const otherUser = request.interestRequestBy?._id.toString() === userId ? request.interestRequestTo : request.interestRequestBy;

    const lastMessage = await MessageModel.findOne({
      $or: [
        { sender: userId, receiver: otherUser?._id },
        { sender: otherUser?._id, receiver: userId }
      ]
    }).sort({ createdAt: -1 });

    conversations.push({
      _id: otherUser?._id,
      channelId: request?._id,
      userId: otherUser?.userId,
      profilePictureUrl : getPublicUrlFromS3(otherUser?.selfDetails[0].profilePicture),
      userName: otherUser?.basicDetails[0]?.name,
      lastMessage: lastMessage || {}
    });
  }

  return conversations;
};

module.exports = {
  getConversations
};
