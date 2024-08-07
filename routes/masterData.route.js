const { fileMulter } = require("../multer/multerFile");

const masterController = require("../controllers/masterDataController");
const getMasterController = require("../controllers/masterDataGetter");
const countriesController = require("../controllers/countriesController");
const { isAdmin } = require("../middleware/is_auth");

const router = (app) => {
  // app.post("/masterDataUploader/:type", fileMulter, masterController.masterDataCSV);
  // app.post("/masterDataUploader", fileMulter, masterController.uploadcsv);
  app.get("/getMasterData/:type", getMasterController.getMasterData);
  app.get("/clean-images", masterController.cleanUserPhotos);
  app.get("/getMasterData/:type/:id", getMasterController.getMasterDataById);
  app.get("/countries", countriesController.getCountries);
  app.get("/country-state-city", countriesController.getDataById);
  app.get("/states", countriesController.getStatesByCountry);
  app.get("/cities", countriesController.getCitiesByState);
  app.get("/multiple-states", countriesController.getMultipleStatesById);
  app.get("/muliple-cities", countriesController.getMultipleCitiesById);
  app.get("/multiple-states-by-multiple-countries", countriesController.getStatesByMultipleCountry);
  app.get("/muliple-cities-by-multiple-states", countriesController.getCitiesByMultipleState);
  app.get("/country", countriesController.getCountriesById);
  app.get("/state", countriesController.getStatesById);
  app.get("/city", countriesController.getCitiesById);
};

module.exports = router;
