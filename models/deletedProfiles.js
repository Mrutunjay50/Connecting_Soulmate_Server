const mongoose = require("mongoose");

const deletedProfileSchema = mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  reason: { type: String, enum: ["yes", "no", "married", "other"] },
});

const DeletedProfile = mongoose.model("DeletedProfile", deletedProfileSchema);

module.exports = DeletedProfile;