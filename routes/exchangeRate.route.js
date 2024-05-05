const exchangeRateController = require('../controllers/exchangeRateController');
const { isAdmin } = require('../middleware/is_auth');

module.exports = (app) => {
  app.post("/set-exchangeRate-data", isAdmin, exchangeRateController.createExchangeRate);
};