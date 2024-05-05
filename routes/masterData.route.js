const { fileMulter } = require("../multer/multerFile");

const masterController = require("../controllers/masterDataController");
const getMasterController = require("../controllers/masterDataGetter");
const countriesController = require("../controllers/countriesController");
const { isAdmin } = require("../middleware/is_auth");

const router = (app) => {
  // app.post("/masterDataUploader",isAdmin, fileMulter, masterController.uploadcsv);
  app.post("/masterDataUploader", fileMulter, masterController.uploadcsv);
  app.get("/getMasterData/:type", getMasterController.getMasterData);
  app.get("/countries", countriesController.getCountries);
  app.get("/country-state-city", countriesController.getDataById);
  app.get("/states", countriesController.getStatesByCountry);
  app.get("/cities", countriesController.getCitiesByState);
  app.get("/country", countriesController.getCountriesById);
  app.get("/state", countriesController.getStatesById);
  app.get("/city", countriesController.getCitiesById);
};

module.exports = router;
