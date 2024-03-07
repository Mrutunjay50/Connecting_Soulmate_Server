const express = require('express');
const router = express.Router();
const registerController = require('../controllers/register.js');
const { imageMulter } = require('../multer/multerImg'); 


router.post('/user-data/:page',imageMulter, registerController.registerUser);

module.exports = router;