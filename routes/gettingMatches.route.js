const {
  getAllUsers,
  deleteMatchById,
  getUserById,
  updateUserSchema,
  getNewlyJoinedProfiles,
  
  getMatchesAccordingToPreference
} = require("../controllers/matchingProfile");

const {sendMatchRequest, respondToMatchRequest, addToShortlist, getShortlistedUser, getAllMatches, getUserMatches, createMatch,} = require("../controllers/requestController");

module.exports = (app) => {
  app.get("/getUser/:gender", getAllUsers);
  app.get("/getUserPre/:gender", getMatchesAccordingToPreference);
  app.get("/newlyJoined/:gender", getNewlyJoinedProfiles);
  // Route to send a match request
  app.post("/matches/send-request", async (req, res) => {
    try {
      const { senderId, recipientId } = req.body;
      const matchRequest = await sendMatchRequest(senderId, recipientId);
      res.status(201).json(matchRequest);
    } catch (error) {
      console.error("Error sending match request:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  // Route to respond to a match request
  app.post("/matches/respond", async (req, res) => {
    try {
      const { matchRequestId, response } = req.body;
      await respondToMatchRequest(matchRequestId, response);
      res.status(200).json({ message: "Match request responded successfully" });
    } catch (error) {
      console.error("Error responding to match request:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  app.post("/shortlist/add", addToShortlist);
  app.get("/shortlist/get/:UserId", getShortlistedUser);
  app.get("/matches/get", getAllMatches);
  app.get("/matches/get/:userId", getUserMatches);
};
