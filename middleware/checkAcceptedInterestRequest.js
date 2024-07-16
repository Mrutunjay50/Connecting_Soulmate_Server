const jwt = require('jsonwebtoken');
const { InterestRequests } = require('../models/interests');
const { MessageModel } = require('../models/conversationModel');

const checkAcceptedInterestRequest = async (data) => {
  try {
    const {chatInitiatedBy, chatInitiatedTo} = data

    if (!chatInitiatedBy || !chatInitiatedTo) {
      return new Error("Both chatInitiatedBy and chatInitiatedTo are required");
    }
    
    const interestRequest = await InterestRequests.findOne({
      action: "accepted",
      $or: [
        { interestRequestBy: chatInitiatedBy, interestRequestTo: chatInitiatedTo },
        { interestRequestBy: chatInitiatedTo, interestRequestTo: chatInitiatedBy }
      ]
    });
    
    if (!interestRequest) {
      return new Error("No accepted interest request found between these users");
    }

    console.log("yes have interest request accepted");
    const messages = await MessageModel.find({
      $or: [
        { sender: chatInitiatedBy, receiver: chatInitiatedTo },
        { sender: chatInitiatedTo, receiver: chatInitiatedBy }
      ]
    }).sort({ createdAt: 1 });

    // console.log(messages);
    return messages;
  } catch (error) {
    console.log("Error checking interest request status:", error);
  }
};

module.exports = { checkAcceptedInterestRequest };
