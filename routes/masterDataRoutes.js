const Express = require("express");
const router = Express.Router();

const {fileMulter} = require('../multer/multerFile');

const masterController = require('../controllers/masterDataController')
// const addCountry = require("../controller/Country");
// const addCity = require("../controller/city");
// const addCommunity = require("../controller/community");
// const addDiet = require("../controller/diet");
// const addEducation = require("../controller/education");
// const addFitness = require("../controller/fitness");
// const addFunActivity = require("../controller/funact");
// const addInterest = require("../controller/intrest");
// const addOther = require("../controller/other");
// const addProffesion = require("../controller/proffesion");
// const addRegilous = require("../controller/religious");
// const addState = require("../controller/state");

// router.post("/country", addCountry);
// router.post("/city", addCity);
// router.post("/community", addCommunity);
// router.post("/diet", addDiet);
// router.post("/education", addEducation);
// router.post("/fitness", addFitness);
// router.post("/funact", addFunActivity);
// router.post("/intrest", addInterest);
// router.post("/other", addOther);
// router.post("/proffesion", addProffesion);
// router.post("/religious", addRegilous);
// router.post("/state", addState);


router.post('/csv', fileMulter,masterController.uploadcsv);


module.exports = router;