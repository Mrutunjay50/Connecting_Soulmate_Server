const {
  getAllUsers,
  getNewlyJoinedProfiles,
  getMatchesAccordingToPreference
} = require("../controllers/matchingProfile");

const {addToShortlist, getShortlistedUser} = require("../controllers/shortlistController");

module.exports = (app) => {
  app.post("/shortlist/add", addToShortlist);
  app.get("/getUser/:gender", getAllUsers);
  app.get("/getUserPre/:gender", getMatchesAccordingToPreference);
  app.get("/newlyJoined/:gender", getNewlyJoinedProfiles);
  app.get("/shortlist/get/:UserId", getShortlistedUser);
};
