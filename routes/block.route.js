const { blockUser, unblockUser, getBlockedUsers } = require("../controllers/blockController");

  
  module.exports = (app) => {
    app.post("/block-user", blockUser);
    app.get("/unblock-user", unblockUser);
    app.get("/get-blocked-users/:userId", getBlockedUsers);
  };
  