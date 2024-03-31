const mongoose = require("mongoose");

const MatchesSchema = mongoose.Schema({
  matchedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  matchedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
});

const Matches = mongoose.model("Matches", MatchesSchema);
module.exports = Matches;
