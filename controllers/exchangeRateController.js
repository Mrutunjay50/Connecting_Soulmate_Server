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

    // Validate rateToUSD is a number
    if (typeof rateToUSD !== 'number') {
      return res.status(400).json({ error: 'rateToUSD must be a number' });
    }

    // Find and update the exchange rate
    const exchangeRate = await ExchangeRate.findOneAndUpdate(
      { currency },
      { rateToUSD },
      { new: true }
    );

    if (!exchangeRate) {
      return res.status(404).json({ error: 'Exchange rate not found' });
    }

    // Update user's annual income in USD
    const updateResult = await User.updateMany(
      { "careerDetails.currencyType": currency },
      [
        {
          $set: {
            "careerDetails": {
              $map: {
                input: "$careerDetails",
                as: "careerDetail",
                in: {
                  $mergeObjects: [
                    "$$careerDetail",
                    {
                      annualIncomeUSD: {
                        $multiply: [
                          { $toDouble: { $ifNull: ["$$careerDetail.annualIncomeValue", 0] } },
                          rateToUSD
                        ]
                      }
                    }
                  ]
                }
              }
            }
          }
        }
      ]
    );

    console.log(updateResult);

    if (updateResult.modifiedCount === 0) {
      return res.status(200).json({ message: 'No users found with matching currency type' });
    }

    return res.status(200).json(exchangeRate);
  } catch (error) {
    console.log(error);
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
