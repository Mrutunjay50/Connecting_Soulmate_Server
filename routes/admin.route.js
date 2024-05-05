const { updateRegistrationPhase } = require('../controllers/admin');

module.exports = (app) => {
  app.put("/approve-or-decline/:userId", updateRegistrationPhase);
};