const { ProfileRequests, InterestRequests } = require("../models/interests");
const { getPublicUrlFromS3 } = require("../utils/s3Utils");
const io = require("../socket");
const Notifications = require("../models/notifications");
const { populateNotification, populateNotificationOfUsersForAdmin } = require("../helper/NotificationsHelper/populateNotification");
const { sendNotificationToAdmins } = require("../helper/NotificationsHelper/sendNotificationsToAdmin");
const { sendRequest, updateRequestStatus, getRequests, getPendingRequests } = require("../helper/RequestHelpers/requestHelperMethods");
const User = require("../models/Users");


const notificationStatus = async (userId) => {
  try {
      // Find the user by userId
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
  
      user.isNotification = true;
  
      await user.save();
  
      console.log({ message: "notification status updated" })
    } catch (error) {
      console.error("Error updating notification status :", error);
      console.log({ error: "Internal Server Error" });
    }
};


// Profile Request Section

exports.sendProfileRequest = async (req, res) => {
  console.time('sendProfileRequest'); // Start timing
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
    const blockedMessages = [
      `Profile request can't be sent as you have blocked the user`,
      `Profile request can't be sent as you are blocked by this user`
    ];
    
    const acceptedInterestMessages = [
      `Already have an accepted interest request from this user`,
      `Already have an accepted interest request from you`
    ];
    
    const acceptedProfileMessages = [
      `You have accepted the Profile request from this user`
    ];
    
    if (blockedMessages.includes(message) || acceptedInterestMessages.includes(message) || acceptedProfileMessages.includes(message)) {
      console.timeEnd('sendProfileRequest'); // End timing before returning
      return res.status(403).json(message);
    }

    if(message !== "This person has already sent an Profile request to you"){
          // Create or update notification for profile request sent
      const notification = await Notifications.findOneAndUpdate(
        {
          notificationTo: profileRequestTo,
          notificationBy: profileRequestBy,
          notificationType: "profilesent"
        },
        {
          notificationTo: profileRequestTo,
          notificationBy: profileRequestBy,
          notificationText: `You have sent a profile request from /${profileRequestTo}`,
          notificationType: "profilesent"
        },
        {
          new: true, // Return the updated document
          upsert: true, // Create the document if it doesn't exist
          setDefaultsOnInsert: true // Apply default values if creating
        }
      );
      const formattedNotification = await populateNotification(notification);

      io.getIO().emit(`notification/${profileRequestTo}`, formattedNotification);
      io.getIO().emit(`notification/${profileRequestBy}`, formattedNotification);
      notificationStatus(profileRequestTo);
      notificationStatus(profileRequestBy);
      // Find all admin users
      const formattedNotificationAdmin = await populateNotificationOfUsersForAdmin(notification);
      io.getIO().emit(`profileRequestSent/${profileRequestTo}`, { "message": "request sent" });
      // Send formatted notification to admin and users with accessType 0 or 1
      sendNotificationToAdmins(formattedNotificationAdmin);
    }
    console.timeEnd('sendProfileRequest'); // End timing before returning
    return res.status(200).json(message);
  } catch (error) {
    console.error("Error sending profile request:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.acceptProfileRequest = async (req, res) => {
  console.time('acceptProfileRequest'); // Start timing
  try {
    const { requestId } = req.params;
    const {profileRequestToId} = req.query;
    const request = await ProfileRequests.findById(requestId);

    // Check if the request exists
    if (!request) {
      console.timeEnd('acceptProfileRequest');
      return res.status(404).json({ error: "Profile request not found" });
    }

    // Check if the user is authorized to cancel the request
    if (request.profileRequestTo.toString() !== profileRequestToId) {
      console.timeEnd('acceptProfileRequest');
      return res.status(403).json({ error: "Unauthorized: You cannot accept this profile request" });
    }
    const responseMsg = await updateRequestStatus(
      ProfileRequests,
      requestId,
      "Profile",
      "accepted",
      res
    );
    // Check if a notification with the same fields already exists
    // Create or update notification for profile request accepted
    const notification = await Notifications.findOneAndUpdate(
      {
        notificationBy: request.profileRequestTo,
        notificationTo: request.profileRequestBy,
        notificationType: "profileaccepted"
      },
      {
        notificationBy: request.profileRequestTo,
        notificationTo: request.profileRequestBy,
        notificationText: `${request.profileRequestTo}/ have accepted the profile request from /${request.profileRequestBy}`,
        notificationType: "profileaccepted"
      },
      {
        new: true, // Return the updated document
        upsert: true, // Create the document if it doesn't exist
        setDefaultsOnInsert: true // Apply default values if creating
      }
    );

    const formattedNotification = await populateNotification(notification);
    // Emit notification event
    io.getIO().emit(`notification/${request.profileRequestBy}`, formattedNotification);
    io.getIO().emit(`notification/${request.profileRequestTo}`, formattedNotification);
    notificationStatus(request.profileRequestTo);
    notificationStatus(request.profileRequestBy);
    const formattedNotificationAdmin = await populateNotificationOfUsersForAdmin(notification);
    io.getIO().emit(`profileRequestAcDec/${request.profileRequestBy}`, {"message": "request accepted"});
    // Send formatted notification to admin and users with accessType 0 or 1
    sendNotificationToAdmins(formattedNotificationAdmin);
    console.timeEnd('acceptProfileRequest');
    return res.status(201).json({responseMsg, notification : "also created"})
  } catch (error) {
    console.error("Error accepting profile request:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.declineProfileRequest = async (req, res) => {
  console.time('declineProfileRequest'); // Start timing
  try {
    const { requestId } = req.params;
    const {profileRequestToId} = req.query;
    const request = await ProfileRequests.findById(requestId);

    // Check if the request exists
    if (!request) {
      console.timeEnd('declineProfileRequest');
      return res.status(404).json({ error: "Profile request not found" });
    }

    // Check if the user is authorized to cancel the request
    if (request.profileRequestTo.toString() !== profileRequestToId) {
      console.timeEnd('declineProfileRequest');
      return res.status(403).json({ error: "Unauthorized: You cannot decline this profile request" });
    }
    const responseMsg = await updateRequestStatus(
      ProfileRequests,
      requestId,
      "Profile",
      "declined",
      res
    );

    // Emit notification event
    // io.getIO().emit(`profileRequestAcDec/${request.profileRequestBy}`, {"message": "request declined"});
    // Send formatted notification to admin and users with accessType 0 or 1
    // sendNotificationToAdmins(formattedNotification);
    console.timeEnd('declineProfileRequest');
    return res.status(200).json({responseMsg, msg : "message declined"})
  } catch (error) {
    console.error("Error declining profile request:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.cancelProfileRequest = async (req, res) => {
  console.time('cancelProfileRequest'); // Start timing
  try {
    const { requestId } = req.params;
    const {profileRequestById} = req.query;
    const request = await ProfileRequests.findById(requestId);

    // Check if the request exists
    if (!request) {
      console.timeEnd('cancelProfileRequest');
      return res.status(404).json({ error: "Profile request not found" });
    }

    // Check if the user is authorized to cancel the request
    if (request.profileRequestBy.toString() !== profileRequestById) {
      console.timeEnd('cancelProfileRequest');
      return res.status(403).json({ error: "Unauthorized: You cannot cancel this profile request" });
    }
    const responseMsg = await updateRequestStatus(
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
    console.timeEnd('cancelProfileRequest');
    return res.status(200).json({responseMsg, notification : "also deleted or not found"})
  } catch (error) {
    console.error("Error cancelling profile request:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.getProfileRequestsAccepted = async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    const result = await getRequests(ProfileRequests, userId, "Profile", "accepted", res, page, limit);
    const requests = await Promise.all(result.requests);
    // Fetch profile picture URLs for each request
    await Promise.all(requests.map(async (item) => {
      if (item?.profileRequestTo?.selfDetails?.length > 0) {
        const profilePicture = item.profileRequestTo.selfDetails[0]?.profilePicture;
        const profilePictureUrl = getPublicUrlFromS3(profilePicture);
        item.profileRequestTo.selfDetails[0].profilePictureUrl = profilePictureUrl || "";
      } else if (item?.profileRequestTo) {
        item.profileRequestTo.selfDetails = [{}];
        item.profileRequestTo.selfDetails[0].profilePictureUrl = "";
      }

      if (item?.profileRequestBy?.selfDetails?.length > 0) {
        const profilePicture = item.profileRequestBy.selfDetails[0]?.profilePicture;
        const profilePictureUrl = getPublicUrlFromS3(profilePicture);
        item.profileRequestBy.selfDetails[0].profilePictureUrl = profilePictureUrl || "";
      } else if (item?.profileRequestBy) {
        item.profileRequestBy.selfDetails = [{}];
        item.profileRequestBy.selfDetails[0].profilePictureUrl = "";
      }
    }));
    return res.status(200).json({
      requests,
      totalRequests: result.totalRequests,
      currentPage: result.currentPage,
      hasNextPage: result.hasNextPage,
      hasPreviousPage: result.hasPreviousPage,
      nextPage: result.nextPage,
      previousPage: result.previousPage,
      lastPage: result.lastPage,
    });
  } catch (error) {
    console.error("Error getting accepted profile requests:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.getProfileRequestsDeclined = async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    const result = await getRequests(ProfileRequests, userId, "Profile", "declined", res, page, limit);
    const requests = await Promise.all(result.requests);
    // Fetch profile picture URLs for each request
    await Promise.all(requests.map(async (item) => {
      if (item?.profileRequestTo?.selfDetails?.length > 0) {
        const profilePicture = item.profileRequestTo.selfDetails[0]?.profilePicture;
        const profilePictureUrl = getPublicUrlFromS3(profilePicture);
        item.profileRequestTo.selfDetails[0].profilePictureUrl = profilePictureUrl || "";
      } else if (item?.profileRequestTo) {
        item.profileRequestTo.selfDetails = [{}];
        item.profileRequestTo.selfDetails[0].profilePictureUrl = "";
      }

      if (item?.profileRequestBy?.selfDetails?.length > 0) {
        const profilePicture = item.profileRequestBy.selfDetails[0]?.profilePicture;
        const profilePictureUrl = getPublicUrlFromS3(profilePicture);
        item.profileRequestBy.selfDetails[0].profilePictureUrl = profilePictureUrl || "";
      } else if (item?.profileRequestBy) {
        item.profileRequestBy.selfDetails = [{}];
        item.profileRequestBy.selfDetails[0].profilePictureUrl = "";
      }
    }));
    return res.status(200).json({
      requests,
      totalRequests: result.totalRequests,
      currentPage: result.currentPage,
      hasNextPage: result.hasNextPage,
      hasPreviousPage: result.hasPreviousPage,
      nextPage: result.nextPage,
      previousPage: result.previousPage,
      lastPage: result.lastPage,
    });
  } catch (error) {
    console.error("Error getting declined profile requests:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
exports.getProfileRequestsSent = async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    const result = await getPendingRequests(ProfileRequests, userId, "Profile", res, false, page, limit);

    const requests = await Promise.all(result.requests); // Await all the promises in the requests array

    // Fetch profile picture URLs for each request
    await Promise.all(requests.map(async (item) => {
      if (item?.profileRequestTo?.selfDetails?.length > 0) {
        const profilePicture = item.profileRequestTo.selfDetails[0]?.profilePicture;
        const profilePictureUrl = getPublicUrlFromS3(profilePicture);
        item.profileRequestTo.selfDetails[0].profilePictureUrl = profilePictureUrl || "";
      } else {
        item.profileRequestTo.selfDetails = [{}];
        item.profileRequestTo.selfDetails[0].profilePictureUrl = "";
      }
    }));

    return res.status(200).json({
      requests,
      totalRequests: result.totalRequests,
      currentPage: result.currentPage,
      hasNextPage: result.hasNextPage,
      hasPreviousPage: result.hasPreviousPage,
      nextPage: result.nextPage,
      previousPage: result.previousPage,
      lastPage: result.lastPage,
    });
  } catch (error) {
    console.error("Error getting pending profile requests:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};


exports.getProfileRequestsReceived = async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    const result = await getPendingRequests(ProfileRequests, userId, "Profile", res, true, page, limit);

    const requests = await Promise.all(result.requests);

    // Fetch profile picture URLs for each request
    await Promise.all(requests.map(async (item) => {
      if (item?.profileRequestBy?.selfDetails?.length > 0) {
        const profilePicture = item.profileRequestBy.selfDetails[0]?.profilePicture;
        const profilePictureUrl = getPublicUrlFromS3(profilePicture);
        item.profileRequestBy.selfDetails[0].profilePictureUrl = profilePictureUrl || "";
      } else {
        item.profileRequestBy.selfDetails = [{}];
        item.profileRequestBy.selfDetails[0].profilePictureUrl = "";
      }
    }));

    return res.status(200).json({
      requests,
      totalRequests: result.totalRequests,
      currentPage: result.currentPage,
      hasNextPage: result.hasNextPage,
      hasPreviousPage: result.hasPreviousPage,
      nextPage: result.nextPage,
      previousPage: result.previousPage,
      lastPage: result.lastPage,
    });
  } catch (error) {
    console.error("Error getting pending profile requests:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};






// Interest Request Section

exports.sendInterestRequest = async (req, res) => {
  console.time('sendInterestRequest'); // Start timing
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

    const blockedMessages = [
      `Interest request can't be sent as you have blocked the user`,
      `Interest request can't be sent as you are blocked by this user`
    ];
    
    const acceptedMessages = [
      `You have accepted the Interest request from this user`,
      `Interest: request can't be sent as your request to this person has been accepted`
    ];
    
    if (blockedMessages.includes(message) || acceptedMessages.includes(message)) {
      console.timeEnd('sendInterestRequest');
      return res.status(403).json(message);
    }

    if(message !== "This person has already sent an Interest request to you"){
          // Create or update notification for interest request sent
      const notification = await Notifications.findOneAndUpdate(
        {
          notificationTo: interestRequestTo,
          notificationBy: interestRequestBy,
          notificationType: "interestsent"
        },
        {
          notificationTo: interestRequestTo,
          notificationBy: interestRequestBy,
          notificationText: `You have sent an Interest request from ${interestRequestBy}`,
          notificationType: "interestsent"
        },
        {
          new: true, // Return the updated document
          upsert: true, // Create the document if it doesn't exist
          setDefaultsOnInsert: true // Apply default values if creating
        }
      );
      const formattedNotification = await populateNotification(notification);
      io.getIO().emit(`notification/${interestRequestTo}`, formattedNotification);
      io.getIO().emit(`notification/${interestRequestBy}`, formattedNotification);
      notificationStatus(interestRequestTo);
      notificationStatus(interestRequestBy);
      const formattedNotificationAdmin = await populateNotificationOfUsersForAdmin(notification);
      io.getIO().emit(`interestRequestSent/${interestRequestTo}`, {"message": "request sent"});
      // Send formatted notification to admin and users with accessType 0 or 1
      sendNotificationToAdmins(formattedNotificationAdmin);
    }
    console.timeEnd('sendInterestRequest');
    return res.status(200).json(message);
  } catch (error) {
    console.error("Error sending interest request:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.acceptInterestRequest = async (req, res) => {
  console.time('acceptInterestRequest'); // Start timing
  try {
    const { requestId } = req.params;
    const {interestRequestToId} = req.query;
    const request = await InterestRequests.findById(requestId);

    // Check if the request exists
    if (!request) {
      console.timeEnd('acceptInterestRequest');
      return res.status(404).json({ error: "Interest request not found" });
    }

    // Check if the user is authorized to cancel the request
    if (request.interestRequestTo.toString() !== interestRequestToId) {
      console.timeEnd('acceptInterestRequest');
      return res.status(403).json({ error: "Unauthorized: You cannot accept this interest request" });
    }
    const responseMsg = await updateRequestStatus(
      InterestRequests,
      requestId,
      "Interest",
      "accepted",
      res
    );
    // Create or update notification for interest request accepted
    const notification = await Notifications.findOneAndUpdate(
      {
        notificationTo: request.interestRequestBy,
        notificationBy: request.interestRequestTo,
        notificationType: "interestaccepted"
      },
      {
        notificationTo: request.interestRequestBy,
        notificationBy: request.interestRequestTo,
        notificationText: `${request.interestRequestTo} has accepted the interest request from ${request.interestRequestBy}`,
        notificationType: "interestaccepted"
      },
      {
        new: true, // Return the updated document
        upsert: true, // Create the document if it doesn't exist
        setDefaultsOnInsert: true // Apply default values if creating
      }
    );

    const formattedNotification = await populateNotification(notification);

    // Emit notification event
    io.getIO().emit(`notification/${request.interestRequestBy}`, formattedNotification);
    io.getIO().emit(`notification/${request.interestRequestTo}`, formattedNotification);
    notificationStatus(request.interestRequestTo);
    notificationStatus(request.interestRequestBy);
    const formattedNotificationAdmin = await populateNotificationOfUsersForAdmin(notification);
    io.getIO().emit(`interestRequestAcDec/${request.interestRequestBy}`, {"message": "request accepted"});
    // Send formatted notification to admin and users with accessType 0 or 1
    sendNotificationToAdmins(formattedNotificationAdmin);
    console.timeEnd('acceptInterestRequest');
    return res.status(201).json({responseMsg, notification : "also created"})
  } catch (error) {
    console.error("Error accepting interest request:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.declineInterestRequest = async (req, res) => {
  console.time('declineInterestRequest'); // Start timing
  try {
    const { requestId } = req.params;
    const {interestRequestToId} = req.query;
    const request = await InterestRequests.findById(requestId);

    // Check if the request exists
    if (!request) {
      console.timeEnd('declineInterestRequest');
      return res.status(404).json({ error: "Interest request not found" });
    }

    // Check if the user is authorized to cancel the request
    if (request.interestRequestTo.toString() !== interestRequestToId) {
      console.timeEnd('declineInterestRequest');
      return res.status(403).json({ error: "Unauthorized: You cannot dcline this interest request" });
    }

    const responseMsg = await updateRequestStatus(
      InterestRequests,
      requestId,
      "Interest",
      "declined",
      res
    );

    // Emit notification event
    // io.getIO().emit(`interestRequestAcDec/${request.interestRequestBy}`, {"message": "request declined"});
    console.timeEnd('declineInterestRequest');
    return res.status(200).json({responseMsg, msg : "message declined"})
  } catch (error) {
    console.error("Error declining interest request:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.cancelInterestRequest = async (req, res) => {
  console.time('cancelInterestRequest'); // Start timing
  try {
    const { requestId } = req.params;
    const {interestRequestById} = req.query
    const request = await InterestRequests.findById(requestId);

    // Check if the request exists
    if (!request) {
      console.timeEnd('cancelInterestRequest');
      return res.status(404).json({ error: "Interest request not found" });
    }

    // Check if the user is authorized to cancel the request
    if (request.interestRequestBy.toString() !== interestRequestById) {
      console.timeEnd('cancelInterestRequest');
      return res.status(403).json({ error: "Unauthorized: You cannot cancel this interest request" });
    }

    const responseMsg = await updateRequestStatus(
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
    console.timeEnd('cancelInterestRequest');
    return res.status(201).json({responseMsg, notification : "also deleted or not found"})
  } catch (error) {
    console.error("Error declining interest request:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.getInterestRequestsAccepted = async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    const result = await getRequests(InterestRequests, userId, "Interest", "accepted", res, page, limit);
    const requests = await Promise.all(result.requests);

    await Promise.all(requests.map(async (item) => {
      // Handle interestRequestTo
      if (item?.interestRequestTo?.selfDetails?.length > 0) {
        const profilePictureTo = item.interestRequestTo.selfDetails[0]?.profilePicture;
        const profilePictureUrlTo = getPublicUrlFromS3(profilePictureTo);
        item.interestRequestTo.selfDetails[0].profilePictureUrl = profilePictureUrlTo || "";
      } else {
        item.interestRequestTo = item.interestRequestTo || {};
        item.interestRequestTo.selfDetails = item.interestRequestTo.selfDetails || [{}];
         // Set profilePictureUrl for the first element safely
         if (item.interestRequestTo.selfDetails.length > 0) {
          item.interestRequestTo.selfDetails[0].profilePictureUrl = "";
        }
      }

      // Handle interestRequestBy
      if (item?.interestRequestBy?.selfDetails?.length > 0) {
        const profilePictureBy = item.interestRequestBy.selfDetails[0]?.profilePicture;
        const profilePictureUrlBy = getPublicUrlFromS3(profilePictureBy);
        item.interestRequestBy.selfDetails[0].profilePictureUrl = profilePictureUrlBy || "";
      } else {
        item.interestRequestBy = item.interestRequestBy || {};
        item.interestRequestBy.selfDetails = item.interestRequestBy.selfDetails || [{}];
         // Set profilePictureUrl for the first element safely
         if (item.interestRequestBy.selfDetails.length > 0) {
          item.interestRequestBy.selfDetails[0].profilePictureUrl = "";
        }
      }
    }));

    return res.status(200).json({
      requests,
      totalRequests: result.totalRequests,
      currentPage: result.currentPage,
      hasNextPage: result.hasNextPage,
      hasPreviousPage: result.hasPreviousPage,
      nextPage: result.nextPage,
      previousPage: result.previousPage,
      lastPage: result.lastPage,
    });
  } catch (error) {
    console.error("Error getting accepted interest requests:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.getInterestRequestsDeclined = async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    const result = await getRequests(InterestRequests, userId, "Interest", "declined", res, page, limit);
    const requests = await Promise.all(result.requests);
    await Promise.all(requests.map(async (item) => {
      // Handle interestRequestTo
      if (item?.interestRequestTo?.selfDetails?.length > 0) {
        const profilePictureTo = item.interestRequestTo.selfDetails[0]?.profilePicture;
        const profilePictureUrlTo = getPublicUrlFromS3(profilePictureTo);
        item.interestRequestTo.selfDetails[0].profilePictureUrl = profilePictureUrlTo || "";
      } else {
        item.interestRequestTo = item.interestRequestTo || {};
        item.interestRequestTo.selfDetails = item.interestRequestTo.selfDetails || [{}];
         // Set profilePictureUrl for the first element safely
         if (item.interestRequestTo.selfDetails.length > 0) {
          item.interestRequestTo.selfDetails[0].profilePictureUrl = "";
        }
      }

      // Handle interestRequestBy
      if (item?.interestRequestBy?.selfDetails?.length > 0) {
        const profilePictureBy = item.interestRequestBy.selfDetails[0]?.profilePicture;
        const profilePictureUrlBy = getPublicUrlFromS3(profilePictureBy);
        item.interestRequestBy.selfDetails[0].profilePictureUrl = profilePictureUrlBy || "";
      } else {
        item.interestRequestBy = item.interestRequestBy || {};
        item.interestRequestBy.selfDetails = item.interestRequestBy.selfDetails || [{}];
         // Set profilePictureUrl for the first element safely
         if (item.interestRequestBy.selfDetails.length > 0) {
          item.interestRequestBy.selfDetails[0].profilePictureUrl = "";
        }
      }
    }));

    return res.status(200).json({
      requests,
      totalRequests: result.totalRequests,
      currentPage: result.currentPage,
      hasNextPage: result.hasNextPage,
      hasPreviousPage: result.hasPreviousPage,
      nextPage: result.nextPage,
      previousPage: result.previousPage,
      lastPage: result.lastPage,
    });
  } catch (error) {
    console.error("Error getting declined interest requests:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.getInterestRequestsSent = async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    const result = await getPendingRequests(InterestRequests, userId, "Interest", res, false, page, limit);
    const requests = await Promise.all(result.requests);

    await Promise.all(requests.map(async (item) => {
      if (item?.interestRequestTo?.selfDetails?.length > 0) {
        const profilePictureTo = item.interestRequestTo.selfDetails[0]?.profilePicture;
        const profilePictureUrlTo = getPublicUrlFromS3(profilePictureTo);
        item.interestRequestTo.selfDetails[0].profilePictureUrl = profilePictureUrlTo || "";
      } else {
        item.interestRequestTo = item.interestRequestTo || {};
        item.interestRequestTo.selfDetails = item.interestRequestTo.selfDetails || [{}];
         // Set profilePictureUrl for the first element safely
         if (item.interestRequestTo.selfDetails.length > 0) {
          item.interestRequestTo.selfDetails[0].profilePictureUrl = "";
        }
      }
    }));

    return res.status(200).json({
      requests,
      totalRequests: result.totalRequests,
      currentPage: result.currentPage,
      hasNextPage: result.hasNextPage,
      hasPreviousPage: result.hasPreviousPage,
      nextPage: result.nextPage,
      previousPage: result.previousPage,
      lastPage: result.lastPage,
    });
  } catch (error) {
    console.error("Error getting pending interest requests:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};



exports.getInterestRequestsReceived = async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    const result = await getPendingRequests(InterestRequests, userId, "Interest", res, true, page, limit);
    const requests = await Promise.all(result.requests);

    await Promise.all(requests.map(async (item) => {
      if (item?.interestRequestBy?.selfDetails?.length > 0) {
        const profilePictureBy = item.interestRequestBy.selfDetails[0]?.profilePicture;
        const profilePictureUrlBy = getPublicUrlFromS3(profilePictureBy);
        item.interestRequestBy.selfDetails[0].profilePictureUrl = profilePictureUrlBy || "";
      } else {
        item.interestRequestBy = item.interestRequestBy || {};
        item.interestRequestBy.selfDetails = item.interestRequestBy.selfDetails || [{}];
         // Set profilePictureUrl for the first element safely
         if (item.interestRequestBy.selfDetails.length > 0) {
          item.interestRequestBy.selfDetails[0].profilePictureUrl = "";
        }
      }
    }));

    return res.status(200).json({
      requests,
      totalRequests: result.totalRequests,
      currentPage: result.currentPage,
      hasNextPage: result.hasNextPage,
      hasPreviousPage: result.hasPreviousPage,
      nextPage: result.nextPage,
      previousPage: result.previousPage,
      lastPage: result.lastPage,
    });
  } catch (error) {
    console.error("Error getting pending interest requests:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
