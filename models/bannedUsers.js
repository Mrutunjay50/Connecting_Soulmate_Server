const mongoose = require('mongoose');

const bannedUsersSchema = new mongoose.Schema({
    name : {
        type : String,
        default : ""
    },
    contact : {
        type : String,
        default : ""
    },
    userId : {
        type : String,
        default : ""
    },
    bannedReason : {
        type : String,
        default : ""
    },
    gender : {
        type : String,
        default : ""
    }
}, { timestamps: true });

const BannedUsers = mongoose.model('bannednumbers', bannedUsersSchema);

module.exports = BannedUsers;