const { ProfileRequests, InterestRequests } = require("../models/interests");
const ShortList = require("../models/shortlistUsers");
const User = require("../models/Users");

exports.getUserDashboard = async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId);
    if(!user){
      return res.status(404).json({ message: "User not found" });
    }
    // Count interest requests where the user is the requester and action is pending
    const interestRequestsByUser = await InterestRequests.countDocuments({
      interestRequestBy: userId,
      action: "pending",
    });

    // Count interest requests where the user is the recipient and action is pending
    const interestRequestsToUser = await InterestRequests.countDocuments({
      interestRequestTo: userId,
      action: "pending",
    });

    // Count profile requests where the user is the requester and action is pending
    const profileRequestsByUser = await ProfileRequests.countDocuments({
      profileRequestBy: userId,
      action: "pending",
    });

    // Count profile requests where the user is the recipient and action is pending
    const profileRequestsToUser = await ProfileRequests.countDocuments({
      profileRequestTo: userId,
      action: "pending",
    });

    // Count accepted profile requests where the user is either the requester or the recipient
    const acceptedProfileRequests = await ProfileRequests.countDocuments({
      $or: [
        { profileRequestBy: userId, action: "accepted" },
        { profileRequestTo: userId, action: "accepted" },
      ],
    });
    const acceptedInterestRequests = await InterestRequests.countDocuments({
      $or: [
        { interestRequestBy: userId, action: "accepted" },
        { interestRequestTo: userId, action: "accepted" },
      ],
    });
    const shortListed = await ShortList.countDocuments({
        user : userId
    });

    res.status(200).json({
      interestRequestsByUser,
      interestRequestsToUser,
      profileRequestsByUser,
      profileRequestsToUser,
      acceptedProfileRequests,
      acceptedInterestRequests,
      shortListed,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};