const BlockedUser = require('../models/blockedUser');
const { MessageModel } = require('../models/conversationModel');
const { InterestRequests, ProfileRequests } = require('../models/interests');
const { Country, State, City, Diet, Proffesion, Community } = require("../models/masterSchemas");
const Notifications = require('../models/notifications');
const ShortList = require('../models/shortlistUsers');
const { getPublicUrlFromS3 } = require('../utils/s3Utils');
const { sendAndCreateNotification } = require('./notificationController');
const io = require("../socket");
const { events } = require("../utils/eventsConstants");

exports.blockUser = async (req, res) => {
  try {
    const { blockUserId } = req.body;
    const blockBy = req.user._id;

    if (!blockBy || !blockUserId || blockBy === "" || blockUserId === "") {
      return res.status(400).json({ error: "Both blockBy and blockUserId are needed" });
    }

    // Check if the user is already blocked
    const existingBlockedUser = await BlockedUser.findOne({ blockedBy: blockBy, blockedUser: blockUserId });
    if (existingBlockedUser) {
      return res.status(400).json({ error: "User already blocked" });
    }

    // Delete relevant requests and shortlist entries
    await Promise.all([
      ProfileRequests.deleteMany({ profileRequestBy: blockBy, profileRequestTo: blockUserId }),
      ProfileRequests.deleteMany({ profileRequestBy: blockUserId, profileRequestTo: blockBy }),
      InterestRequests.deleteMany({ interestRequestBy: blockBy, interestRequestTo: blockUserId }),
      InterestRequests.deleteMany({ interestRequestBy: blockUserId, interestRequestTo: blockBy }),
      ShortList.deleteMany({ user: blockBy, shortlistedUser: blockUserId }),
      ShortList.deleteMany({ user: blockUserId, shortlistedUser: blockBy }),
      MessageModel.deleteMany({ receiver: blockBy, sender: blockUserId}),
      MessageModel.deleteMany({ receiver: blockUserId, sender: blockBy}),
      Notifications.deleteMany({ notificationTo: blockBy, notificationBy: blockUserId}),
      Notifications.deleteMany({ notificationTo: blockUserId, notificationBy: blockBy})
    ]);

    // Create a new blocked user entry
    const blockedUser = new BlockedUser({ blockedBy: blockBy, blockedUser: blockUserId });
    await blockedUser.save();
    await sendAndCreateNotification(blockBy, blockUserId, 'blockedusers');

    res.status(200).json({ message: "User blocked successfully", blockedUser });
    io.getIO().emit(`${events.ONBLOCK}`, {...blockedUser});
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Internal Server Error", err });
  }
};

exports.unblockUser = async (req, res) => {
  try {
    const { blockedUserId } = req.body;
    const blockedBy = req.user._id;
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
    console.log(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.getBlockedUsers = async (req, res) => {
  try {
    const userId = req.user._id;
    const { page = 1, limit = 50 } = req.query; // Default to page 1 and limit 50

    // Convert page and limit to numbers
    const pageNumber = parseInt(page);
    const limitNumber = parseInt(limit);
    const startIndex = (pageNumber - 1) * limitNumber;
    const endIndex = pageNumber * limitNumber;

    // Calculate the total number of blocked users
    const totalBlockedUsers = await BlockedUser.countDocuments({ blockedBy: userId });

    // Find all users blocked by the specified user with pagination
    let blockedUsers = await BlockedUser.find({ blockedBy: userId })
      .sort({ createdAt: -1 })
      .populate('blockedUser')
      .skip(startIndex)
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
      if (user&& user.selfDetails && user.selfDetails[0]) {
        const profileUrl = getPublicUrlFromS3(user.selfDetails[0]?.profilePicture || "");
        if (user.selfDetails.length > 0) {
          user.selfDetails[0].profilePictureUrl = profileUrl || "";
        }
      }

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

    const filteredUsers = user;

    res.status(200).json({
      blockedUsers: filteredUsers,
      totalBlockedUsers,
      currentPage: pageNumber,
      hasNextPage: endIndex < totalBlockedUsers,
      hasPreviousPage: pageNumber > 1,
      nextPage: pageNumber + 1,
      previousPage: pageNumber - 1,
      lastPage: Math.ceil(totalBlockedUsers / limitNumber)
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

