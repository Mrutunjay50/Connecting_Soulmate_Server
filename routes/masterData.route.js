const {fileMulter} = require('../multer/multerFile');

const masterController = require('../controllers/masterDataController')


const router = (app) => {
    app.post('/masterDataUploader', fileMulter,masterController.masterDataCSV);
}

module.exports = router;