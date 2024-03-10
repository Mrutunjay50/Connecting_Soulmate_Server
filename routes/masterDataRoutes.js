const Express = require("express");
const router = Express.Router();

const {fileMulter} = require('../multer/multerFile');

const masterController = require('../controllers/masterDataController')


router.post('/masterDataUploader', fileMulter,masterController.masterDataCSV);
// router.post('/userDataUploader', fileMulter,masterController.masterDataCSV);


module.exports = router;