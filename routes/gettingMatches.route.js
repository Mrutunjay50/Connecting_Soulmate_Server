const {
  getAllUsers,
  getNewlyJoinedProfiles,
  getMatchesAccordingToPreference
} = require("../controllers/matchingProfile");

const {addToShortlist, getShortlistedUser} = require("../controllers/shortlistController");

module.exports = (app) => {
  app.post("/shortlist/add", addToShortlist);
  app.get("/shortlist/get/:userId", getShortlistedUser);
  app.get("/getUser/:gender", getAllUsers);
  app.get("/getUserPre/:userId", getMatchesAccordingToPreference);
  app.get("/newlyJoined/:userId", getNewlyJoinedProfiles);
};
