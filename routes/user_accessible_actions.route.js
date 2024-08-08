const {
  getNewlyJoinedProfiles,
  getMatchesAccordingToPreference
} = require("../controllers/matchingProfile");
const { reportUser } = require("../controllers/reportController.js");
const searchController = require("../controllers/search.js");
const {addToShortlist, getShortlistedUser} = require("../controllers/shortlistController");
const { isAuth } = require("../middleware/is_auth");

module.exports = (app) => {
  //shortlist
  app.post("/shortlist/add", isAuth, addToShortlist);
  app.get("/shortlist/get/:userId", isAuth, getShortlistedUser);
  //get other users cards
  app.get("/getUserPre/:userId", isAuth, getMatchesAccordingToPreference);
  app.get("/newlyJoined/:userId", isAuth, getNewlyJoinedProfiles);
  //search users
  app.post("/search-user/:userId", isAuth, searchController.searchById);
  app.post("/search-users/:userId", isAuth, searchController.advanceSearch);
  //report users
  app.post("/report-users", isAuth, reportUser);
};
