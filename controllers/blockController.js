const BlockedUser = require('../models/BlockedUser');

exports.blockUser = async (req, res) => {
  try {
    const { blockedBy, blockedUserId } = req.body;

    // Check if the user is already blocked
    const existingBlockedUser = await BlockedUser.findOne({ blockedBy, BlockedUser: blockedUserId });

    if (existingBlockedUser) {
      return res.status(400).json({ error: "User already blocked" });
    }

    // Create a new blocked user entry
    const blockedUser = new BlockedUser({ blockedBy, BlockedUser: blockedUserId });
    await blockedUser.save();

    res.status(200).json({ message: "User blocked successfully", blockedUser });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.unblockUser = async (req, res) => {
  try {
    const { blockedBy, blockedUserId } = req.body;

    // Find and delete the blocked user entry
    const blockedUser = await BlockedUser.findOneAndDelete({ blockedBy, BlockedUser: blockedUserId });

    if (!blockedUser) {
      return res.status(404).json({ error: "Blocked user not found" });
    }

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
    const blockedUsers = await BlockedUser.find({ blockedBy: userId }).populate('BlockedUser');

    res.status(200).json({ blockedUsers });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
