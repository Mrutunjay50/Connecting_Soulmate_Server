const BlockedUser = require('../models/blockedUser');
const { InterestRequests, ProfileRequests } = require('../models/interests');
const { Country, State, City, Diet, Proffesion, Community } = require("../models/masterSchemas");
const { getSignedUrlFromS3 } = require('../utils/s3Utils');

exports.blockUser = async (req, res) => {
  try {
    const { blockBy, blockUserId } = req.body;

    if(!blockBy && !blockUserId && blockBy === "" && blockUserId === ""){
      return res.status(400).json({ error: "both blockBy and blockUserId is needed" });
    }

    // Check if the user is already blocked
    const existingBlockedUser = await BlockedUser.findOne({ blockedBy : blockBy, blockedUser: blockUserId });
    console.log(existingBlockedUser);

    if (existingBlockedUser) {
      return res.status(400).json({ error: "User already blocked" });
    }

    // Create a new blocked user entry
    const blockedUser = new BlockedUser({ blockedBy : blockBy, blockedUser: blockUserId });

    await Promise.all([
      ProfileRequests.updateMany(
        { profileRequestBy: blockBy, profileRequestTo: blockUserId },
        { isBlocked: true }
      ),
      InterestRequests.updateMany(
        { interestRequestBy: blockBy, interestRequestTo: blockUserId },
        { isBlocked: true }
      )
    ]);
    await blockedUser.save();

    res.status(200).json({ message: "User blocked successfully", blockedUser });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error", err });
  }
};

exports.unblockUser = async (req, res) => {
  try {
    const { blockedBy, blockedUserId } = req.body;

    // Find and delete the blocked user entry
    const blockedUser = await BlockedUser.findOneAndDelete({ blockedBy, blockedUser: blockedUserId });

    if (!blockedUser) {
      return res.status(404).json({ error: "Blocked user not found" });
    }
    await Promise.all([
      ProfileRequests.updateMany(
        { profileRequestBy: blockedBy, profileRequestTo: blockedUserId },
        { isBlocked: false }
      ),
      InterestRequests.updateMany(
        { interestRequestBy: blockedBy, interestRequestTo: blockedUserId },
        { isBlocked: false }
      )
    ]);

    res.status(200).json({ message: "User unblocked successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.getBlockedUsers = async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 10 } = req.query;  // Default to page 1 and limit 10

    // Convert page and limit to numbers
    const pageNumber = parseInt(page, 10);
    const limitNumber = parseInt(limit, 10);

    // Calculate the total number of blocked users
    const totalBlockedUsers = await BlockedUser.countDocuments({ blockedBy: userId });

    // Find all users blocked by the specified user with pagination
    let blockedUsers = await BlockedUser.find({ blockedBy: userId })
      .populate('blockedUser')
      .skip((pageNumber - 1) * limitNumber)
      .limit(limitNumber);

    blockedUsers = blockedUsers.map(item => item.blockedUser);
    const user = JSON.parse(JSON.stringify(blockedUsers));

    // Fetch additional data for users
    const communityIds = user.map(user => user?.familyDetails[0]?.community || "");
    const professionIds = user.map(user => user?.careerDetails[0]?.profession || "");
    const dietIds = user.map(user => user?.additionalDetails[0]?.diet || "");
    const countryIds = user.map(user => user?.additionalDetails[0]?.currentlyLivingInCountry || "");
    const stateIds = user.map(user => user?.additionalDetails[0]?.currentlyLivingInState || "");
    const borncountryIds = user.map(user => user?.basicDetails[0]?.placeOfBirthCountry || "");
    const bornstateIds = user.map(user => user?.basicDetails[0]?.placeOfBirthState || "");
    const cityIds = user.map(user => user?.additionalDetails[0]?.currentlyLivingInCity || "");

    const [communities, professions, diets, countries, bornCoutnry, bornState, states, cities] = await Promise.all([
      Community.find({ community_id: { $in: communityIds } }),
      Proffesion.find({ proffesion_id: { $in: professionIds } }),
      Diet.find({ diet_id: { $in: dietIds } }),
      Country.find({ country_id: { $in: countryIds } }),
      Country.find({ country_id: { $in: borncountryIds } }),
      State.find({ state_id: { $in: bornstateIds } }),
      State.find({ state_id: { $in: stateIds } }),
      City.find({ city_id: { $in: cityIds } }),
    ]);

    const promises = user.map(async (user) => {
      const profileUrl = await getSignedUrlFromS3(user?.selfDetails[0]?.profilePicture || "");
      user.selfDetails[0].profilePictureUrl = profileUrl || "";

      if (user?.familyDetails && user?.familyDetails[0]?.community) {
        const communityData = communities.find(community => community.community_id === user?.familyDetails[0]?.community);
        user.familyDetails[0].communityName = communityData?.community_name || "";
      }
      if (user?.careerDetails && user?.careerDetails[0]?.profession) {
        const professionData = professions.find(profession => profession.proffesion_id === user?.careerDetails[0]?.profession);
        user.careerDetails[0].professionName = professionData?.proffesion_name || "";
      }
      if (user?.additionalDetails && user?.additionalDetails[0]?.diet) {
        const dietData = diets.find(diet => diet.diet_id === user?.additionalDetails[0]?.diet);
        user.additionalDetails[0].dietName = dietData?.diet_name || "";
      }
      if (user?.additionalDetails && user?.additionalDetails[0]?.currentlyLivingInCountry) {
        const countryData = countries.find(country => country.country_id === user?.additionalDetails[0]?.currentlyLivingInCountry);
        user.additionalDetails[0].currentCountryName = countryData?.country_name || "";
        if (user?.additionalDetails[0]?.currentlyLivingInState) {
          const stateData = states.find(state => state.state_id === user?.additionalDetails[0]?.currentlyLivingInState);
          user.additionalDetails[0].currentStateName = stateData?.state_name || "";
          if (user?.additionalDetails[0]?.currentlyLivingInCity) {
            const cityData = cities.find(city => city.city_id === user?.additionalDetails[0]?.currentlyLivingInCity);
            user.additionalDetails[0].currentCityName = cityData?.city_name || "";
          }
        }
      }
      if (user?.basicDetails && user?.basicDetails[0]?.placeOfBirthCountry) {
        const countryData = bornCoutnry.find(country => country.country_id === user?.basicDetails[0]?.placeOfBirthCountry);
        user.basicDetails[0].currentCountryName = countryData?.country_name || "";
        if (user?.basicDetails[0]?.placeOfBirthState) {
          const stateData = bornState.find(state => state.state_id === user?.basicDetails[0]?.placeOfBirthState);
          user.basicDetails[0].currentStateName = stateData?.state_name || "";
        }
      }
    });

    await Promise.all(promises);

    res.status(200).json({
      blockedUsers: user,
      totalBlockedUsers,
      page: pageNumber,
      limit: limitNumber,
      totalPages: Math.ceil(totalBlockedUsers / limitNumber)
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

