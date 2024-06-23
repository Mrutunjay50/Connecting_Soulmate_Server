const jwt = require('jsonwebtoken');
const { InterestRequests } = require('../models/interests');

const checkAcceptedInterestRequest = async (socket, next) => {
  try {
    const { chatInitiatedTo } = socket.handshake.query;
    const { token } = socket.handshake.auth;

    console.log("1");
    
    if (!token) {
      return next(new Error("Authentication token is required"));
    }
    console.log("2");
    
    let chatInitiatedBy;
    try {
      const decodedToken = jwt.verify(token, process.env.SECRET_KEY); // replace `process.env.JWT_SECRET` with your actual secret
      
      chatInitiatedBy = decodedToken.userId;
      console.log("3");
    } catch (error) {
      console.log("4", error);
      return next(new Error("Invalid or expired token"));
    }
    
    console.log("5");
    if (!chatInitiatedBy || !chatInitiatedTo) {
      console.log("6");
      return next(new Error("Both chatInitiatedBy and chatInitiatedTo are required"));
    }
    console.log("7");
    
    const interestRequest = await InterestRequests.findOne({
      interestRequestBy: chatInitiatedBy,
      interestRequestTo: chatInitiatedTo,
      action: "accepted"
    });
    console.log("8");
    
    if (!interestRequest) {
      console.log("9");
      return next(new Error("No accepted interest request found between these users"));
    }

    console.log("passed the check");

    next();
  } catch (error) {
    console.error("Error checking interest request status:", error);
    next(new Error("Internal Server Error"));
  }
};

module.exports = { checkAcceptedInterestRequest };
