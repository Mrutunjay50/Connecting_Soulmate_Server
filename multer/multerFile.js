const multer = require("multer");

const fileStorage1 = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, "csv/");
    },
    filename: (req, file, cb) => {
      cb(null, file.originalname);
    },
  });
  

//for storing file

const fileMulter =  multer({ storage: fileStorage1 }).single("file");

module.exports = { fileMulter };