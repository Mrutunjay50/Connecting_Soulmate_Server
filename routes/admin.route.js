const {
  updateRegistrationPhase,
  getUserByIdForAdmin,
  getUserPDFForAdmin,
  getAllPendingUsersForAdmin,
  getAllUsers,
  updateUserCategory,
  getUserStatisticsForAdmin,
  softDeleteUser,
} = require("../controllers/admin");
const { isAdmin } = require("../middleware/is_auth");

module.exports = (app) => {
  app.put("/approve-or-decline/:userId", isAdmin, updateRegistrationPhase);
  app.put("/update-user-category/:userId", isAdmin, updateUserCategory);
  app.put("/delete-user/:userId", isAdmin, softDeleteUser);
  app.get("/get-user-view-data/:userId", isAdmin, getUserByIdForAdmin);
  app.get("/download-single-user-data/pdf/:userId", getUserPDFForAdmin);
  app.get("/get-user-statistics", isAdmin, getUserStatisticsForAdmin);
  app.get("/get-user-data-admin", isAdmin, getAllPendingUsersForAdmin);
  app.get("/get-all-user-data-admin", isAdmin, getAllUsers);
};
