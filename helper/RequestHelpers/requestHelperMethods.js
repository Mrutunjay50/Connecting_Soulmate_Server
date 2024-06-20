const ShortList = require("../../models/shortlistUsers");
const { ProfileRequests, InterestRequests } = require("../../models/interests");
const { ListData } = require("../cardListedData");

const processRequest = async (
  Model,
  requestBy,
  requestTo,
  type,
  action,
  res
) => {
  try {
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
      if (viceVersaRequest.action === "declined") {
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
      } else if (existingRequest.action === "blocked") {
        return `${type}: request can't be sent as you have blocked the user`;
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

exports.getPendingRequests = async (Model, userId, type, res, received, page = 1, limit = 10) => {
  const skip = (page - 1) * limit;
  try {
    const requests = await Model.find({
      [`${type.toLowerCase()}Request${received ? "To" : "By"}`]: userId,
      action: "pending",
      isBlocked: false,
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

    return await Promise.all(promises);
  } catch (error) {
    console.error(`Error getting pending ${type} requests:`, error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};


exports.getRequests = async (Model, userId, type, status, res, page = 1, limit = 10) => {
  try {
    const skip = (page - 1) * limit;
    let requests;

    if (status === "pending") {
      requests = await Model.find({
        $or: [
          {
            [`${type.toLowerCase()}RequestBy`]: userId,
            action: status,
            isBlocked: false,
          },
        ],
      }).populate([
          { path: `${type.toLowerCase()}RequestBy`, select: ListData },
          { path: `${type.toLowerCase()}RequestTo`, select: ListData },
        ])
        .skip(skip)
        .limit(limit);
    } else {
      requests = await Model.find({
        $or: [
          {
            [`${type.toLowerCase()}RequestBy`]: userId,
            action: status,
            isBlocked: false,
          },
          {
            [`${type.toLowerCase()}RequestTo`]: userId,
            action: status,
            isBlocked: false,
          },
        ],
      }).populate([
          { path: `${type.toLowerCase()}RequestBy`, select: ListData },
          { path: `${type.toLowerCase()}RequestTo`, select: ListData },
        ])
        .skip(skip)
        .limit(limit);
    }

    const promises = requests.map(async (request) => {
      return setRequestFlags(
        request,
        request[type.toLowerCase() + "RequestBy"],
        request[type.toLowerCase() + "RequestTo"]
      );
    });

    return await Promise.all(promises);
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
    }),
    InterestRequests.findOne({
      interestRequestBy: requestTo,
      interestRequestTo: requestBy,
    }),
    ProfileRequests.findOne({
      profileRequestBy: requestBy,
      profileRequestTo: requestTo,
    }),
    ProfileRequests.findOne({
      profileRequestBy: requestTo,
      profileRequestTo: requestBy,
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
