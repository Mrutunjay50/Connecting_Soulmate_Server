const {
  updateRegistrationPhase,
  getUserByIdForAdmin,
  // getUserPDFForAdmin,
  getAllPendingUsersForAdmin,
  getAllUsers,
  updateUserCategory,
  getUserStatisticsForAdmin,
  softDeleteUser,
  downloadAllUsersAsCSV,
  downloadUserAsCSV,
  reviewRequest,
  getUserImageInBase64ByIdForAdmin,
} = require("../controllers/admin");
const { getAdminNotificationsForUser } = require("../controllers/notificationController");
const { isAdmin } = require("../middleware/is_auth");
const { updateAllUsersAnnualIncomeUSD } = require("../controllers/testing");
// const { generatePDF } = require("../helper/generatePDF");

module.exports = (app) => {
  app.put("/approve-or-decline/:userId", isAdmin, updateRegistrationPhase);
  app.put("/update-user-category/:userId", isAdmin, updateUserCategory);
  // app.put("/review-user-data/:userId", isAdmin, reviewRequest);
  app.put("/admin-notifications", isAdmin, getAdminNotificationsForUser);
  app.put("/delete-user/:userId", isAdmin, softDeleteUser);
  app.get("/get-user-view-data-admin/:userId", isAdmin, getUserByIdForAdmin);
  // app.get("/download-single-user-data/pdf/:userId", generatePDF);
  app.get("/userLogo-base64/pdf/:userId", getUserImageInBase64ByIdForAdmin);
  app.get("/downloadUsers", downloadAllUsersAsCSV);
  app.get("/downloadUser/:userId", downloadUserAsCSV);
  app.get("/get-user-statistics", isAdmin, getUserStatisticsForAdmin);
  app.get("/get-user-data-admin", isAdmin, getAllPendingUsersForAdmin);
  app.get("/get-all-user-data-admin", isAdmin, getAllUsers);
  app.put("/admin-update-income",updateAllUsersAnnualIncomeUSD );
};
