const User = require("../models/Users");
const {ListData} = require('../helper/cardListedData');

exports.getMatchesAccordingToPreference = async (req, res) => {
  try {
    const { gender } = req.params;
    const { ageRangeStart, ageRangeEnd, heightRangeStart, heightRangeEnd, annualIncomeRangeStart, annualIncomeRangeEnd, maritalStatus, community, caste, country, state, city, education, workingpreference, dietType } = req.query;
    const filterConditions = [];

    const queryGender = gender === "F" ? "M" : "F";

    // Gender condition is AND
    filterConditions.push({ gender: queryGender });

    // Other conditions are OR
    const orConditions = [];

    ageRangeStart && ageRangeEnd && orConditions.push({ "basicDetails.age": { $gt: ageRangeStart, $lte: ageRangeEnd } });
    heightRangeStart && heightRangeEnd && orConditions.push({ "additionalDetails.height": { $gt: heightRangeStart, $lte: heightRangeEnd } });
    annualIncomeRangeStart && annualIncomeRangeEnd && orConditions.push({ "careerDetails.annualIncomeValue": { $gt: annualIncomeRangeStart, $lte: annualIncomeRangeEnd } });
    maritalStatus && orConditions.push({ "additionalDetails.maritalStatus": maritalStatus });
    community && orConditions.push({ "familyDetails.community": community });
    caste && orConditions.push({ "familyDetails.caste": caste });

    // Dynamically construct the country filter object
    if (country) {
      const countryFilter = { "additionalDetails.currentlyLivingInCountry": country };
      if (state) {
        countryFilter["additionalDetails.currentlyLivingInState"] = state;
        if (city) countryFilter["additionalDetails.currentlyLivingInCity"] = city;
      }
      orConditions.push(countryFilter);
    }

    education && orConditions.push({ "careerDetails.highestEducation": education });
    workingpreference && orConditions.push({ "careerDetails.profession": workingpreference });
    dietType && orConditions.push({ "additionalDetails.diet": dietType });

    // Combine OR conditions with $or operator
    if (orConditions.length > 0) {
      filterConditions.push({ $or: orConditions });
    }

    // Selectively project only required fields
    const filteredUsers = await User.find({ $and: filterConditions }).select(ListData);
    res.status(200).json({ success: true, data: filteredUsers });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
};



exports.getNewlyJoinedProfiles = async (req, res) => {
  try {
    const { gender } = req.params;
    const queryGender = gender === "F" ? "M" : "F";
    // const page = parseInt(req.query.page) || 1;
    // const limit = 2;
    // const skip = (page - 1) * limit;

    // Calculate the date 15 days ago in MongoDB date format
    const fifteenDaysAgo = new Date();
    fifteenDaysAgo.setDate(fifteenDaysAgo.getDate() - 15);
    const mongoDbDate = fifteenDaysAgo.toISOString();

    // console.log("Fifteen days ago:", mongoDbDate);
    
    // Fetch users created in the last 15 days
    const users = await User.find({
      createdAt: { $gte: mongoDbDate},
      gender: queryGender,
    })
      .sort({ createdAt: -1 })
      .select(ListData)
      // .skip(skip)
      // .limit(limit);

    // console.log("Found users:", users);
    console.log(users.length);
    res.status(200).json({ users });
  } catch (error) {
    console.error("Error retrieving newly joined users:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};


exports.getAllUsers = async (req, res) => {
  try {
    const { gender } = req.params;
    const queryGender = gender === "F" ? "M" : "F";
    const users = await User.find({ gender: queryGender }).select(ListData);
    res.status(200).json({ users });
  } catch (error) {
    console.error("Error retrieving users:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.getUserById = async (req, res) => {
  try {
    const userId = req.params.userId;
    const user = await User.findById(userId);

    if (user) {
      res.status(200).json(user);
    } else {
      res.status(404).json({ message: "User not found" });
    }
  } catch (error) {
    console.error("Error retrieving user:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};


