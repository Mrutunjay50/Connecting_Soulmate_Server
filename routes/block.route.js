const { blockUser, unblockUser, getBlockedUsers } = require("../controllers/blockController");
const { isAuth } = require("../middleware/is_auth");

  
  module.exports = (app) => {
    app.post("/block-user", isAuth, blockUser);
    app.put("/unblock-user", isAuth, unblockUser);
    app.get("/get-blocked-users/:userId", isAuth, getBlockedUsers);
  };
  