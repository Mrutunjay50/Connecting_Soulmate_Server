const User = require("../models/Users");
const { ListData } = require('../helper/cardListedData');
const { getSignedUrlFromS3 } = require('../utils/s3Utils');
// const { Country, State, City, Diet, Proffesion, Community } = require("../models/masterSchemas");
// const ShortList = require("../models/shortlistUsers");
// const { ProfileRequests, InterestRequests } = require("../models/interests");
const { getFilteredProfiles } = require("../helper/getFilteredUsers");
const PAGE_LIMIT = 10;


exports.getMatchesAccordingToPreference = async (req, res) => {
  const {
    ageRangeStart, ageRangeEnd, heightRangeStart, heightRangeEnd,
    annualIncomeRangeStart, annualIncomeRangeEnd, maritalStatus, community,
    caste, country, state, city, education, dietType, profession, category
  } = req.query;
  
  const filterConditions = [];
  const orConditions = []; // Separate array for $or conditions
  
  ageRangeStart && ageRangeEnd && orConditions.push({ "basicDetails.age": { $gt: ageRangeStart, $lte: ageRangeEnd } });
  heightRangeStart && heightRangeEnd && orConditions.push({ "additionalDetails.height": { $gt: heightRangeStart, $lte: heightRangeEnd } });
  annualIncomeRangeStart && annualIncomeRangeEnd && orConditions.push({ "careerDetails.annualIncomeValue": { $gt: annualIncomeRangeStart, $lte: annualIncomeRangeEnd } });
  caste && orConditions.push({ "familyDetails.caste": caste });

  // Dynamically construct the country filter object
  if (country) {
      const countryFilter = { "additionalDetails.currentlyLivingInCountry": country };
      orConditions.push(countryFilter);
  }
  
  if (state) {
      const stateFilter = { "additionalDetails.currentlyLivingInState": state };
      orConditions.push(stateFilter);
  }
  
  if (city) {
      const cityFilter = { "additionalDetails.currentlyLivingInCity": city };
      orConditions.push(cityFilter);
  }
  
  if (maritalStatus) {
      const maritalStatusArray = maritalStatus.trim().split(",").map(val => val.trim());
      orConditions.push({ "additionalDetails.maritalStatus": { $in: maritalStatusArray } });
  }
 // if (country) {
      //   const countryArray = country.trim().split(",").map(val => val.trim());
      //   const countryFilter = { "additionalDetails.currentlyLivingInCountry": { $in: countryArray } };
      //   orConditions.push(countryFilter);
      // }
    
      // if (state) {
      //   const stateArray = state.trim().split(",").map(val => val.trim());
      //   const stateFilter = { "additionalDetails.currentlyLivingInState": { $in: stateArray } };
      //   orConditions.push(stateFilter);
      // }
    
      // if (city) {
      //   const cityArray = city.trim().split(",").map(val => val.trim());
      //   const cityFilter = { "additionalDetails.currentlyLivingInCity": { $in: cityArray } };
      //   orConditions.push(cityFilter);
      // }
    
      // if (community) {
      //   const communityArray = community.trim().split(",").map(val => val.trim());
      //   const communityFilter = { "familyDetails.community": { $in: communityArray } };
      //   orConditions.push(communityFilter);
      // }
  // Dynamically construct the $or conditions
  if (education) {
      const educationArray = education.trim().split(",").map(val => val.trim());
      orConditions.push({ "careerDetails.highestEducation": { $in: educationArray } });
  }
  community && orConditions.push({ "familyDetails.community": community });
  if (profession) {
      const professionTypeArray = profession.trim().split(",").map(val => val.trim());
      orConditions.push({ "careerDetails.profession": { $in: professionTypeArray } });
  }
  if (dietType) {
      const dietTypeArray = dietType.trim().split(",").map(val => val.trim());
      orConditions.push({ "additionalDetails.diet": { $in: dietTypeArray } });
  }

  // Combine OR conditions with $or operator
  if (orConditions.length > 0) {
      filterConditions.push({ $or: orConditions });
  }

  // Category filtering as an AND condition
  if (category) {
      filterConditions.push({ "category": { $in: [category, new RegExp(`^${category}$`, "i")] } });
  }

  await getFilteredProfiles(req, res, {$and : filterConditions});
};

  



  exports.getNewlyJoinedProfiles = async (req, res) => {
    const fifteenDaysAgo = new Date();
    fifteenDaysAgo.setDate(fifteenDaysAgo.getDate() - 15);
    const mongoDbDate = fifteenDaysAgo.toISOString();
    const queryParams = {
      createdAt: { $gte: mongoDbDate }
    };
    await getFilteredProfiles(req, res, queryParams);
  };
  


exports.getAllUsers = async (req, res) => {
  try {
    const { gender } = req.params;
    const page = parseInt(req.query.page) || 1;
    const skip = (page - 1) * PAGE_LIMIT;
    const limit = PAGE_LIMIT;
    const queryGender = gender === "F" ? "M" : "F";
    const users = await User.find({ gender: queryGender }).skip(skip)
    .limit(limit)
    .select(ListData);
    for (const user of users) {
      const profileUrl = await getSignedUrlFromS3(user.selfDetails[0].userPhotos[0]);
      user.selfDetails[0].profilePictureUrl = profileUrl;
    }
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
  const profileUrl = await getSignedUrlFromS3(user.selfDetails[0].userPhotos[0]);
  user.selfDetails[0].profilePictureUrl = profileUrl;
  res.status(200).json(user);
} else {
  res.status(404).json({ message: "User not found" });
}
  } catch (error) {
    console.error("Error retrieving user:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};


