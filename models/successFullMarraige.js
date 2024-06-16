const mongoose = require('mongoose');

const SuccessfulMarriageSchema = new mongoose.Schema({
  count: {
    type: Number,
    required: false,
    default: 0,
  },
});

const SuccessfulMarriage = mongoose.model('SuccessfulMarriage', SuccessfulMarriageSchema);

module.exports = SuccessfulMarriage;