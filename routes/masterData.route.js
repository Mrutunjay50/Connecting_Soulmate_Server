const {fileMulter} = require('../multer/multerFile');

const masterController = require('../controllers/masterDataController')


const router = (app) => {
    app.post('/masterDataUploader', fileMulter,masterController.uploadcsv);
}

module.exports = router;