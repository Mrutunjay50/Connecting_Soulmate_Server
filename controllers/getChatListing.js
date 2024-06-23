const {InterestRequests} = require('../models/interests');
const User = require('../models/Users');
const { getSignedUrlFromS3 } = require('../utils/s3Utils');

exports.getChatUsers = async (req, res) => {
  try {
    const { userId } = req.params;

    // Find interest requests where the user is either the sender or receiver and the request is accepted
    const interestRequests = await InterestRequests.find({
      $or: [
        { interestRequestBy: userId, action: 'accepted' },
        { interestRequestTo: userId, action: 'accepted' }
      ]
    });

    // Extract the IDs of the users to chat with
    const userIds = interestRequests.map(req => 
      req.interestRequestBy.toString() === userId ? req.interestRequestTo : req.interestRequestBy
    );

    // Find user details and populate the required fields
    const users = await User.find({ _id: { $in: userIds } })
      .select('basicDetails.name userId selfDetails.profilePicture');

    // Fetch signed URLs for profile pictures
    const userDetails = await Promise.all(users.map(async user => {
      const profilePictureUrl = await getSignedUrlFromS3(user.selfDetails[0]?.profilePicture || "");
      return {
        userId: user.userId,
        name: user.basicDetails[0]?.name,
        profilePictureUrl: profilePictureUrl || "",
        _id : user._id
      };
    }));

    res.status(200).json({ users: userDetails });
  } catch (err) {
    console.error("Error fetching chat users:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
