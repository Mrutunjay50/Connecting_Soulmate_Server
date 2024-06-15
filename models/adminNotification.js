const mongoose = require("mongoose");

const notificationSchema = mongoose.Schema({
    notificationBy : { type: mongoose.Schema.Types.ObjectId, ref: "User", required :true },
    notificationTo: { type: String, default : "Admin" },
    notificationText: { type: String , default : ""},
    notificationType : {type: String , default : "sent", enum :["", "profilesent", "profileaccepted", "interestsent", "interestaccepted"]},
    notificationView : {type: String , default : "unseen", enum :["seen", "unseen"]}
}, { timestamps: true });

const AdminNotifications = mongoose.model("adminnotifications", notificationSchema);

module.exports = AdminNotifications