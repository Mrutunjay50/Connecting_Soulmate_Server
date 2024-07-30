const { getChatUsers, getPaginatedMessages } = require("../controllers/getChatListing");

  
  module.exports = (app) => {
    app.get("/get-chat-listing/:userId", getChatUsers);
    app.get("/get-all-messages", getPaginatedMessages);
  };
  