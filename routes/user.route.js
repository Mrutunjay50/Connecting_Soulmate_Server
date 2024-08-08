const { getUserDashboard } = require("../controllers/dashboardController.js");
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
const { isAuth } = require("../middleware/is_auth.js");
const { imageMulter, handleMulterError, logImageSizes } = require("../multer/multerImg.js");

module.exports = (app) => {
  app.post("/user-data/:userId", isAuth, logImageSizes, imageMulter, handleMulterError, registerUser);
  app.post("/user-data-images/:userId", isAuth, logImageSizes, imageMulter, handleMulterError, addImagesInUser);
  app.post("/add-profession", isAuth, createProfession);
  app.post("/text-detail-change/:userId", isAuth, changeUserDetailsText);
  app.put("/user-image-delete/:userId", isAuth, deleteImagesInUser);
  app.put("/user-image-upload/:userId", isAuth, logImageSizes, imageMulter, handleMulterError, updateUserPhotos);
  app.get("/user-data/:userId", isAuth, getPageData);
  app.get("/user-dashboard-data/:userId", isAuth, getUserDashboard);
  app.get("/user-notification-data/:userId", isAuth, getNotificationsForUser);
};
