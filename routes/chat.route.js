const { getChatUsers, getPaginatedMessages } = require("../controllers/getChatListing");
const { isAuth } = require("../middleware/is_auth");

  
  module.exports = (app) => {
    app.get("/get-chat-listing/:userId", getChatUsers);
    app.get("/get-all-messages", isAuth, getPaginatedMessages);
  };
  