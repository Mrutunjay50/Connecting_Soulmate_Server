const registerController = require("../controllers/register.js");
const { imageMulter } = require("../multer/multerImg.js");

const router = (app) => {
  app.post("/user-data/:page", imageMulter, registerController.registerUser);
};

module.exports = router;
