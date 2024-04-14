const mongoose = require("mongoose");

const shortlistedSchema = mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  shortlistedUser: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
});

const ShortList = mongoose.model("Shortlist", shortlistedSchema);

module.exports = ShortList;