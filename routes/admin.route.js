const { updateRegistrationPhase, getUserByIdForAdmin, getUserPDFForAdmin } = require('../controllers/admin');
const { getAllPendingUsers } = require('../controllers/auth');
const { isAdmin } = require('../middleware/is_auth');

module.exports = (app) => {
  app.put("/approve-or-decline/:userId", isAdmin, updateRegistrationPhase);
  app.get("/get-user-view-data/:userId", isAdmin, getUserByIdForAdmin);
  app.get("/download-single-user-data/pdf/:userId", getUserPDFForAdmin);
  app.get("/get-user-data-admin", isAdmin, getAllPendingUsers);
};