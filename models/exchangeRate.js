const mongoose = require('mongoose');

// Define the schema
const exchangeRateSchema = new mongoose.Schema({
  currency: {
    type: String,
    required: true,
    unique: true,
  },
  rateToUSD: {
    type: Number,
    required: true,
  },
});

// Create the model
const ExchangeRate = mongoose.model('exchangerate', exchangeRateSchema);

module.exports = ExchangeRate;