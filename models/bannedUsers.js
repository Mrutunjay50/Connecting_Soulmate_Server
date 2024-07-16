const mongoose = require('mongoose');

const bannedUsersSchema = new mongoose.Schema({
    contactNumbers: {
        type: [String],
        required: true
    }
});

const BannedUsers = mongoose.model('bannednumbers', bannedUsersSchema);

module.exports = BannedUsers;