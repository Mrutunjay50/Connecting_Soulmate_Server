const mongoose = require("mongoose");

const profileRequestSchema = mongoose.Schema({
  profileRequestBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  profileRequestTo: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  action: { type: String, enum:["pending","accepted","declined", "cancelled", "blocked"] },
  isShortListedTo: { type: String, enum:["no", "yes"], default : "no" },
  isShortListedBy: { type: String, enum:["no", "yes"], default : "no" },
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
});


const interestRequestSchema = mongoose.Schema({
  interestRequestBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  interestRequestTo: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  action: { type: String, enum:["pending","accepted","declined", "cancelled", "blocked"] },
  isShortListedTo: { type: String, enum:["no", "yes"], default : "no" },
  isShortListedBy: { type: String, enum:["no", "yes"], default : "no" },
  isBlocked : {
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

const ProfileRequests = mongoose.model("profilerequests", profileRequestSchema);
const InterestRequests = mongoose.model("interestrequests", interestRequestSchema);

module.exports = {ProfileRequests, InterestRequests};