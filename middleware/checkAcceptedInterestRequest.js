const { InterestRequests } = require('../models/interests');

const checkAcceptedInterestRequest = async (socket, next) => {
  try {
    const { requestId } = socket.handshake.query;

    // Find the interest request by its ID
    const interestRequest = await InterestRequests.findById(requestId);

    // Check if the interest request exists
    if (!interestRequest) {
      return next(new Error("Interest request not found"));
    }

    // Check if the interest request action is accepted
    if (interestRequest.action !== "accepted") {
      return next(new Error("Only accepted interest requests can send messages"));
    }

    // If the interest request is accepted, proceed to the next middleware or event handler
    next();
  } catch (error) {
    console.error("Error checking interest request status:", error);
    next(new Error("Internal Server Error"));
  }
};

module.exports = { checkAcceptedInterestRequest };
