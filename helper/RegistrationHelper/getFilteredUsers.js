const User = require("../../models/Users");
const { Country, State, City, Diet, Proffesion, Community } = require("../../models/masterSchemas");
const ShortList = require("../../models/shortlistUsers");
const { ProfileRequests, InterestRequests } = require("../../models/interests");
const { getPublicUrlFromS3 } = require("../../utils/s3Utils");
const { ListData } = require("../cardListedData");
const BlockedUser = require("../../models/blockedUser");


const DEFAULT_PAGE_LIMIT = 10;

exports.getFilteredProfiles = async (req, res, queryParams, findOne, PAGE_LIMIT = DEFAULT_PAGE_LIMIT) => {
  try {
      const {_id : userId, gender} = req.user;
      const { page = 1 } = req.query;
      const queryGender = gender === "F" ? "M" : "F";
      const pageNumber = parseInt(page);
      const pageSize = parseInt(PAGE_LIMIT);
      const startIndex = (pageNumber - 1) * pageSize;
      const endIndex = pageNumber * pageSize;

      // Fetch the list of blocked user IDs
      const blockedUsers = await BlockedUser.find({ blockedBy: userId }).select('blockedUser');
      const blockedUserIds = blockedUsers.map(blocked => blocked.blockedUser);

      // Build the query
      const query = {
          gender: queryGender,
          ...queryParams,
          registrationPhase: "approved",
          isDeleted: false,
          _id: { $nin: blockedUserIds } // Exclude blocked users
      };

      // Fetch total user count for pagination
      const totalUsersCount = await User.countDocuments(query);

      // Fetch users based on query parameters excluding blocked users with pagination
      const usersData = await User.find(query)
          .sort({ createdAt: -1 })
          .skip(startIndex)
          .limit(pageSize)
          .select(ListData);

      const users = JSON.parse(JSON.stringify(usersData));

      // Fetch additional data for users
      const communityIds = users.map(user => user?.familyDetails[0]?.community || "");
      const professionIds = users.map(user => user?.careerDetails[0]?.profession || "");
      const dietIds = users.map(user => user?.additionalDetails[0]?.diet || "");
      const countryIds = users.map(user => user?.additionalDetails[0]?.currentlyLivingInCountry || "");
      const stateIds = users.map(user => user?.additionalDetails[0]?.currentlyLivingInState || "");
      const borncountryIds = users.map(user => user?.basicDetails[0]?.placeOfBirthCountry || "");
      const bornstateIds = users.map(user => user?.basicDetails[0]?.placeOfBirthState || "");
      const cityIds = users.map(user => user?.additionalDetails[0]?.currentlyLivingInCity || "");

      const [
          communities, professions, diets, countries, bornCoutnry, bornState, states, cities,
          shortlistedUsers, profileRequestsTo, interestRequestsTo, profileRequestsFrom, interestRequestsFrom
      ] = await Promise.all([
          Community.find({ community_id: { $in: communityIds } }),
          Proffesion.find({ proffesion_id: { $in: professionIds } }),
          Diet.find({ diet_id: { $in: dietIds } }),
          Country.find({ country_id: { $in: countryIds } }),
          Country.find({ country_id: { $in: borncountryIds } }),
          State.find({ state_id: { $in: bornstateIds } }),
          State.find({ state_id: { $in: stateIds } }),
          City.find({ city_id: { $in: cityIds } }),
          ShortList.find({ user: userId }),
          ProfileRequests.find({ profileRequestTo: userId }),
          InterestRequests.find({ interestRequestTo: userId }),
          ProfileRequests.find({ profileRequestBy: userId }),
          InterestRequests.find({ interestRequestBy: userId })
      ]);

      const promises = users.map(async (user) => {
          const userIdString = String(user._id);
          if (user?.selfDetails && user?.selfDetails[0]) {
              const profileUrl = getPublicUrlFromS3(user?.selfDetails[0]?.profilePicture || "");
              user.selfDetails[0].profilePictureUrl = profileUrl || "";
          } else {
              user.selfDetails = [{}]; // Initialize selfDetails with an empty object
              const profileUrl = getPublicUrlFromS3(""); // Generate URL for empty profile picture
              user.selfDetails[0].profilePictureUrl = profileUrl || "";
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
              const dietData = diets.find(diet => diet.diet_id === user.additionalDetails[0]?.diet);
              user.additionalDetails[0].dietName = dietData?.diet_name || "";
          }
          if (user.additionalDetails && user.additionalDetails[0]?.currentlyLivingInCountry) {
              const countryData = countries.find(country => country.country_id === user.additionalDetails[0]?.currentlyLivingInCountry);
              user.additionalDetails[0].currentCountryName = countryData?.country_name || "";
              if (user.additionalDetails[0]?.currentlyLivingInState) {
                  const stateData = states.find(state => state.state_id === user.additionalDetails[0]?.currentlyLivingInState);
                  user.additionalDetails[0].currentStateName = stateData?.state_name || "";
                  if (user.additionalDetails[0]?.currentlyLivingInCity) {
                      const cityData = cities.find(city => city.city_id === user.additionalDetails[0]?.currentlyLivingInCity);
                      user.additionalDetails[0].currentCityName = cityData?.city_name || "";
                  }
              }
          }
          if (user.basicDetails && user.basicDetails[0]?.placeOfBirthCountry) {
              const countryData = bornCoutnry.find(country => country.country_id === user.basicDetails[0]?.placeOfBirthCountry);
              user.basicDetails[0].currentCountryName = countryData?.country_name || "";
              if (user.basicDetails[0]?.placeOfBirthState) {
                  const stateData = bornState.find(state => state.state_id === user.basicDetails[0]?.placeOfBirthState);
                  user.basicDetails[0].currentStateName = stateData?.state_name || "";
              }
          }
          // Check if the user's ID exists in the list of shortlisted users
          user.isShortListed = shortlistedUsers.some(data => String(data.shortlistedUser) === userIdString);

          // Check if there is a profile request to this user
          user.isProfileRequest = profileRequestsFrom.some(data => String(data.profileRequestTo) === userIdString && data.action !== "declined");

          // Check if there is an interest request to this user
          user.isInterestRequest = interestRequestsFrom.some(data => String(data.interestRequestTo) === userIdString && data.action !== "declined");

          // Check if there is a profile request from this user
          user.isProfileRequestAccepted = profileRequestsTo.some(data => String(data.profileRequestBy) === userIdString && data.action === "accepted") || profileRequestsFrom.some(data => String(data.profileRequestTo) === userIdString && data.action === "accepted");
          user.isInterestRequestAccepted = interestRequestsTo.some(data => String(data.interestRequestBy) === userIdString && data.action === "accepted") || interestRequestsFrom.some(data => String(data.interestRequestTo) === userIdString && data.action === "accepted");
      });

      await Promise.all(promises);

      const filteredUsers = users 

      // Respond with the users and pagination info
      res.status(200).json({
          users: filteredUsers,
          totalUsersCount,
          currentPage: pageNumber,
          hasNextPage: endIndex < totalUsersCount,
          hasPreviousPage: pageNumber > 1,
          nextPage: pageNumber + 1,
          previousPage: pageNumber - 1,
          lastPage: Math.ceil(totalUsersCount / pageSize)
      });
  } catch (error) {
      console.error("Error retrieving users:", error);
      res.status(500).json({ error: "Internal server error" });
  }
};