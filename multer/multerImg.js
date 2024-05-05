const multer = require("multer");
const { v4: uuidv4 } = require("uuid");

const fileFilter = (req, file, cb) => {
  if (
    file.mimetype === "image/png" ||
    file.mimetype === "image/jpg" ||
    file.mimetype === "image/jpeg"
  ) {
    cb(null, true);
  } else {
    cb(null, false);
  }
};

const Storage = multer.memoryStorage();
const imageMulter = multer({ storage: Storage, fileFilter: fileFilter }).array("userPhotos", 5);// Change to 'array' for multiple files
const profilePictureMulter = multer({ storage: Storage, fileFilter: fileFilter }).single("profilePicture");

module.exports = { imageMulter, profilePictureMulter };