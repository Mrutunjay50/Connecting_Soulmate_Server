const { Country, State, City, Diet, Proffesion, Community } = require("../models/masterSchemas");
const ShortList = require("../models/shortlistUsers");
const { ProfileRequests, InterestRequests } = require("../models/interests");
const { getSignedUrlFromS3 } = require("../utils/s3Utils");
const { ListData } = require("../helper/cardListedData");
const io = require("../socket");
const Notifications = require("../models/notifications");

// Profile Request Section

exports.sendProfileRequest = async (req, res) => {
  try {
    const { profileRequestBy, profileRequestTo } = req.body;
    const message = await sendRequest(
      ProfileRequests,
      profileRequestBy,
      profileRequestTo,
      "Profile",
      "pending",
      res
    );
    const existingNotification = await Notifications.findOne({
      notificationTo: profileRequestTo,
      notificationBy: profileRequestBy,
      notificationType: "profilesent"
    });
    // Create and save notification for profile request sent
    let notifications;
    if (!existingNotification) {
      notifications = new Notifications({
        notificationTo: profileRequestTo,
        notificationBy: profileRequestBy,
        notificationText: `You (${profileRequestBy}) have received a profile request from ${profileRequestTo}`,
        notificationType: "profilesent"
      });
      await notifications.save();
    }
    io.getIO().emit(`notification/${profileRequestTo}`, notifications);
    io.getIO().emit(`profileRequestSent/${profileRequestTo}`, { "message": "request sent" });
    return res.status(200).json(message);
  } catch (error) {
    console.error("Error sending profile request:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.acceptProfileRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const {profileRequestToId} = req.query;
    const request = await ProfileRequests.findById(requestId);

    // Check if the request exists
    if (!request) {
      return res.status(404).json({ error: "Profile request not found" });
    }

    // Check if the user is authorized to cancel the request
    if (request.profileRequestTo.toString() !== profileRequestToId) {
      return res.status(403).json({ error: "Unauthorized: You cannot accept this profile request" });
    }
    await updateRequestStatus(
      ProfileRequests,
      requestId,
      "Profile",
      "accepted",
      res
    );
        // Check if a notification with the same fields already exists
    const existingNotification = await Notifications.findOne({
      notificationBy: request.profileRequestTo,
      notificationTo: request.profileRequestBy,
      notificationType : "profileaccepted"
    });

    if (existingNotification) {
      return res.status(400).json({ message: "Notification already exists" });
    }
    // Create and save notification for profile request sent
    const notification = new Notifications({
      notificationBy: request.profileRequestTo,
      notificationTo: request.profileRequestBy,
      notificationText: `${request.profileRequestTo} have accepted the profile request from ${request.profileRequestBy}`,
      notificationType : "profileaccepted"
    });
    await notification.save();

    // Emit notification event
    io.getIO().emit(`notification/${request.profileRequestBy}`, notification);
    io.getIO().emit(`notification/${request.profileRequestTo}`, notification);
    io.getIO().emit(`profileRequestAcDec/${request.profileRequestBy}`, {"message": "request accepted"});
    // io.getIO().to(admin).emit("notification", notification);
  } catch (error) {
    console.error("Error accepting profile request:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.declineProfileRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const {profileRequestToId} = req.query;
    const request = await ProfileRequests.findById(requestId);

    // Check if the request exists
    if (!request) {
      return res.status(404).json({ error: "Profile request not found" });
    }

    // Check if the user is authorized to cancel the request
    if (request.profileRequestTo.toString() !== profileRequestToId) {
      return res.status(403).json({ error: "Unauthorized: You cannot decline this profile request" });
    }
    await updateRequestStatus(
      ProfileRequests,
      requestId,
      "Profile",
      "declined",
      res
    );

    // Emit notification event
    // io.getIO().emit(`notification/${request.profileRequestBy}`, notification);
    io.getIO().emit(`profileRequestAcDec/${request.profileRequestBy}`, {"message": "request declined"});
    // io.getIO().to(admin).emit("notification", notification);
  } catch (error) {
    console.error("Error declining profile request:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.cancelProfileRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const {profileRequestById} = req.query;
    const request = await ProfileRequests.findById(requestId);

    // Check if the request exists
    if (!request) {
      return res.status(404).json({ error: "Profile request not found" });
    }

    // Check if the user is authorized to cancel the request
    if (request.profileRequestBy.toString() !== profileRequestById) {
      return res.status(403).json({ error: "Unauthorized: You cannot cancel this profile request" });
    }
    await updateRequestStatus(
      ProfileRequests,
      requestId,
      "Profile",
      "cancelled",
      res
    );
    // Check if a notification with the same fields already exists
    const existingNotification = await Notifications.findOne({
      notificationBy: request.profileRequestBy,
      notificationTo: request.profileRequestTo,
      notificationType : "profilesent",
    });

    if (existingNotification) {
      // Delete the existing notification
      await Notifications.findByIdAndDelete(existingNotification._id);
    }
  } catch (error) {
    console.error("Error cancelling profile request:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.getProfileRequestsAccepted = async (req, res) => {
  try {
    const { userId } = req.params;
    const requests = await getRequests(ProfileRequests, userId, "Profile", "accepted", res);
    await Promise.all(requests.map(async (item) => {
      item.publicRequestTo.selfDetails[0].profilePictureUrl = await getSignedUrlFromS3(item?.publicRequestTo?.selfDetails[0]?.profilePicture);
      item.publicRequestBy.selfDetails[0].profilePictureUrl = await getSignedUrlFromS3(item?.publicRequestBy?.selfDetails[0]?.profilePicture);
    }));
    return res.status(200).json({ requests });
  } catch (error) {
    console.error("Error getting accepted profile requests:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.getProfileRequestsDeclined = async (req, res) => {
  try {
    const { userId } = req.params;
    const requests = await getRequests(ProfileRequests, userId, "Profile", "declined", res);
    // Fetch profile picture URLs for each request
    await Promise.all(requests.map(async (item) => {
      item.publicRequestTo.selfDetails[0].profilePictureUrl = await getSignedUrlFromS3(item?.publicRequestTo?.selfDetails[0]?.profilePicture);
      item.publicRequestBy.selfDetails[0].profilePictureUrl = await getSignedUrlFromS3(item?.publicRequestBy?.selfDetails[0]?.profilePicture);
    }));
    return res.status(200).json({ requests });
  } catch (error) {
    console.error("Error getting declined profile requests:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.getProfileRequestsSent = async (req, res) => {
  try {
    const { userId } = req.params;
    const requests = await getPendingRequests(ProfileRequests, userId, "Profile", res, false);
    // Fetch profile picture URLs for each request
    await Promise.all(requests.map(async (item) => {
      item.profileRequestTo.selfDetails[0].profilePictureUrl = await getSignedUrlFromS3(item?.profileRequestTo?.selfDetails[0]?.profilePicture);
    }));
    return res.status(200).json({ requests });
  } catch (error) {
    console.error("Error getting pending profile requests:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.getProfileRequestsReceived = async (req, res) => {
  try {
    const { userId } = req.params;
    const requests = await getPendingRequests(ProfileRequests, userId, "Profile", res, true);
    // Fetch profile picture URLs for each request
    await Promise.all(requests.map(async (item) => {
      item.profileRequestBy.selfDetails[0].profilePictureUrl = await getSignedUrlFromS3(item?.profileRequestBy?.selfDetails[0]?.profilePicture);
    }));
    return res.status(200).json({ requests });
  } catch (error) {
    console.error("Error getting pending profile requests:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};




// Interest Request Section

exports.sendInterestRequest = async (req, res) => {
  try {
    const { interestRequestBy, interestRequestTo } = req.body;
    const message = await sendRequest(
      InterestRequests,
      interestRequestBy,
      interestRequestTo,
      "Interest",
      "pending",
      res
    );
    const existingNotification = await Notifications.findOne({
      notificationTo: interestRequestTo,
      notificationBy: interestRequestBy,
      notificationType : "interestsent"
    });
    let notification;
    if (!existingNotification) {
      notification = new Notifications({
        notificationTo: interestRequestTo,
        notificationBy: interestRequestBy,
        notificationText: `You (${interestRequestBy}) have received a Interest request from ${interestRequestTo}`,
        notificationType : "interestsent"
      });
      await notification.save();
    }
    // Create and save notification for profile request sent
    // io.getIO().to(interestRequestTo).emit("notification", notification);
    io.getIO().emit(`notification/${interestRequestTo}`, notification);
    io.getIO().emit(`interestRequestSent/${interestRequestTo}`, {"message": "request sent"});
    return res.status(200).json(message);
  } catch (error) {
    console.error("Error sending interest request:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.acceptInterestRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const {interestRequestToId} = req.query;
    const request = await InterestRequests.findById(requestId);

    // Check if the request exists
    if (!request) {
      return res.status(404).json({ error: "Interest request not found" });
    }

    // Check if the user is authorized to cancel the request
    if (request.interestRequestTo.toString() !== interestRequestToId) {
      return res.status(403).json({ error: "Unauthorized: You cannot accept this interest request" });
    }
    await updateRequestStatus(
      InterestRequests,
      requestId,
      "Interest",
      "accepted",
      res
    );
    const existingNotification = await Notifications.findOne({
      notificationTo: request.interestRequestBy,
      notificationBy: request.interestRequestTo,
      notificationType : "interestaccepted"
    });

    if (existingNotification) {
      return res.status(400).json({ message: "Notification already exists" });
    }
    // Create and save notification for profile request sent
    const notification = new Notifications({
      notificationTo: request.interestRequestBy,
      notificationBy: request.interestRequestTo,
      notificationText: `${request.interestRequestTo} have accepted the profile request from ${request.interestRequestBy}`,
      notificationType : "interestaccepted"
    });
    await notification.save();

    // Emit notification event
    io.getIO().emit(`notification/${request.interestRequestBy}`, notification);
    io.getIO().emit(`notification/${request.interestRequestTo}`, notification);
    io.getIO().emit(`interestRequestAcDec/${request.interestRequestBy}`, {"message": "request accepted"});
    // io.getIO().to(admin).emit("notification", notification);
  } catch (error) {
    console.error("Error accepting interest request:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.declineInterestRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const {interestRequestToId} = req.query;
    const request = await InterestRequests.findById(requestId);

    // Check if the request exists
    if (!request) {
      return res.status(404).json({ error: "Interest request not found" });
    }

    // Check if the user is authorized to cancel the request
    if (request.interestRequestTo.toString() !== interestRequestToId) {
      return res.status(403).json({ error: "Unauthorized: You cannot dcline this interest request" });
    }

    await updateRequestStatus(
      InterestRequests,
      requestId,
      "Interest",
      "declined",
      res
    );

    // Emit notification event
    // io.getIO().emit(`notification/${request.interestRequestBy}`, notification);
    // io.getIO().emit(`notification/${request.interestRequestTo}`, notification);
    io.getIO().emit(`interestRequestAcDec/${request.interestRequestBy}`, {"message": "request declined"});
    // io.getIO().to(admin).emit("notification", notification);
  } catch (error) {
    console.error("Error declining interest request:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.cancelInterestRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const {interestRequestById} = req.query
    const request = await InterestRequests.findById(requestId);

    // Check if the request exists
    if (!request) {
      return res.status(404).json({ error: "Interest request not found" });
    }

    // Check if the user is authorized to cancel the request
    if (request.interestRequestBy.toString() !== interestRequestById) {
      return res.status(403).json({ error: "Unauthorized: You cannot cancel this interest request" });
    }

    await updateRequestStatus(
      InterestRequests,
      requestId,
      "Interest",
      "cancelled",
      res
    );
    // Check if a notification with the same fields already exists
    const existingNotification = await Notifications.findOne({
      notificationTo: request.interestRequestTo,
      notificationBy: request.interestRequestBy,
      notificationType : "interestsent",
    });

    if (existingNotification) {
      // Delete the existing notification
      await Notifications.findByIdAndDelete(existingNotification._id);
    }
  } catch (error) {
    console.error("Error declining interest request:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.getInterestRequestsAccepted = async (req, res) => {
  try {
    const { userId } = req.params;
    const requests = await getRequests(InterestRequests, userId, "Interest", "accepted", res);
    // Fetch profile picture URLs for each request
    await Promise.all(requests.map(async (item) => {
      item.interestRequestTo.selfDetails[0].profilePictureUrl = await getSignedUrlFromS3(item?.interestRequestTo?.selfDetails[0]?.profilePicture);
      item.interestRequestBy.selfDetails[0].profilePictureUrl = await getSignedUrlFromS3(item?.interestRequestBy?.selfDetails[0]?.profilePicture);
    }));
    return res.status(200).json({ requests });
  } catch (error) {
    console.error("Error getting accepted interest requests:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.getInterestRequestsDeclined = async (req, res) => {
  try {
    const { userId } = req.params;
    const requests = await getRequests(InterestRequests, userId, "Interest", "declined", res);
    // Fetch profile picture URLs for each request
    await Promise.all(requests.map(async (item) => {
      item.interestRequestTo.selfDetails[0].profilePictureUrl = await getSignedUrlFromS3(item?.interestRequestTo?.selfDetails[0]?.profilePicture);
      item.interestRequestBy.selfDetails[0].profilePictureUrl = await getSignedUrlFromS3(item?.interestRequestBy?.selfDetails[0]?.profilePicture);
    }));
    return res.status(200).json({ requests });
  } catch (error) {
    console.error("Error getting declined interest requests:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.getInterestRequestsSent = async (req, res) => {
  try {
    const { userId } = req.params;
    const requests = await getPendingRequests(InterestRequests, userId, "Interest", res, false);
    // Fetch profile picture URLs for each request
    await Promise.all(requests.map(async (item) => {
      item.interestRequestTo.selfDetails[0].profilePictureUrl = await getSignedUrlFromS3(item?.interestRequestTo?.selfDetails[0]?.profilePicture);
    }));
    return res.status(200).json({ requests });
  } catch (error) {
    console.error("Error getting pending interest requests:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.getInterestRequestsReceived = async (req, res) => {
  try {
    const { userId } = req.params;
    const requests = await getPendingRequests(InterestRequests, userId, "Interest", res, true);
    // Fetch profile picture URLs for each request
    await Promise.all(requests.map(async (item) => {
      item.interestRequestBy.selfDetails[0].profilePictureUrl = await getSignedUrlFromS3(item?.interestRequestBy?.selfDetails[0]?.profilePicture);
    }));
    return res.status(200).json({ requests });
  } catch (error) {
    console.error("Error getting pending interest requests:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

async function processRequest(Model, requestBy, requestTo, type, action, res) {
  try {
    const existingRequest = await Model.findOne({
      [`${type.toLowerCase()}RequestBy`]: requestBy,
      [`${type.toLowerCase()}RequestTo`]: requestTo,
    });

    if (existingRequest) {
      if (existingRequest.action === 'pending' && action === 'pending') {
        return { message: `${type} request already sent` }
      } else if (existingRequest.action === 'blocked') {
        return ({ message: `${type}: request can't be sent as you have blocked the user` });
      } else {
        existingRequest.action = action; // Change the action to 'pending'
        await existingRequest.save();
        return ({ message: `${type} request updated to ${action}` });
      }
    }

    const newRequest = new Model({
      [`${type.toLowerCase()}RequestBy`]: requestBy,
      [`${type.toLowerCase()}RequestTo`]: requestTo,
      action,
    });

    // Create an array of promises for batch processing
    const promises = [
      ShortList.findOne({ user: requestBy, shortlistedUser: requestTo }),
      ShortList.findOne({ user: requestTo, shortlistedUser: requestBy }),
      InterestRequests.findOne({ interestRequestBy: requestBy, interestRequestTo: requestTo }),
      InterestRequests.findOne({ interestRequestBy: requestTo, interestRequestTo: requestBy }),
      ProfileRequests.findOne({ profileRequestBy: requestBy, profileRequestTo: requestTo }),
      ProfileRequests.findOne({ profileRequestBy: requestTo, profileRequestTo: requestBy }),
    ];

    // Execute all promises in parallel
    const [shortlistBy, shortlistTo, interestlistBy, interestlistTo, profilelistBy, profilelistTo] = await Promise.all(promises);

    newRequest.isShortListedBy = !!shortlistBy;
    newRequest.isShortListedTo = !!shortlistTo;
    newRequest.isInterestRequestBy = !!interestlistBy;
    newRequest.isInterestRequestTo = !!interestlistTo;
    newRequest.isProfileRequestBy = !!profilelistBy;
    newRequest.isProfileRequestTo = !!profilelistTo;

    await newRequest.save();
    return { message: `${type} request sent successfully` }
  } catch (error) {
    console.error("Error processing request:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
}

async function sendRequest(Model, requestBy, requestTo, type, action, res) {
  await processRequest(Model, requestBy, requestTo, type, action, res);
}

async function updateRequestStatus(Model, requestId, type, status, res) {
  try {
    const request = await Model.findById(requestId);
    if (!request) {
      return res.status(404).json({ error: "Request not found" });
    }
    request.action = status;

    await processRequest(Model, request[`${type.toLowerCase()}RequestBy`], request[`${type.toLowerCase()}RequestTo`], type, status, res);
  } catch (error) {
    console.error(`Error updating ${type} request status:`, error);
    res.status(500).json({ error: "Internal Server Error" });
  }
}

async function getPendingRequests(Model, userId, type, res, received) {
  console.log(received);
  const requests = await Model.find({
    [`${type.toLowerCase()}Request${received == true ? "To" : "By"}`]: userId,
    action: "pending",
    isBlocked : false
  }).populate({
    path: `${type.toLowerCase()}Request${received == true ? "By" : "To"}`,
    select: ListData,
  });

  return requests;
}

async function getRequests(Model, userId, type, status, res) {
try {
    let requests

    if(status === "pending"){
      requests = await Model.find({
        $or: [{ [`${type.toLowerCase()}RequestBy`]: userId, action: status, isBlocked : false }]
      }).populate([
        { path: `${type.toLowerCase()}RequestBy`, select: ListData },
        { path: `${type.toLowerCase()}RequestTo`, select: ListData }
      ]);
    }else {
      requests = await Model.find({
        $or: [
          { [`${type.toLowerCase()}RequestBy`]: userId, action: status, isBlocked : false },
          { [`${type.toLowerCase()}RequestTo`]: userId, action: status, isBlocked : false }
        ]
      }).populate([
        { path: `${type.toLowerCase()}RequestBy`, select: ListData },
        { path: `${type.toLowerCase()}RequestTo`, select: ListData }
      ]);
    }

    return requests;
  } catch (error) {
    console.error(`Error getting ${status} ${type} requests:`, error);
    res.status(500).json({ error: "Internal Server Error" });
  }
}