const mongoose = require("mongoose");

const notificationSchema = mongoose.Schema({
    notificationTo: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    notificationText: { type: String , default : ""},
    notificationType : {type: String , default : "sent", enum :["", "sent", "accepted", "declined"]}
});

const Notifications = mongoose.model("notifications", notificationSchema);

module.exports = Notifications