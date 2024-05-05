const exchangeRateController = require('../controllers/exchangeRateController');
const { isAdmin } = require('../middleware/is_auth');

module.exports = (app) => {
  app.post("/set-exchangeRate-data",  exchangeRateController.createExchangeRate);
  app.put("/update-exchangeRate-data/:currency",  exchangeRateController.updateExchangeRateByCurrency);
  app.get("/get-exchangeRate-data",  exchangeRateController.getAllExchangeRates);
};