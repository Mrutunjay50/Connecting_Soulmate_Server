const mongoose = require("mongoose");

const shortlistedSchema = mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  shortlistedUser: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  isBlocked : {
    type: String,
    enum: [true, false],
    default : false
  },
  isInterestRequest : {
    type: String,
    enum: [true, false],
    default : false
  },
  isProfileRequest : {
    type: String,
    enum: [true, false],
    default : false
  },
});

const ShortList = mongoose.model("Shortlist", shortlistedSchema);

module.exports = ShortList;