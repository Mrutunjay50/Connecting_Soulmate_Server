const Matches = require("../models/matches");
const ShortList = require("../models/ShortlistedUser");

exports.sendMatchRequest = async (senderId, recipientId) => {
    try {
      const matchRequest = new Matches({
        matchedBy: senderId,
        matchedTo: recipientId,
        status: "pending",
      });
      await matchRequest.save();
      return matchRequest;
    } catch (error) {
      console.error("Error sending match request:", error);
      throw new Error("Failed to send match request");
    }
  };
  
  // Function to respond to a match request
  exports.respondToMatchRequest = async (matchRequestId, response) => {
    try {
      await Matches.findByIdAndUpdate(matchRequestId, { status: response });
    } catch (error) {
      console.error("Error responding to match request:", error);
      throw new Error("Failed to respond to match request");
    }
  };
  
  exports.addToShortlist = async (req, res) => {
    try {
      const { user, shortlistedUserId } = req.body;
      let shortlist = await ShortList.findOne({ user });
  
      if (!shortlist) {
        shortlist = new ShortList({ user, shortlistedUser: [] });
      }
      shortlist.shortlistedUser.push(shortlistedUserId);
  
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
      const user = await ShortList.findOne({ user: UserId });
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.status(200).json(user);
    } catch (error) {
      console.error("Error fetching shortlisted user:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  };
  
  exports.getAllMatches = async (req, res) => {
    try {
      // Find all matches
      const matches = await Matches.find().populate("matchedBy matchedTo");
  
      res.status(200).json(matches);
    } catch (error) {
      console.error("Error retrieving matches:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  };
  exports.getUserMatches = async (req, res) => {
    try {
      const userId = req.params.userId;
  
      // Find matches where the specified user is either matchedBy or matchedTo
      const userMatches = await Matches.find({
        $or: [{ matchedBy: userId }, { matchedTo: userId }],
      }).populate("matchedBy matchedTo");
  
      res.status(200).json(userMatches);
    } catch (error) {
      console.error("Error retrieving user matches:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  };