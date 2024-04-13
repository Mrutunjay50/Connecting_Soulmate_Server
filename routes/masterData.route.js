const { fileMulter } = require("../multer/multerFile");

const masterController = require("../controllers/masterDataController");
const getMasterController = require("../controllers/masterDataGetter");
const countriesController = require("../controllers/countriesController");

const router = (app) => {
  // app.post("/masterDataUploader", fileMulter, masterController.uploadcsv);
  app.get("/getMasterData/:type", getMasterController.getMasterData);
  app.get("/countries", countriesController.getCountries);
  app.get("/states", countriesController.getStatesByCountry);
  app.get("/cities", countriesController.getCitiesByState);
};

module.exports = router;
