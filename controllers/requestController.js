const { InterestRequests, ProfileRequests } = require("../models/interests");
const ShortList = require("../models/shortlistUsers");
const { ListData } = require("../helper/cardListedData");
const io = require("../socket");
const Notifications = require("../models/notifications");

exports.addToShortlist = async (req, res) => {
  try {
    const { user, shortlistedUserId } = req.body;

    const shortlist = new ShortList({
      user: user,
      shortlistedUser: shortlistedUserId,
    });

    await shortlist.save();

    res.status(201).json({ message: "User added to shortlist successfully" });
  } catch (error) {
    console.error("Error adding user to shortlist:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.getShortlistedUser = async (req, res) => {
  try {
    const { UserId } = req.params;
    const user = await ShortList.find({ user: UserId }).populate({
      path: "shortlistedUser",
      select: ListData,
    });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json(user);
  } catch (error) {
    console.error("Error fetching shortlisted user:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Profile Request Section

exports.sendProfileRequest = async (req, res) => {
  try {
    const { profileRequestBy, profileRequestTo } = req.body;
    await sendRequest(
      ProfileRequests,
      profileRequestBy,
      profileRequestTo,
      "Profile",
      "pending",
      res
    );

    // Create and save notification for profile request sent
    const notification = new Notifications({
      notificationTo: profileRequestTo,
      notificationText: `You (${profileRequestBy}) have received a profile request from ${profileRequestBy}`,
    });
    await notification.save();

    // Emit notification event
    // io.getIO().on("connection", (socket) =>{
    //   socket.emit("notification", "notification");
    // })
    io.getIO().emit(`notification/${profileRequestTo}`, notification);
  } catch (error) {
    console.error("Error sending profile request:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.acceptProfileRequest = async (req, res) => {
  try {
    const { requestId, profileRequestToId } = req.params;
    const request = await ProfileRequests.findById(requestId);

    // Check if the request exists
    if (!request) {
      return res.status(404).json({ error: "Profile request not found" });
    }

    // Check if the user is authorized to cancel the request
    if (request.profileRequestTo !== profileRequestToId) {
      return res.status(403).json({ error: "Unauthorized: You cannot accept this profile request" });
    }
    await updateRequestStatus(
      ProfileRequests,
      requestId,
      "Profile",
      "accepted",
      res
    );
    // Create and save notification for profile request sent
    const notification = new Notifications({
      notificationTo: request.profileRequestBy,
      notificationText: `${request.profileRequestTo} have accepted the profile request from ${request.profileRequestBy}`,
    });
    await notification.save();

    // Emit notification event
    io.getIO().emit(`notification/${request.profileRequestBy}`, notification);
    // io.getIO().to(admin).emit("notification", notification);
  } catch (error) {
    console.error("Error accepting profile request:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.declineProfileRequest = async (req, res) => {
  try {
    const { requestId, profileRequestToId } = req.params;
    const request = await ProfileRequests.findById(requestId);

    // Check if the request exists
    if (!request) {
      return res.status(404).json({ error: "Profile request not found" });
    }

    // Check if the user is authorized to cancel the request
    if (request.profileRequestTo !== profileRequestToId) {
      return res.status(403).json({ error: "Unauthorized: You cannot decline this profile request" });
    }
    await updateRequestStatus(
      ProfileRequests,
      requestId,
      "Profile",
      "declined",
      res
    );
    // Create and save notification for profile request sent
    const notification = new Notifications({
      notificationTo: request.profileRequestBy,
      notificationText: `${request.profileRequestTo} have declined the profile request from ${request.profileRequestBy}`,
    });
    await notification.save();

    // Emit notification event
    io.getIO().emit(`notification/${request.profileRequestBy}`, notification);
    // io.getIO().to(admin).emit("notification", notification);
  } catch (error) {
    console.error("Error declining profile request:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.cancelProfileRequest = async (req, res) => {
  try {
    const { requestId, profileRequestById } = req.params;
    const request = await ProfileRequests.findById(requestId);

    // Check if the request exists
    if (!request) {
      return res.status(404).json({ error: "Profile request not found" });
    }

    // Check if the user is authorized to cancel the request
    if (request.profileRequestBy !== profileRequestById) {
      return res.status(403).json({ error: "Unauthorized: You cannot cancel this profile request" });
    }
    await updateRequestStatus(
      ProfileRequests,
      requestId,
      "Profile",
      "cancelled",
      res
    );

  } catch (error) {
    console.error("Error declining profile request:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.blockProfileRequest = async (req, res) => {
  try {
    const { requestId, profileRequestById } = req.params;
    await updateRequestStatus(
      ProfileRequests,
      requestId,
      "Profile",
      "blocked",
      res
    );

    const request = await ProfileRequests.findById(requestId);
  } catch (error) {
    console.error("Error declining profile request:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.getProfileRequestsAccepted = async (req, res) => {
  try {
    const { userId } = req.params;
    await getRequests(ProfileRequests, userId, "Profile", "accepted", res);
  } catch (error) {
    console.error("Error getting accepted profile requests:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.getProfileRequestsDeclined = async (req, res) => {
  try {
    const { userId } = req.params;
    await getRequests(ProfileRequests, userId, "Profile", "declined", res);
  } catch (error) {
    console.error("Error getting declined profile requests:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.getProfileRequestsSent = async (req, res) => {
  try {
    const { userId } = req.params;
    await getPendingRequests(ProfileRequests, userId, "Profile", res);
  } catch (error) {
    console.error("Error getting pending profile requests:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.getProfileRequestsReceived = async (req, res) => {
  try {
    const { userId } = req.params;
    await getPendingRequests(ProfileRequests, userId, "Profile", res, true);
  } catch (error) {
    console.error("Error getting pending profile requests:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};




// Interest Request Section

exports.sendInterestRequest = async (req, res) => {
  try {
    const { interestRequestBy, interestRequestTo } = req.body;
    await sendRequest(
      InterestRequests,
      interestRequestBy,
      interestRequestTo,
      "Interest",
      "pending",
      res
    );
        // Create and save notification for profile request sent
        const notification = new Notifications({
          notificationTo: interestRequestTo,
          notificationText: `You (${interestRequestBy}) have received a Interest request from ${interestRequestTo}`,
        });
        await notification.save();
        // io.getIO().to(interestRequestTo).emit("notification", notification);
        io.getIO().emit(`notification/${interestRequestTo}`, notification);
  } catch (error) {
    console.error("Error sending interest request:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.acceptInterestRequest = async (req, res) => {
  try {
    const { requestId, interestRequestToId } = req.params;
    const request = await InterestRequests.findById(requestId);

    // Check if the request exists
    if (!request) {
      return res.status(404).json({ error: "Interest request not found" });
    }

    // Check if the user is authorized to cancel the request
    if (request.interestRequestTo !== interestRequestToId) {
      return res.status(403).json({ error: "Unauthorized: You cannot dcline this interest request" });
    }
    await updateRequestStatus(
      InterestRequests,
      requestId,
      "Interest",
      "accepted",
      res
    );
    // Create and save notification for profile request sent
    const notification = new Notifications({
      notificationTo: request.interestRequestTo,
      notificationText: `${request.interestRequestTo} have accepted the profile request from ${request.interestRequestBy}`,
    });
    await notification.save();

    // Emit notification event
    io.getIO().emit(`notification/${request.interestRequestBy}`, notification);
    io.getIO().emit(`notification/${request.interestRequestTo}`, notification);
    // io.getIO().to(admin).emit("notification", notification);
  } catch (error) {
    console.error("Error accepting interest request:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.declineInterestRequest = async (req, res) => {
  try {
    const { requestId, interestRequestToId } = req.params;
    const request = await InterestRequests.findById(requestId);

    // Check if the request exists
    if (!request) {
      return res.status(404).json({ error: "Interest request not found" });
    }

    // Check if the user is authorized to cancel the request
    if (request.interestRequestTo !== interestRequestToId) {
      return res.status(403).json({ error: "Unauthorized: You cannot dcline this interest request" });
    }

    await updateRequestStatus(
      InterestRequests,
      requestId,
      "Interest",
      "declined",
      res
    );
    // Create and save notification for profile request sent
    const notification = new Notifications({
      notificationTo: request.interestRequestTo,
      notificationText: `${request.interestRequestTo} have declined the profile request from ${request.interestRequestBy}`,
    });
    await notification.save();

    // Emit notification event
    io.getIO().emit(`notification/${request.interestRequestBy}`, notification);
    io.getIO().emit(`notification/${request.interestRequestTo}`, notification);
    // io.getIO().to(admin).emit("notification", notification);
  } catch (error) {
    console.error("Error declining interest request:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.cancelInterestRequest = async (req, res) => {
  try {
    const { requestId, interestRequestById } = req.params;
    const request = await InterestRequests.findById(requestId);

    // Check if the request exists
    if (!request) {
      return res.status(404).json({ error: "Interest request not found" });
    }

    // Check if the user is authorized to cancel the request
    if (request.interestRequestBy !== interestRequestById) {
      return res.status(403).json({ error: "Unauthorized: You cannot cancel this interest request" });
    }

    await updateRequestStatus(
      InterestRequests,
      requestId,
      "Interest",
      "cancelled",
      res
    );
  } catch (error) {
    console.error("Error declining interest request:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.blockedInterestRequest = async (req, res) => {
  try {
    const { requestId, interestRequestById } = req.params;
    await updateRequestStatus(
      InterestRequests,
      requestId,
      "Interest",
      "blocked",
      res
    );
    const request = await InterestRequests.findById(requestId);
  } catch (error) {
    console.error("Error declining interest request:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.getInterestRequestsAccepted = async (req, res) => {
  try {
    const { userId } = req.params;
    await getRequests(InterestRequests, userId, "Interest", "accepted", res);
  } catch (error) {
    console.error("Error getting accepted interest requests:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.getInterestRequestsDeclined = async (req, res) => {
  try {
    const { userId } = req.params;
    await getRequests(InterestRequests, userId, "Interest", "declined", res);
  } catch (error) {
    console.error("Error getting declined interest requests:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.getInterestRequestsSent = async (req, res) => {
  try {
    const { userId } = req.params;
    await getPendingRequests(InterestRequests, userId, "Interest", res);
  } catch (error) {
    console.error("Error getting pending interest requests:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.getInterestRequestsReceived = async (req, res) => {
  try {
    const { userId } = req.params;
    await getPendingRequests(InterestRequests, userId, "Interest", res, true);
  } catch (error) {
    console.error("Error getting pending interest requests:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

async function sendRequest(Model, requestBy, requestTo, type, action, res) {
  const existingRequest = await Model.findOne({
    [`${type.toLowerCase()}RequestBy`]: requestBy,
    [`${type.toLowerCase()}RequestTo`]: requestTo,
  });
  if (existingRequest) {
    if (existingRequest.action === 'pending') {
      res.status(200).json({ message: `${type} request already sent` });
    } else if ((existingRequest.action === 'blocked')){
      res.status(200).json({ message: `${type} : request cant be sent as u have blocked the user`});
    } else {
      existingRequest.action = 'pending'; // Change the action to 'pending'
      await existingRequest.save();
      res.status(200).json({ message: `${type} request updated to pending` });
    }
  } else {
    const newRequest = new Model({
      [`${type.toLowerCase()}RequestBy`]: requestBy,
      [`${type.toLowerCase()}RequestTo`]: requestTo,
      action,
    });
    await newRequest.save();
    res.status(201).json({ message: `${type} request sent successfully` });
  }
}

async function updateRequestStatus(Model, requestId, type, status, res) {
  const request = await Model.findById(requestId);
  if (!request) {
    return res.status(404).json({ error: "Request not found" });
  }
  request.action = status;
  await request.save();
  res.status(200).json({ message: `${type} request ${status} successfully` });
}

async function getRequests(Model, userId, type, status, res) {
try {
    let requests

    if(status === "pending"){
      requests = await Model.find({
        $or: [{ [`${type.toLowerCase()}RequestBy`]: userId, action: status }]
      }).populate([
        { path: `${type.toLowerCase()}RequestBy`, select: ListData },
        { path: `${type.toLowerCase()}RequestTo`, select: ListData }
      ]);
    }else {
      requests = await Model.find({
        $or: [
          { [`${type.toLowerCase()}RequestBy`]: userId, action: status },
          { [`${type.toLowerCase()}RequestTo`]: userId, action: status }
        ]
      }).populate([
        { path: `${type.toLowerCase()}RequestBy`, select: ListData },
        { path: `${type.toLowerCase()}RequestTo`, select: ListData }
      ]);
    }

    res.status(200).json({ requests });
  } catch (error) {
    console.error(`Error getting ${status} ${type} requests:`, error);
    res.status(500).json({ error: "Internal Server Error" });
  }
}

async function getPendingRequests(Model, userId, type, res, received = false) {
  const requests = await Model.find({
    [`${type.toLowerCase()}Request${received ? "To" : "By"}`]: userId,
    action: "pending",
  }).populate({
    path: `${type.toLowerCase()}Request${received ? "By" : "To"}`,
    select: ListData,
  });
  res.status(200).json({ requests });
}
