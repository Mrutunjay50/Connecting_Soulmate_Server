const {
  generateLinkForChangingRegisteredNumber,
  changeRegisteredNumber,
  subscribeEveryFifteenDays,
  deleteProfile,
  updateContactInfo,
  reApprovalRequest,
} = require("../controllers/userSettingsController");

module.exports = (app) => {
  app.post("/generate-link-for-number", generateLinkForChangingRegisteredNumber);
  app.put("/change-registered-number", changeRegisteredNumber);
  app.put("/change-email-subscription", subscribeEveryFifteenDays);
  app.put("/delete-user", deleteProfile);
  app.put("/user-reapproval-request", reApprovalRequest);
  app.put("/update-contact-info", updateContactInfo);
};
