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
  