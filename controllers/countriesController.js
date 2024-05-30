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
    const { state } = req.query;
    try {
      const cities = await City.find({ state_id: state });
      res.status(200).json(cities);
    } catch (error) {
      console.error('Error fetching cities:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
};

const fetchDataById = async (Model, type, id) => {
  try {
    const query = {};
    query[type] = id;
    const data = await Model.find(query);
    return data;
  } catch (error) {
    throw new Error(`Error fetching data from ${Model.modelName}: ${error.message}`);
  }
};


// Controller function to fetch countries, states, or cities based on type
exports.getDataById = async (req, res) => {
  const { type, id } = req.query; // type can be 'country', 'state', or 'city'
  
  try {
      let data;
      switch (type) {
          case 'country':
              data = await fetchDataById(Country,  "country_id" , id);
              break;
          case 'state':
              data = await fetchDataById(State, "state_id" , id);
              break;
          case 'city':
              data = await fetchDataById(City, "city_id" , id);
              break;
          default:
              throw new Error(`Invalid type: ${type}`);
      }
      res.status(200).json(data);
  } catch (error) {
      console.error('Error fetching data:', error);
      res.status(500).json({ error: 'Internal server error' });
  }
};


exports.getCountriesById = async (req, res) => {
  const { country } = req.query;
  try {
    const countries = await Country.findOne({country_id: country});
    res.status(200).json(countries);
  } catch (error) {
    console.error('Error fetching countries:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Fetch states by country
exports.getStatesById = async (req, res) => {
  const { state } = req.query;
  try {
    const states = await State.findOne({ state_id: state });
    res.status(200).json(states);
  } catch (error) {
    console.error('Error fetching states:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Fetch cities by country and state
exports.getCitiesById = async (req, res) => {
  const { city } = req.query;
  try {
    const cities = await City.findOne({ city_id: city });
    res.status(200).json(cities);
  } catch (error) {
    console.error('Error fetching cities:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Fetch states by multiple IDs
exports.getMultipleStatesById = async (req, res) => {
  const { state } = req.query;
  try {
    const stateIds = state.split(',').map(id => parseInt(id.trim()));
    console.log(stateIds);
    const states = await State.find({ state_id: { $in: stateIds } });
    res.status(200).json(states);
  } catch (error) {
    console.error('Error fetching states:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Fetch cities by multiple IDs
exports.getMultipleCitiesById = async (req, res) => {
  const { city } = req.query;
  try {
    const cityIds = city.split(',').map(id => id.trim());
    const cities = await City.find({ city_id: { $in: cityIds } });
    res.status(200).json(cities);
  } catch (error) {
    console.error('Error fetching cities:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};