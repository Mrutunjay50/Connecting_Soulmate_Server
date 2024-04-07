const mongoose = require("mongoose");

const shortlistedSchema = mongoose.Schema({
  user: { type: String },
  shortlistedUser: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
});

const ShortList = mongoose.model("Shortlist", shortlistedSchema);

module.exports = ShortList;
