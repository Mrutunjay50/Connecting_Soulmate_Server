const User = require("../models/Users");
const { ListData } = require('../helper/cardListedData');
const { getSignedUrlFromS3 } = require('../utils/s3Utils');
const { Country, State, City, Diet, Proffesion, Community } = require("../models/masterSchemas");
const PAGE_LIMIT = 10;

exports.getMatchesAccordingToPreference = async (req, res) =>
  {
    try
    {
      const { gender } = req.params;
      const { ageRangeStart, ageRangeEnd, heightRangeStart, heightRangeEnd,
        annualIncomeRangeStart, annualIncomeRangeEnd, maritalStatus, community,
        caste, country, state, city, education, dietType, profession, page } = req.query;
      const filterConditions = [];
      const skip = (parseInt(page) - 1) * PAGE_LIMIT;
      const limit = PAGE_LIMIT;
  
      const queryGender = gender === "F" ? "M" : "F";
  
      // Gender condition is AND
      filterConditions.push({ gender: queryGender });
  
      // Other conditions are OR
      const orConditions = [];
  
      ageRangeStart && ageRangeEnd && orConditions.push({ "basicDetails.age": { $gt: ageRangeStart, $lte: ageRangeEnd } });
      heightRangeStart && heightRangeEnd && orConditions.push({ "additionalDetails.height": { $gt: heightRangeStart, $lte: heightRangeEnd } });
      annualIncomeRangeStart && annualIncomeRangeEnd && orConditions.push({ "careerDetails.annualIncomeValue": { $gt: annualIncomeRangeStart, $lte: annualIncomeRangeEnd } });
      caste && orConditions.push({ "familyDetails.caste": caste });
  
      // Dynamically construct the country filter object
      if (country)
      {
        const countryFilter = { "additionalDetails.currentlyLivingInCountry": country };
        orConditions.push(countryFilter);
      }
  
      if (state)
      {
        const stateFilter = { "additionalDetails.currentlyLivingInState": state };
        orConditions.push(stateFilter);
      }
  
      if (city)
      {
        const cityFilter = { "additionalDetails.currentlyLivingInCity": city };
        orConditions.push(cityFilter);
      }
  
      if (maritalStatus)
      {
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
      if (education)
      {
        const educationArray = education.trim().split(",").map(val => val.trim());
        const educationFilter = { "careerDetails.highestEducation": { $in: educationArray } };
        orConditions.push(educationFilter);
      }
  
      community && orConditions.push({ "familyDetails.community": community });
      profession && orConditions.push({ "careerDetails.profession": profession });
  
      if (dietType)
      {
        const dietTypeArray = dietType.trim().split(",").map(val => val.trim());
        const dietFilter = { "additionalDetails.diet": { $in: dietTypeArray } };
        orConditions.push(dietFilter);
      }
  
      // Combine OR conditions with $or operator
      if (orConditions.length > 0)
      {
        filterConditions.push({ $or: orConditions });
      }
  
      // Selectively project only required fields
      const filteredUsers = await User.find({ $and: filterConditions })
        .skip(skip)
        .limit(limit)
        .select(ListData);
  
      const finalUsers = JSON.parse(JSON.stringify(filteredUsers));
  
      // Fetch necessary data from the master schema
      const communityIds = finalUsers.map(user => user.familyDetails[0]?.community);
      const professionIds = finalUsers.map(user => user.careerDetails[0]?.profession);
      const dietIds = finalUsers.map(user => user.additionalDetails[0]?.diet);
      const countryIds = finalUsers.map(user => user.additionalDetails[0]?.currentlyLivingInCountry);
      const stateIds = finalUsers.map(user => user.additionalDetails[0]?.currentlyLivingInState);
      const borncountryIds = finalUsers.map(user => user.basicDetails[0]?.placeOfBirthCountry);
      const bornstateIds = finalUsers.map(user => user.basicDetails[0]?.placeOfBirthState);
      const cityIds = finalUsers.map(user => user.additionalDetails[0]?.currentlyLivingInCity);
      const [communities, professions, diets, countries, bornCoutnry, bornState, states, cities] = await Promise.all([
        Community.find({ community_id: { $in: communityIds } }),
        Proffesion.find({ proffesion_id: { $in: professionIds } }),
        Diet.find({ diet_id: { $in: dietIds } }),
        Country.find({ country_id: { $in: countryIds } }),
        Country.find({ country_id: { $in: borncountryIds } }),
        State.find({ state_id: { $in: bornstateIds } }),
        State.find({ state_id: { $in: stateIds } }),
        City.find({ city_id: { $in: cityIds } })
      ]);
      finalUsers.forEach(user =>
      {
        if (user.familyDetails && user.familyDetails[0]?.community)
        {
          const communityData = communities.find(community => community.community_id === user.familyDetails[0]?.community);
          user.familyDetails[0].communityName = communityData?.community_name || "";
        }
        if (user.careerDetails && user.careerDetails[0]?.profession)
        {
          const professionData = professions.find(profession => profession.proffesion_id === user.careerDetails[0]?.profession);
          user.careerDetails[0].professionName = professionData?.proffesion_name || "";
        }
        if (user.additionalDetails && user.additionalDetails[0]?.diet)
        {
          const dietData = diets.find(diet => diet.diet_id === user.additionalDetails[0]?.diet);
          user.additionalDetails[0].dietName = dietData?.diet_name || "";
        }
        if (user.additionalDetails && user.additionalDetails[0]?.currentlyLivingInCountry)
        {
          const countryData = countries.find(country => country.country_id === user.additionalDetails[0]?.currentlyLivingInCountry);
          user.additionalDetails[0].currentCountryName = countryData?.country_name || "";
          if (user.additionalDetails[0]?.currentlyLivingInState)
          {
            const stateData = states.find(state => state.state_id === user.additionalDetails[0]?.currentlyLivingInState);
            user.additionalDetails[0].currentStateName = stateData?.state_name || "";
            if (user.additionalDetails[0]?.currentlyLivingInCity)
            {
              const cityData = cities.find(city => city.city_id === user.additionalDetails[0]?.currentlyLivingInCity);
              user.additionalDetails[0].currentCityName = cityData?.city_name || "";
            }
          }
        }
        if (user.basicDetails && user.basicDetails[0]?.placeOfBirthCountry)
        {
          const countryData = bornCoutnry.find(country => country.country_id === user.basicDetails[0]?.placeOfBirthCountry);
          user.basicDetails[0].currentCountryName = countryData?.country_name || "";
          if (user.basicDetails[0]?.placeOfBirthState)
          {
            const stateData = bornState.find(state => state.state_id === user.basicDetails[0]?.placeOfBirthState);
            user.basicDetails[0].currentStateName = stateData?.state_name || "";
          }
        }
      });
      res.status(200).json({ success: true, data: finalUsers });
  
    } catch (error)
    {
      console.error(error);
      res.status(500).json({ success: false, error: "Internal Server Error" });
    }
  };




exports.getNewlyJoinedProfiles = async (req, res) => {
  try {
    const { gender } = req.params;
    const queryGender = gender === "F" ? "M" : "F";
    const page = parseInt(req.query.page) || 1;
    const skip = (page - 1) * PAGE_LIMIT;
    const limit = PAGE_LIMIT;

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
    .sort({ createdAt: 1 })
    .skip(skip)
    .limit(limit)
    .select(ListData);

      for (const user of users) {
        if (user.selfDetails && user.selfDetails[0]) {
          const profileUrl = await getSignedUrlFromS3(user.selfDetails[0].userPhotos[0] || "");
          user.selfDetails[0].profilePictureUrl = profileUrl || "";
        }
      }
      res.status(200).json({ users });
  } catch (error) {
    console.error("Error retrieving newly joined users:", error);
    res.status(500).json({ error: "Internal server error" });
  }
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


