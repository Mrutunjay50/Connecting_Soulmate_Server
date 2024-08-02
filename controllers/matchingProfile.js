const User = require("../models/Users");
const { ListData } = require('../helper/cardListedData');
const { getPublicUrlFromS3 } = require('../utils/s3Utils');
// const { Country, State, City, Diet, Proffesion, Community } = require("../models/masterSchemas");
// const ShortList = require("../models/shortlistUsers");
// const { ProfileRequests, InterestRequests } = require("../models/interests");
const { getFilteredProfiles } = require("../helper/RegistrationHelper/getFilteredUsers");
const PAGE_LIMIT = 50;


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
  
  if (maritalStatus) {
      const maritalStatusArray = maritalStatus.trim().split(",").map(val => val.trim());
      orConditions.push({ "additionalDetails.maritalStatus": { $in: maritalStatusArray } });
  }
  if (country) {
    const countryArray = country.trim().split(",").map(val => val.trim());
    const countryFilter = { "additionalDetails.currentlyLivingInCountry": { $in: countryArray } };
    orConditions.push(countryFilter);
  }

  if (state) {
    const stateArray = state.trim().split(",").map(val => val.trim());
    const stateFilter = { "additionalDetails.currentlyLivingInState": { $in: stateArray } };
    orConditions.push(stateFilter);
  }

  if (city) {
    const cityArray = city.trim().split(",").map(val => val.trim());
    const cityFilter = { "additionalDetails.currentlyLivingInCity": { $in: cityArray } };
    orConditions.push(cityFilter);
  }

  if (community) {
    const communityArray = community.trim().split(",").map(val => val.trim());
    const communityFilter = { "familyDetails.community": { $in: communityArray } };
    orConditions.push(communityFilter);
  }
  // Dynamically construct the $or conditions
  if (education) {
      const educationArray = education.trim().split(",").map(val => val.trim());
      orConditions.push({ "careerDetails.highestEducation": { $in: educationArray } });
  }
  // community && orConditions.push({ "familyDetails.community": community });
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
      filterConditions.push({ category: category === "" ? { $exists: true } : { $in: [category, ""] } });
  }

  await getFilteredProfiles(req, res, {$and : filterConditions});
};

  



  // exports.getNewlyJoinedProfiles = async (req, res) => {
  //   const fifteenDaysAgo = new Date();
  //   fifteenDaysAgo.setDate(fifteenDaysAgo.getDate() - 15);
  //   const mongoDbDate = fifteenDaysAgo.toISOString();
  //   const queryParams = {
  //     createdAt: { $gte: mongoDbDate }
  //   };
  //   await getFilteredProfiles(req, res, queryParams);
  // };

  exports.getNewlyJoinedProfiles = async (req, res) => {
    // const {limit} = req.query
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    const mongoDbDate = threeMonthsAgo.toISOString();
    const queryParams = {
      approvedAt: { $gte: mongoDbDate }
    };
    await getFilteredProfiles(req, res, queryParams);
  };