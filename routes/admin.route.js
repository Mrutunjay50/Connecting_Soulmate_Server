const { updateRegistrationPhase } = require('../controllers/admin');
const { isAdmin } = require('../middleware/is_auth');

module.exports = (app) => {
  app.put("/approve-or-decline/:userId", isAdmin, updateRegistrationPhase);
  // app.get("/get-user-data-admin/:userId", isAdmin, updateRegistrationPhase);
};