const { getUserDashboard } = require("../controllers/dashboardController.js");
const { getUserById } = require("../controllers/matchingProfile.js");
const {
  registerUser,
  createProfession,
  changeUserDetailsText,
  deleteImagesInUser,
  addImagesInUser,
  getPageData,
} = require("../controllers/register.js");
const searchController = require("../controllers/search.js");
const { imageMulter } = require("../multer/multerImg.js");

module.exports = (app) => {
  app.post("/user-data/:userId", imageMulter, registerUser);
  app.post("/add-profession", createProfession);
  app.post("/text-detail-change/:userId", changeUserDetailsText);
  app.put("/user-image-delete/:userId", deleteImagesInUser);
  app.put("/user-image-upload/:userId", imageMulter, addImagesInUser);
  app.get("/user-data/:userId", getPageData);
  app.get("/get-user-data/:userId", getUserById);
  app.get("/search-user/:userId", searchController.searchById);
  app.get("/user-dashboard-data/:userId", getUserDashboard);
  app.post("/search-users/:gender", searchController.advanceSearch);
};
