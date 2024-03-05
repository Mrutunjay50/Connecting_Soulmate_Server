const express = require('express');
const router = express.Router();
const registerController = require('../controllers/register');
const { imageMulter } = require('../multer/multerImg'); 


router.post('/user-data/:page', registerController.registerUser);

module.exports = router;