const { getChatUsers } = require("../controllers/getChatListing");

  
  module.exports = (app) => {
    app.get("/get-chat-listing/:userId", getChatUsers);
  };
  