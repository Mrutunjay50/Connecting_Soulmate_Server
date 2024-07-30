const { getUserDashboard } = require("../controllers/dashboardController.js");
const { getUserById } = require("../controllers/matchingProfile.js");
const { getNotificationsForUser } = require("../controllers/notificationController.js");
const {
  registerUser,
  createProfession,
  changeUserDetailsText,
  deleteImagesInUser,
  addImagesInUser,
  getPageData,
  updateUserPhotos,
} = require("../controllers/register.js");
const { reportUser } = require("../controllers/reportController.js");
const searchController = require("../controllers/search.js");
const { imageMulter, handleMulterError, logImageSizes } = require("../multer/multerImg.js");

module.exports = (app) => {
  app.post("/user-data/:userId", logImageSizes, imageMulter, handleMulterError, registerUser);
  app.post("/user-data-images/:userId", logImageSizes, imageMulter, handleMulterError, addImagesInUser);
  app.post("/add-profession", createProfession);
  app.post("/text-detail-change/:userId", changeUserDetailsText);
  app.put("/user-image-delete/:userId", deleteImagesInUser);
  app.put("/user-image-upload/:userId",logImageSizes, imageMulter, handleMulterError, updateUserPhotos);
  app.get("/user-data/:userId", getPageData);
  app.get("/get-user-data/:userId", getUserById);
  app.get("/user-dashboard-data/:userId", getUserDashboard);
  app.get("/user-notification-data/:userId", getNotificationsForUser);
  app.post("/search-user/:userId", searchController.searchById);
  app.post("/search-users/:userId", searchController.advanceSearch);
  app.post("/report-users", reportUser);
};
