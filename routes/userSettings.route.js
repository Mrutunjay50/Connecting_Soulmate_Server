const {
  generateLinkForChangingRegisteredNumber,
  changeRegisteredNumber,
  subscribeEveryFifteenDays,
  deleteProfile,
  updateContactInfo,
  reApprovalRequest,
  notificationStatusUserType,
  notificationStatusAdminType,
  getUserImagesInBase64
} = require("../controllers/userSettingsController");
const { isAuth } = require("../middleware/is_auth");

module.exports = (app) => {
  app.post("/generate-link-for-number", isAuth, generateLinkForChangingRegisteredNumber);
  app.put("/change-registered-number", isAuth, changeRegisteredNumber);
  app.put("/change-email-subscription", isAuth, subscribeEveryFifteenDays);
  app.put("/notification-status", isAuth, notificationStatusUserType);
  app.put("/notification-status-admin", isAuth, notificationStatusAdminType);
  app.put("/delete-user", isAuth, deleteProfile);
  app.put("/user-reapproval-request", isAuth, reApprovalRequest);
  app.put("/update-contact-info", isAuth, updateContactInfo);
  app.post("/change-image-to-base-url", getUserImagesInBase64);
};
