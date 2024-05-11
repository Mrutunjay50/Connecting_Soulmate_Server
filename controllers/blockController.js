const BlockedUser = require('../models/blockedUser');
const { InterestRequests, ProfileRequests } = require('../models/interests');

exports.blockUser = async (req, res) => {
  try {
    const { blockBy, blockUserId } = req.body;

    // Check if the user is already blocked
    const existingBlockedUser = await BlockedUser.findOne({ blockedBy : blockBy, blockedUser: blockUserId });
    console.log(existingBlockedUser);

    if (existingBlockedUser) {
      return res.status(400).json({ error: "User already blocked" });
    }

    // Create a new blocked user entry
    const blockedUser = new BlockedUser({ blockedBy : blockBy, blockedUser: blockUserId });

    await Promise.all([
      ProfileRequests.updateMany(
        { profileRequestBy: blockBy, profileRequestTo: blockUserId },
        { isBlocked: true }
      ),
      InterestRequests.updateMany(
        { interestRequestBy: blockBy, interestRequestTo: blockUserId },
        { isBlocked: true }
      )
    ]);
    await blockedUser.save();

    res.status(200).json({ message: "User blocked successfully", blockedUser });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error", err });
  }
};

exports.unblockUser = async (req, res) => {
  try {
    const { blockedBy, blockedUserId } = req.body;

    // Find and delete the blocked user entry
    const blockedUser = await BlockedUser.findOneAndDelete({ blockedBy, blockedUser: blockedUserId });

    if (!blockedUser) {
      return res.status(404).json({ error: "Blocked user not found" });
    }
    await Promise.all([
      ProfileRequests.updateMany(
        { profileRequestBy: blockedBy, profileRequestTo: blockedUserId },
        { isBlocked: false }
      ),
      InterestRequests.updateMany(
        { interestRequestBy: blockedBy, interestRequestTo: blockedUserId },
        { isBlocked: false }
      )
    ]);

    res.status(200).json({ message: "User unblocked successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.getBlockedUsers = async (req, res) => {
  try {
    const { userId } = req.params;

    // Find all users blocked by the specified user
    const blockedUsers = await BlockedUser.find({ blockedBy: userId }).populate('blockedUser');

    res.status(200).json({ blockedUsers });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
