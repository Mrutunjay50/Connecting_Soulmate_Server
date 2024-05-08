const { Country, State, City, Diet, Proffesion, Community } = require("../models/masterSchemas");
const ShortList = require("../models/shortlistUsers");
const { ProfileRequests, InterestRequests } = require("../models/interests");
const { getSignedUrlFromS3 } = require("../utils/s3Utils");
const { ListData } = require("../helper/cardListedData");

exports.addToShortlist = async (req, res) => {
    try {
      const { user, shortlistedUserId } = req.body;
  
      // Check if a shortlist entry already exists for the user and shortlisted user
      const existingShortlist = await ShortList.findOne({
        user: user,
        shortlistedUser: shortlistedUserId,
      });
  
      if (existingShortlist) {
        // If the entry already exists, delete it
        await ShortList.deleteOne({
          user: user,
          shortlistedUser: shortlistedUserId,
        });
        res.status(200).json({ message: "User removed from shortlist" });
  
        // Update isShortListedTo and isShortListedBy to 'no' in profile and interest requests
        await Promise.all([
          ProfileRequests.updateMany(
            { profileRequestBy: user, profileRequestTo: shortlistedUserId },
            { isShortListedBy: false }
          ),
          InterestRequests.updateMany(
            { interestRequestBy: user, interestRequestTo: shortlistedUserId },
            { isShortListedBy: false }
          )
        ]);
      } else {
        // If the entry doesn't exist, create a new one
        const shortlist = new ShortList({
          user: user,
          shortlistedUser: shortlistedUserId,
        });
  
        await shortlist.save();
  
        res.status(201).json({ message: "User added to shortlist successfully" });
  
        // Update isShortListedTo and isShortListedBy to 'yes' in profile and interest requests
        await Promise.all([
          ProfileRequests.updateMany(
            { profileRequestBy: user, profileRequestTo: shortlistedUserId },
            { isShortListedBy: true }
          ),
          InterestRequests.updateMany(
            { interestRequestBy: user, interestRequestTo: shortlistedUserId },
            { isShortListedBy: true }
          ),
        ]);
      }
    } catch (error) {
      console.error("Error adding user to shortlist:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  };

  

exports.getShortlistedUser = async (req, res) => {
    try {
      const { UserId } = req.params;
      const users = await ShortList.find({ user: UserId }).populate({
        path: "shortlistedUser",
        select: ListData,
      });
      console.log(users);
      const user = JSON.parse(JSON.stringify(users));
  
      // Fetch additional data for users
      const communityIds = user.map(user => user.shortlistedUser.familyDetails[0]?.community);
      const professionIds = user.map(user => user.shortlistedUser.careerDetails[0]?.profession);
      const dietIds = user.map(user => user.shortlistedUser.additionalDetails[0]?.diet);
      const countryIds = user.map(user => user.shortlistedUser.additionalDetails[0]?.currentlyLivingInCountry);
      const stateIds = user.map(user => user.shortlistedUser.additionalDetails[0]?.currentlyLivingInState);
      const borncountryIds = user.map(user => user.shortlistedUser.basicDetails[0]?.placeOfBirthCountry);
      const bornstateIds = user.map(user => user.shortlistedUser.basicDetails[0]?.placeOfBirthState);
      const cityIds = user.map(user => user.shortlistedUser.additionalDetails[0]?.currentlyLivingInCity);
  
      const [communities, professions, diets, countries, bornCoutnry, bornState, states, cities, shortlistedUsers, profileRequests, interestRequests] = await Promise.all([
        Community.find({ community_id: { $in: communityIds } }),
        Proffesion.find({ proffesion_id: { $in: professionIds } }),
        Diet.find({ diet_id: { $in: dietIds } }),
        Country.find({ country_id: { $in: countryIds } }),
        Country.find({ country_id: { $in: borncountryIds } }),
        State.find({ state_id: { $in: bornstateIds } }),
        State.find({ state_id: { $in: stateIds } }),
        City.find({ city_id: { $in: cityIds } }),
        ShortList.find({ user: UserId }),
        ProfileRequests.find({ profileRequestBy: UserId }),
        InterestRequests.find({ interestRequestBy: UserId })
      ]);
  
      const promises = user.map(async (user) => {
        const userIdString = String(user.shortlistedUser._id);
        const profileUrl = await getSignedUrlFromS3(user.shortlistedUser.selfDetails[0]?.profilePicture || "");
        user.shortlistedUser.selfDetails[0].profilePictureUrl = profileUrl || "";
      
        if (user.shortlistedUser.familyDetails && user.shortlistedUser.familyDetails[0]?.community) {
          const communityData = communities.find(community => community.community_id === user.shortlistedUser.familyDetails[0]?.community);
          user.shortlistedUser.familyDetails[0].communityName = communityData?.community_name || "";
        }
        if (user.shortlistedUser.careerDetails && user.shortlistedUser.careerDetails[0]?.profession) {
          const professionData = professions.find(profession => profession.proffesion_id === user.shortlistedUser.careerDetails[0]?.profession);
          user.shortlistedUser.careerDetails[0].professionName = professionData?.proffesion_name || "";
        }
        if (user.shortlistedUser.additionalDetails && user.shortlistedUser.additionalDetails[0]?.diet) {
          const dietData = diets.find(diet => diet.diet_id === user.shortlistedUser.additionalDetails[0]?.diet);
          user.shortlistedUser.additionalDetails[0].dietName = dietData?.diet_name || "";
        }
        if (user.shortlistedUser.additionalDetails && user.shortlistedUser.additionalDetails[0]?.currentlyLivingInCountry) {
          const countryData = countries.find(country => country.country_id === user.shortlistedUser.additionalDetails[0]?.currentlyLivingInCountry);
          user.shortlistedUser.additionalDetails[0].currentCountryName = countryData?.country_name || "";
          if (user.shortlistedUser.additionalDetails[0]?.currentlyLivingInState) {
            const stateData = states.find(state => state.state_id === user.shortlistedUser.additionalDetails[0]?.currentlyLivingInState);
            user.shortlistedUser.additionalDetails[0].currentStateName = stateData?.state_name || "";
            if (user.shortlistedUser.additionalDetails[0]?.currentlyLivingInCity) {
              const cityData = cities.find(city => city.city_id === user.shortlistedUser.additionalDetails[0]?.currentlyLivingInCity);
              user.shortlistedUser.additionalDetails[0].currentCityName = cityData?.city_name || "";
            }
          }
        }
        if (user.shortlistedUser.basicDetails && user.shortlistedUser.basicDetails[0]?.placeOfBirthCountry) {
          const countryData = bornCoutnry.find(country => country.country_id === user.shortlistedUser.basicDetails[0]?.placeOfBirthCountry);
          user.shortlistedUser.basicDetails[0].currentCountryName = countryData?.country_name || "";
          if (user.shortlistedUser.basicDetails[0]?.placeOfBirthState) {
            const stateData = bornState.find(state => state.state_id === user.shortlistedUser.basicDetails[0]?.placeOfBirthState);
            user.shortlistedUser.basicDetails[0].currentStateName = stateData?.state_name || "";
          }
        }
  
        // Check if there is a profile request to this user
        user.isProfileRequest = profileRequests.some(data => String(data.profileRequestTo) === userIdString);
  
        // Check if there is an interest request to this user
        user.isInterestRequest = interestRequests.some(data => String(data.interestRequestTo) === userIdString);
      });
      
      await Promise.all(promises);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.status(200).json(user);
    } catch (error) {
      console.error("Error fetching shortlisted user:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  };