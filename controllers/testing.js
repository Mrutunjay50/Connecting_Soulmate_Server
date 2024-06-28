const User = require("../models/Users");
const ExchangeRate = require("../models/exchangeRate");

exports.updateAllUsersAnnualIncomeUSD = async () => {
    try {
      // Fetch all users
      const users = await User.find();
  
      for (const user of users) {
        if (!user.careerDetails || user.careerDetails.length === 0) {
            console.error(`Career details not found for user ${user._id}`);
            continue;
          }
        // Get currency type from the user's career details
        const currencyType = user.careerDetails[0].currencyType || "INR";
  
        // Fetch the exchange rate for the user's currency type
        const exchangeRate = await ExchangeRate.findOne({ currency: currencyType });
  
        if (!exchangeRate) {
          console.error(`Exchange rate not found for currency type: ${currencyType}`);
          continue; // Skip to the next user
        }
  
        // Calculate the annual income in USD
        const annualIncomeValue = parseFloat(user.careerDetails[0].annualIncomeValue) || 0;
        const annualIncomeUSD = parseInt(annualIncomeValue) * parseInt(exchangeRate.rateToUSD);
  
        // Update the user's annualIncomeUSD field
        user.careerDetails[0].annualIncomeUSD = annualIncomeUSD.toString();
  
        // Save the updated user
        await user.save();
  
        console.log(`User ${user._id} annual income in USD updated successfully.`);
      }
    } catch (error) {
      console.error('Error updating annual income in USD for all users:', error);
    }
  };