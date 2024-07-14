const ShortList = require("../../models/shortlistUsers");
const { ProfileRequests, InterestRequests } = require("../../models/interests");
const { ListData } = require("../cardListedData");
const BlockedUser = require("../../models/blockedUser");

const processRequest = async (
  Model,
  requestBy,
  requestTo,
  type,
  action,
  res
) => {
  try {

    // Fetch all blocked users for requestBy
    const blockedUsers = await BlockedUser.find({ blockedBy: requestBy }).distinct('blockedUser');

    // Check if requestTo is in the blockedUsers list (blockedBy requestBy)
    if (blockedUsers.includes(requestTo.toString())) {
      return `${type} request can't be sent as you have blocked the user`;
    }

    // Check if requestBy is blocked by requestTo
    const blockedByRequestTo = await BlockedUser.findOne({
      blockedBy: requestTo,
      blockedUser: requestBy
    });

    if (blockedByRequestTo) {
      return `${type} request can't be sent as you are blocked by this user`;
    }

    if (type === 'Interest' && action === "accepted") {
      const existingProfileRequest = await ProfileRequests.findOne({
        profileRequestBy: requestBy,
        profileRequestTo: requestTo
      });

      const viceVersaProfileRequest = await ProfileRequests.findOne({
        profileRequestBy: requestTo,
        profileRequestTo: requestBy
      });

      if (existingProfileRequest) {
        await ProfileRequests.deleteOne({ _id: existingProfileRequest._id });
      }

      if (viceVersaProfileRequest) {
        await ProfileRequests.deleteOne({ _id: viceVersaProfileRequest._id });
      }
    } else if(type === "Profile") {
      const existingInterestRequest = await InterestRequests.findOne({
        interestRequestBy: requestBy,
        interestRequestTo: requestTo,
        action : "accepted"
      });

      const viceVersaInterestRequest = await InterestRequests.findOne({
        interestRequestBy: requestTo,
        interestRequestTo: requestBy,
        action : "accepted"
      });
      if (existingInterestRequest) {
        return `Already have an accepted interest request from you`
      }

      if (viceVersaInterestRequest) {
        return `Already have an accepted interest request from this user`
      }
    }

    // Check for an existing request from requestBy to requestTo
    const existingRequest = await Model.findOne({
      [`${type.toLowerCase()}RequestBy`]: requestBy,
      [`${type.toLowerCase()}RequestTo`]: requestTo,
    });

    // Check for an existing request from requestTo to requestBy (vice versa)
    const viceVersaRequest = await Model.findOne({
      [`${type.toLowerCase()}RequestBy`]: requestTo,
      [`${type.toLowerCase()}RequestTo`]: requestBy,
    });

    // If vice versa request exists, return the appropriate message
    // Handle vice versa request
    if (viceVersaRequest) {
      if (viceVersaRequest.action === "accepted") {
        return `You have accepted the ${type} request from this user`;
      } else if (viceVersaRequest.action === "declined") {
        if (action === "pending") {
          // Delete the declined vice versa request
          await Model.deleteOne({
            [`${type.toLowerCase()}RequestBy`]: requestTo,
            [`${type.toLowerCase()}RequestTo`]: requestBy,
          });

          // Create a new request and indicate it was sent from the declined section
          const newRequest = new Model({
            [`${type.toLowerCase()}RequestBy`]: requestBy,
            [`${type.toLowerCase()}RequestTo`]: requestTo,
            action,
          });
          await newRequest.save();
          return `You have sent the ${type} request from your declined section`;
        } else {
          return `This person has already sent an ${type} request to you and you have declined it`;
        }
      }
      return `This person has already sent an ${type} request to you`;
    }

    // Handle existing request from requestBy to requestTo
    if (existingRequest) {
      if (existingRequest.action === "pending" && action === "pending") {
        return `${type} request already sent`;
      } else if (existingRequest.action === "accepted") {
        return `${type}: request can't be sent as your request to this person has been accepted`;
      } else {
        existingRequest.action = action; // Change the action to 'pending'
        await existingRequest.save();
        return `${type} request updated to ${action}`;
      }
    }

    // Create a new request
    const newRequest = new Model({
      [`${type.toLowerCase()}RequestBy`]: requestBy,
      [`${type.toLowerCase()}RequestTo`]: requestTo,
      action,
    });

    // await setRequestFlags(newRequest, requestBy, requestTo);
    await newRequest.save();
    return `${type} request sent successfully`;
  } catch (error) {
    console.error("Error processing request:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.sendRequest = async (
  Model,
  requestBy,
  requestTo,
  type,
  action,
  res
) => {
  return await processRequest(Model, requestBy, requestTo, type, action, res);
};

exports.updateRequestStatus = async (Model, requestId, type, status, res) => {
  try {
    const request = await Model.findById(requestId);
    if (!request) {
      return { error: "Request not found" };
    }
    // let Type;
    if (status === "cancelled") {
      await Model.findByIdAndDelete(requestId);
      return { message: `${type} request has been cancelled and deleted` };
    }
    request.action = status;

    return await processRequest(
      Model,
      request[`${type.toLowerCase()}RequestBy`],
      request[`${type.toLowerCase()}RequestTo`],
      type,
      status,
      res
    );
  } catch (error) {
    console.error(`Error updating ${type} request status:`, error);
    // console.error("Error processing request:", flatted.stringify(error));
    res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.getPendingRequests = async (Model, userId, type, res, received, page = 1, limit = 50) => {
  const skip = (parseInt(page) - 1) * parseInt(limit);

  try {
    // Calculate the total number of pending requests
    const totalPendingRequests = await Model.countDocuments({
      [`${type.toLowerCase()}Request${received ? "To" : "By"}`]: userId,
      action: "pending",
    });

    console.log(totalPendingRequests);
    // Fetch pending requests with pagination
    const requests = await Model.find({
      [`${type.toLowerCase()}Request${received ? "To" : "By"}`]: userId,
      action: "pending",
    })
      .populate({
        path: `${type.toLowerCase()}Request${received ? "By" : "To"}`,
        select: ListData,
      })
      .skip(skip)
      .limit(limit);

    const promises = requests.map(async (request) => {
      return setRequestFlags(
        request,
        request[type.toLowerCase() + "RequestBy"],
        request[type.toLowerCase() + "RequestTo"]
      );
    });

    await Promise.all(promises);
    const results = promises
    // Pagination information
    const totalPages = Math.ceil(totalPendingRequests / limit);
    const hasNextPage = page < totalPages;
    const hasPreviousPage = page > 1;
    // Send the response with pagination information
    return {
      requests: results,
      totalRequests : totalPendingRequests,
      currentPage: parseInt(page),
      hasNextPage,
      hasPreviousPage,
      nextPage: hasNextPage ? parseInt(page) + 1 : null,
      previousPage: hasPreviousPage ? parseInt(page) - 1 : null,
      lastPage: totalPages,
    }
  } catch (error) {
    console.error(`Error getting pending ${type} requests:`, error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};


exports.getRequests = async (Model, userId, type, status, res, page = 1, limit = 50) => {
  try {
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Determine the query based on status
    const query = status === "pending"
      ? {
          $or: [
            {
              [`${type.toLowerCase()}RequestBy`]: userId,
              action: status,
            },
          ],
        }
      : {
          $or: [
            {
              [`${type.toLowerCase()}RequestBy`]: userId,
              action: status,
            },
            {
              [`${type.toLowerCase()}RequestTo`]: userId,
              action: status,
            },
          ],
        };

    // Calculate the total number of requests
    const totalRequests = await Model.countDocuments(query);

    // Fetch requests with pagination
    const requests = await Model.find(query)
      .populate([
        { path: `${type.toLowerCase()}RequestBy`, select: ListData },
        { path: `${type.toLowerCase()}RequestTo`, select: ListData },
      ])
      .skip(skip)
      .limit(limit);

    // Set request flags
    const results = await Promise.all(requests.map(async (request) => {
      return setRequestFlags(
        request,
        request[type.toLowerCase() + "RequestBy"],
        request[type.toLowerCase() + "RequestTo"]
      );
    }));

    // Pagination information
    const totalPages = Math.ceil(totalRequests / limit);
    const hasNextPage = page < totalPages;
    const hasPreviousPage = page > 1;

    // Send the response with pagination information
    return {
      requests: results,
      totalRequests,
      currentPage: parseInt(page),
      hasNextPage,
      hasPreviousPage,
      nextPage: hasNextPage ? parseInt(page) + 1 : null,
      previousPage: hasPreviousPage ? parseInt(page) - 1 : null,
      lastPage: totalPages,
    };
  } catch (error) {
    console.error(`Error getting ${status} ${type} requests:`, error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};


const setRequestFlags = async (request, requestBy, requestTo) => {
  const [
    shortlistBy,
    shortlistTo,
    interestlistBy,
    interestlistTo,
    profilelistBy,
    profilelistTo,
  ] = await Promise.all([
    ShortList.findOne({ user: requestBy, shortlistedUser: requestTo }),
    ShortList.findOne({ user: requestTo, shortlistedUser: requestBy }),
    InterestRequests.findOne({
      interestRequestBy: requestBy,
      interestRequestTo: requestTo,
      action: { $ne: 'declined' },
    }),
    InterestRequests.findOne({
      interestRequestBy: requestTo,
      interestRequestTo: requestBy,
      action: { $ne: 'declined' },
    }),
    ProfileRequests.findOne({
      profileRequestBy: requestBy,
      profileRequestTo: requestTo,
      action: { $ne: 'declined' },
    }),
    ProfileRequests.findOne({
      profileRequestBy: requestTo,
      profileRequestTo: requestBy,
      action: { $ne: 'declined' },
    }),
  ]);

  request.isShortListedBy = !!shortlistBy;
  request.isShortListedTo = !!shortlistTo;
  request.isInterestRequestBy = !!interestlistBy;
  request.isInterestRequestTo = !!interestlistTo;
  request.isProfileRequestBy = !!profilelistBy;
  request.isProfileRequestTo = !!profilelistTo;

  return request;
};
