const mongoose = require("mongoose");

const notificationSchema = mongoose.Schema({
    notificationBy : { type: mongoose.Schema.Types.ObjectId, ref: "User", required :true },
    notificationTo: { type: mongoose.Schema.Types.ObjectId, ref: "User", required :true },
    notificationText: { type: String , default : ""},
    notificationType : {type: String , default : "sent", enum :["", "profilesent", "profileaccepted", "interestsent", "interestaccepted", "chatinitiated", "blockedusers", "reported"]},
    notificationView : {type: String , default : "unseen", enum :["seen", "unseen"]}
}, { timestamps: true });

const Notifications = mongoose.model("notifications", notificationSchema);

module.exports = Notifications