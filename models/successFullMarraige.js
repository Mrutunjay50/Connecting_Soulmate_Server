const mongoose = require('mongoose');

const SuccessfulMarriageSchema = new mongoose.Schema({
  userIds: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: 'users',
    required: false,
    default: [],
  },
});

const SuccessfulMarriage = mongoose.model('SuccessfulMarriage', SuccessfulMarriageSchema);

module.exports = SuccessfulMarriage;