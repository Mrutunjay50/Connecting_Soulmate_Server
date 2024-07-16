const mongoose = require("mongoose");
const BlockedSchema = mongoose.Schema({
  blockedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required :true  },
  blockedUser: { type: mongoose.Schema.Types.ObjectId, ref: "User", required :true  },
}, { timestamps: true });

const BlockedUser = mongoose.model("BlockedUser", BlockedSchema);

module.exports = BlockedUser;