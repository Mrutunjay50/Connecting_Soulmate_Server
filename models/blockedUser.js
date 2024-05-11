const mongoose = require("mongoose");
const BlockedSchema = mongoose.Schema({
  blockedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  blockedUser: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
});

const BlockedUser = mongoose.model("BlockedUser", BlockedSchema);

module.exports = BlockedUser;