const mongoose = require("mongoose");

const notificationSchema = mongoose.Schema({
    notificationTo: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    notificationText: { type: String },
});

const Notifications = mongoose.model("notifications", notificationSchema);

module.exports = Notifications