const mongoose = require("mongoose");

const notificationSchema = mongoose.Schema({
    notificationTo: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    notificationText: { type: String },
});

const ProfileRequests = mongoose.model("notifications", notificationSchema);