const mongoose = require("mongoose");

const notificationSchema = mongoose.Schema({
    notificationBy : { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    notificationTo: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    notificationText: { type: String , default : ""},
    notificationType : {type: String , default : "sent", enum :["", "profilesent", "profileaccepted", "interestsent", "interestaccepted"]},
    notificationView : {type: String , default : "unseen", enum :["seen", "unseen"]}
});

const Notifications = mongoose.model("notifications", notificationSchema);

module.exports = Notifications