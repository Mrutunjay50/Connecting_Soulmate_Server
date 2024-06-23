const jwt = require('jsonwebtoken');
const { InterestRequests } = require('../models/interests');

const checkAcceptedInterestRequest = async (socket, next) => {
  try {
    const { chatInitiatedTo } = socket.handshake.query;
    const { token } = socket.handshake.auth;
    
    if (!token) {
      return next(new Error("Authentication token is required"));
    }
    
    let chatInitiatedBy;
    try {
      const decodedToken = jwt.verify(token, process.env.SECRET_KEY); // replace `process.env.JWT_SECRET` with your actual secret
      chatInitiatedBy = decodedToken.id;
    } catch (error) {
      // console.log("4", error);
      return next(new Error("Invalid or expired token"));
    }

    if (!chatInitiatedBy || !chatInitiatedTo) {
      return next(new Error("Both chatInitiatedBy and chatInitiatedTo are required"));
    }
    
    const interestRequest = await InterestRequests.findOne({
      action: "accepted",
      $or: [
        { interestRequestBy: chatInitiatedBy, interestRequestTo: chatInitiatedTo },
        { interestRequestBy: chatInitiatedTo, interestRequestTo: chatInitiatedBy }
      ]
    });
    
    if (!interestRequest) {
      return next(new Error("No accepted interest request found between these users"));
    }

    next();
  } catch (error) {
    console.error("Error checking interest request status:", error);
    next(new Error("Internal Server Error"));
  }
};

module.exports = { checkAcceptedInterestRequest };
