const exchangeRateController = require('../controllers/exchangeRateController');

module.exports = (app) => {
  app.post("/set-exchangeRate-data", exchangeRateController.createExchangeRate);
};