const {
    Religion,
    Proffesion,
    Other,
    Interest,
    Fitness,
    Education,
    Diet,
    Community,
    FunActivity,
    Country,
    State,
    City
  } = require("../models/masterSchemas");
  
  exports.getMasterData = async (req, res) => {
    try {
      const { type } = req.params;
      let data;
      
      switch (type) {
        case 'religion':
          data = await Religion.find();
          break;
        case 'profession':
          data = await Proffesion.find();
          break;
        case 'other':
          data = await Other.find();
          break;
        case 'interest':
          data = await Interest.find();
          break;
        case 'fitness':
          data = await Fitness.find();
          break;
        case 'education':
          data = await Education.find();
          break;
        case 'diet':
          data = await Diet.find();
          break;
        case 'community':
          data = await Community.find();
          break;
        case 'country':
          data = await Country.find();
          break;
        case 'state':
          data = await State.find();
          break;
        case 'city':
          data = await City.find();
          break;
        case 'funActivity':
          data = await FunActivity.find();
          break;
        default:
          return res.status(404).json({ error: 'Invalid master data type' });
      }
      res.status(200).json(data);
    } catch (error) {
      console.error(`Error fetching ${type}:`, error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  
  exports.getMasterDataById = async (req, res) => {
    try {
      const { type, id } = req.params;
      let data;
      
      switch (type) {
        case 'religion':
          data = await Religion.findOne({religion_id : id});
          break;
        case 'profession':
          data = await Proffesion.findOne({proffesion_id : id});
          break;
        case 'other':
          data = await Other.findOne({other_id : id});
          break;
        case 'interest':
          data = await Interest.findOne({interest_id : id});
          break;
        case 'fitness':
          data = await Fitness.findOne({fitness_id : id});
          break;
        case 'education':
          data = await Education.findOne({education_id : id});
          break;
        case 'diet':
          data = await Diet.findOne({diet_id : id});
          break;
        case 'community':
          data = await Community.findOne({community_id : id});
          break;
        case 'country':
          data = await Country.findOne({country_id : id});
          break;
        case 'state':
          data = await State.findOne({state_id : id});
          break;
        case 'city':
          data = await City.findOne({city_id : id});
          break;
        case 'funActivity':
          data = await FunActivity.findOne({funActivity_id : id});
          break;
        default:
          return res.status(404).json({ error: 'Invalid master data type' });
      }
      res.status(200).json(data);
    } catch (error) {
      console.error(`Error fetching ${type}:`, error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };
  