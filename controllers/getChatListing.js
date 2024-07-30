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

const { checkAcceptedInterestRequest } = require('../middleware/checkAcceptedInterestRequest');

exports.getPaginatedMessages = async (req, res) => {
  try {
    const { chatInitiatedBy, chatInitiatedTo, page, limit } = req.query;

    if (!chatInitiatedBy || !chatInitiatedTo) {
      return res.status(400).json({ error: 'Both chatInitiatedBy and chatInitiatedTo are required' });
    }

    const messages = await checkAcceptedInterestRequest(
      { chatInitiatedBy, chatInitiatedTo },
      page,
      limit
    );

    if (messages instanceof Error) {
      return res.status(404).json({ error: messages.message });
    }

    return res.status(200).json(messages);
  } catch (error) {
    console.error('Error fetching paginated messages:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
