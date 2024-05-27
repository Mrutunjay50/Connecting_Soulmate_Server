const multer = require("multer");

// File size limit in bytes (5MB)
const FILE_SIZE_LIMIT = 5 * 1024 * 1024; // 5MB in bytes

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

const imageMulter = multer({
  storage: Storage,
  fileFilter: fileFilter,
  limits: { fileSize: FILE_SIZE_LIMIT }
}).array("userPhotos", 5);

// Middleware to handle errors
const handleMulterError = (err, req, res, next) => {
  if (err) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'File size is bigger than expected. Maximum allowed size is 5MB.' });
    }
    return res.status(400).json({ message: err.message });
  }
  next();
}; 

const logImageSizes = (req, res, next) => {
  if (req.files) {
    req.files.forEach((file, index) => {
      console.log(`File ${index + 1} size: ${file.size} bytes`);
    });
  }
  next();
};

module.exports = { imageMulter, handleMulterError, logImageSizes };