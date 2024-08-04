const {
  updateRegistrationPhase,
  getUserByIdForAdmin,
  getAllPendingUsersForAdmin,
  getAllUsers,
  updateUserCategory,
  getUserStatisticsForAdmin,
  softDeleteUser,
  downloadAllUsersAsCSV,
  downloadUserAsCSV,
  getUserImageInBase64ByIdForAdmin,
  banUser,
  discardUser,
} = require("../controllers/admin");
// getUserPDFForAdmin,
// reviewRequest,
const { getAdminNotificationsForUser, getAllUsersNotificationsForAdmin } = require("../controllers/notificationController");
const { isAdmin } = require("../middleware/is_auth");
const { updateAllUsersAnnualIncomeUSD } = require("../controllers/testing");
const { getReportedIssues } = require("../controllers/reportController");
// const { generatePDF } = require("../helper/generatePDF");

module.exports = (app) => {
  //other routes
  app.put("/approve-or-decline/:userId", isAdmin, updateRegistrationPhase);
  app.put("/update-user-category/:userId", isAdmin, updateUserCategory);
  // app.put("/review-user-data/:userId", isAdmin, reviewRequest);
  app.put("/admin-notifications", isAdmin, getAdminNotificationsForUser);
  app.put("/delete-user/:userId", isAdmin, softDeleteUser);
  app.post("/ban-user", isAdmin, banUser);
  app.post("/discard-user", isAdmin, discardUser);
  app.get("/admin-notification-data", isAdmin, getAdminNotificationsForUser);
  app.get("/admin-user-notification-data", isAdmin, getAllUsersNotificationsForAdmin);
  app.get("/get-user-view-data-admin/:userId", isAdmin, getUserByIdForAdmin);
  // app.get("/download-single-user-data/pdf/:userId", generatePDF);
  app.get("/userLogo-base64/pdf/:userId", getUserImageInBase64ByIdForAdmin);
  app.get("/downloadUsers", downloadAllUsersAsCSV);
  app.get("/downloadUser/:userId", downloadUserAsCSV);
  app.get("/get-user-statistics", isAdmin, getUserStatisticsForAdmin);
  app.get("/get-user-data-admin", isAdmin, getAllPendingUsersForAdmin);
  app.get("/get-all-user-data-admin", isAdmin, getAllUsers);
  app.get("/get-all-reports", isAdmin, getReportedIssues);
  app.put("/admin-update-income",updateAllUsersAnnualIncomeUSD );
};
