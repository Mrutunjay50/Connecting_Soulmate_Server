const { State, Country, City } = require("../models/masterSchemas");

// Fetch countries
exports.getCountries = async (req, res) => {
    try {
      const countries = await Country.find();
      res.status(200).json(countries);
    } catch (error) {
      console.error('Error fetching countries:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
};

// Fetch states by country
exports.getStatesByCountry = async (req, res) => {
    const { country } = req.query;
    console.log(country);
    try {
      const states = await State.find({ country_id: country });
      res.status(200).json(states);
    } catch (error) {
      console.error('Error fetching states:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
};

// Fetch cities by country and state
exports.getCitiesByState = async (req, res) => {
    const { country, state } = req.query;
    console.log(country, state );
    try {
      const cities = await City.find({ country_id: country, state_id: state });
      res.status(200).json(cities);
    } catch (error) {
      console.error('Error fetching cities:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
};
