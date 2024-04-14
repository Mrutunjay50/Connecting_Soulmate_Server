const registerController = require("../controllers/register.js");
const searchController = require("../controllers/search.js");
const { imageMulter } = require("../multer/multerImg.js");

module.exports = (app) => {
  app.post("/user-data/:userId", imageMulter, registerController.registerUser);
  app.get("/user-data/:userId", registerController.getPageData);
  app.get("/search-user/:gender", searchController.advanceSearch);
};
