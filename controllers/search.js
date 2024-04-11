const User = require("../models/Users");
const {ListData} = require('../helper/cardListedData');

exports.searchById = async (req, res) => {
    try {
        const { userId } = req.params;
    
        if (!userId) {
          return res.status(400).json({ error: "userId is required" });
        }
    
        const user = await User.findOne({ userId }).select(ListData);
    
        if (!user) {
          return res.status(404).json({ error: "User not found" });
        }
        return res.status(200).json(user);
      } catch (error) {
        console.error("Error searching user by ID:", error);
        return res.status(500).json({ error: "Internal Server Error" });
      }
};

exports.advanceSearch = async (req, res) => {
    try {
      const searchParams = req.body;
      const query = {};
      
      // Define mapping between search parameters and MongoDB fields
      const fieldMap = {
        marital: "additionalDetails.maritalStatus",
        country: "basicDetails.placeOfBirthCountry",
        state: "basicDetails.placeOfBirthState",
        city: "basicDetails.placeOfBirthCity",
        workingPref: "careerDetails.profession",
        manglik: "basicDetails.manglik",
        agerange: { field: "basicDetails.age", startField: "start", endField: "end" },
        heightrange: { field: "additionalDetails.height", startField: "start", endField: "end" },
        annualincome: { field: "careerDetails.annualIncomeValue", startField: "start", endField: "end" }
      };
  
      // Iterate through search parameters and construct the query
      for (const [param, value] of Object.entries(searchParams)) {
        const field = fieldMap[param];
        if (field) {
          // Exclude empty strings from the query
          if (typeof value === "string" && value.trim() === "") {
            continue;
          }
          if (typeof field === "string") {
            query[field] = value;
          } else {
            const { field: mainField, startField, endField } = field;
            query[mainField] = {
              $gte: value[startField],
              $lte: value[endField]
            };
          }
        }
      }
  
      console.log(query);

      const users = await User.find(query).select(ListData);
      return res.status(200).json(users);
    } catch (error) {
      console.error("Error searching users:", error);
      return res.status(500).json({ error: "Internal Server Error" });
    }
  };
  
  