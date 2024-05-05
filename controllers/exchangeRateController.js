const User = require('../models/Users');
const ExchangeRate = require('../models/exchangeRate');

// Controller to create a new exchange rate
exports.createExchangeRate = async (req, res) => {
  try {
    const { currency, rateToUSD } = req.body;

    // Check if the currency already exists
    const existingRate = await ExchangeRate.findOne({ currency });
    if (existingRate) {
      return res.status(400).json({ error: 'Currency already exists' });
    }

    // Create a new exchange rate document
    const exchangeRate = new ExchangeRate({ currency, rateToUSD });
    await exchangeRate.save();

    return res.status(201).json(exchangeRate);
  } catch (error) {
    console.error('Error creating exchange rate:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

// Controller to get all exchange rates
exports.getAllExchangeRates = async (req, res) => {
  try {
    const exchangeRates = await ExchangeRate.find();
    return res.status(200).json(exchangeRates);
  } catch (error) {
    console.error('Error getting exchange rates:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

// Controller to get exchange rate by currency
exports.getExchangeRateByCurrency = async (req, res) => {
  try {
    const { currency } = req.params;
    const exchangeRate = await ExchangeRate.findOne({ currency });

    if (!exchangeRate) {
      return res.status(404).json({ error: 'Exchange rate not found' });
    }

    return res.status(200).json(exchangeRate);
  } catch (error) {
    console.error('Error getting exchange rate by currency:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

// Controller to update exchange rate by currency
exports.updateExchangeRateByCurrency = async (req, res) => {
  try {
    const { currency } = req.params;
    const { rateToUSD } = req.body;

    const exchangeRate = await ExchangeRate.findOneAndUpdate(
      { currency },
      { rateToUSD },
      { new: true }
    );
    
    if (!exchangeRate) {
      return res.status(404).json({ error: 'Exchange rate not found' });
    }
    const updateResult = await User.updateMany(
      { "annualIncomeType": currency },
      { 
        $set: { 
          "annualIncomeUsd": { 
            $multiply: ["$annualIncomeValue", rateToUSD] 
          } 
        } 
      }
    );
    console.log(updateResult);
    if (updateResult.nModified === 0) {
      return res.status(404).json({ error: 'No users found with matching annualCurrency' });
    }

    return res.status(200).json(exchangeRate);
  } catch (error) {
    console.error('Error updating exchange rate by currency:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

// Controller to delete exchange rate by currency
exports.deleteExchangeRateByCurrency = async (req, res) => {
  try {
    const { currency } = req.params;
    const exchangeRate = await ExchangeRate.findOneAndDelete({ currency });

    if (!exchangeRate) {
      return res.status(404).json({ error: 'Exchange rate not found' });
    }

    return res.status(204).send();
  } catch (error) {
    console.error('Error deleting exchange rate by currency:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};
