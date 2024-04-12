const User = require("../models/Users");
const {ListData} = require('../helper/cardListedData');

exports.getMatchesAccordingToPreference = async (req, res) => {
  try {
    console.log(req.body);
    const { ageRangeStart, ageRangeEnd, heightRangeStart, heightRangeEnd, annualIncomeRangeStart, annualIncomeRangeEnd, maritalStatus, community, caste, country, state, city, education, workingpreference, dietType} = req.body
    console.log(ageRangeStart, ageRangeEnd, heightRangeStart, heightRangeEnd, annualIncomeRangeStart, annualIncomeRangeEnd, maritalStatus, community, caste, country, state, city, education, workingpreference, dietType);
    const filterConditions = [];

    const { gender } = req.params;
    const queryGender = gender === "F" ? "M" : "F";

    gender && filterConditions.push({ gender : queryGender });
    ageRangeStart && ageRangeEnd && filterConditions.push({ "basicDetails.age": { $gt: ageRangeStart, $lte: ageRangeEnd } });
    heightRangeStart && heightRangeEnd && filterConditions.push({ "additionalDetails.height": { $gt: heightRangeStart, $lte: heightRangeEnd } });
    annualIncomeRangeStart && annualIncomeRangeEnd && filterConditions.push({ "careerDetails.annualIncomeValue": { $gt: annualIncomeRangeStart, $lte: annualIncomeRangeEnd } });
    maritalStatus && filterConditions.push({ "additionalDetails.maritalStatus": maritalStatus });
    community && filterConditions.push({ "familyDetails.community": community });
    caste && filterConditions.push({ "familyDetails.caste": caste });

    // // Dynamically construct the country filter object
    // country && filterConditions.push(Object.assign({ "additionalDetails.currentlyLivingInCountry": country },
    //   state && { "additionalDetails.currentlyLivingInState": state },
    //   city && { "additionalDetails.currentlyLivingInCity": city }
    // ));
    if (country) {
      const countryFilter = { "additionalDetails.currentlyLivingInCountry": country };
      if (state) {
        countryFilter["additionalDetails.currentlyLivingInState"] = state;
        if (city) countryFilter["additionalDetails.currentlyLivingInCity"] = city;
      }
      filterConditions.push(countryFilter);
    }

    education && filterConditions.push({ "careerDetails.highestEducation": education });
    workingpreference && filterConditions.push({ "careerDetails.profession": workingpreference });
    dietType && filterConditions.push({ "additionalDetails.diet": dietType });

    // Selectively project only required fields
    const filteredUsers = await User.find({ $or: filterConditions }).select(ListData);
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
    const page = parseInt(req.query.page) || 1;
    const limit = 2;
    const skip = (page - 1) * limit;

    // Calculate the date 15 days ago
    const fifteenDaysAgo = new Date();
    fifteenDaysAgo.setDate(fifteenDaysAgo.getDate() - 15);

    // Fetch users created in the last 15 days
    const users = await User.find({
      createdAt: { $gte: fifteenDaysAgo },
      gender: queryGender,
    })
      .sort({ createdAt: -1 })
      .select(ListData)
      .skip(skip)
      .limit(limit);

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

exports.updateUserSchema = async (req, res) => {
  try {
    const { userId, schemaName } = req.params;
    const updates = req.body;

    // Validate if the schemaName is valid
    if (!User.schema.obj[schemaName]) {
      return res.status(400).json({ error: "Invalid schema name" });
    }

    // Update user data
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: { [`${schemaName}.$`]: updates } },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ error: "User not found" });
    }

    res.status(200).json({ user: updatedUser });
  } catch (error) {
    console.error("Error updating user schema:", error);
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
