const mongoose = require("mongoose");

const profileRequestSchema = mongoose.Schema({
  profileRequestBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  profileRequestTo: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  action: { type: String, enum:["pending","accepted","declined", "cancelled"] },
  isShortListedTo: { type: String, enum:["no", "yes", true, false], default : false },
  isShortListedBy: { type: String, enum:["no", "yes", true, false], default : false },
  isBlocked : {
    type: String,
    enum: [true, false],
    default : false
  },
  isInterestRequestTo : {
    type: String,
    enum: [true, false],
    default : false
  },
  isInterestRequestBy : {
    type: String,
    enum: [true, false],
    default : false
  },
});


const interestRequestSchema = mongoose.Schema({
  interestRequestBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  interestRequestTo: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  action: { type: String, enum:["pending","accepted","declined", "cancelled"] },
  isShortListedTo: { type: String, enum:["no", "yes", true, false], default : false },
  isShortListedBy: { type: String, enum:["no", "yes", true, false], default : false },
  isBlocked : {
    type: String,
    enum: [true, false],
    default : false
  },
  isProfileRequestTo : {
    type: String,
    enum: [true, false],
    default : false
  },
  isProfileRequestBy : {
    type: String,
    enum: [true, false],
    default : false
  },
});

const ProfileRequests = mongoose.model("profilerequests", profileRequestSchema);
const InterestRequests = mongoose.model("interestrequests", interestRequestSchema);

module.exports = {ProfileRequests, InterestRequests};