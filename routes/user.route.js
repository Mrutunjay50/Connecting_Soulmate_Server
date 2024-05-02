const registerController = require("../controllers/register.js");
const searchController = require("../controllers/search.js");
const { imageMulter } = require("../multer/multerImg.js");

module.exports = (app) => {
  app.post("/user-data/:userId", imageMulter, registerController.registerUser);
  app.post("/add-profession", registerController.createProfession);
  app.post("/text-detail-change/:userId", registerController.changeUserDetailsText);
  app.get("/user-data/:userId", registerController.getPageData);
  app.get("/search-user/:userId", searchController.searchById);
  app.get("/search-users/:gender", searchController.advanceSearch);
};
