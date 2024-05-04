const mongoose = require("mongoose");
const { ObjectId } = mongoose.Types;
exports.getUserAggregationPipeline = (userId, page) => {
  switch (page) {
    case "1":
      return [
        {
          $match: { _id: new ObjectId(userId) },
        },
        {
          $lookup: {
            from: "cities", // name of the City collection
            localField: "basicDetails.placeOfBirthCity",
            foreignField: "city_id",
            as: "citytype",
          },
        },
        {
          $lookup: {
            from: "states", // name of the State collection
            localField: "basicDetails.placeOfBirthState",
            foreignField: "state_id",
            as: "statetype",
          },
        },
        {
          $lookup: {
            from: "countries", // name of the Country collection
            localField: "basicDetails.placeOfBirthCountry",
            foreignField: "country_id",
            as: "countrytype",
          },
        },
        {
          $project: {
            _id: 1,
            userId: 1,
            basicDetails: {
              $mergeObjects: [
                { $arrayElemAt: ["$basicDetails", 0] },
                {
                  countrytype: {
                    $arrayElemAt: ["$countrytype.country_name", 0],
                  },
                  statetype: { $arrayElemAt: ["$statetype.state_name", 0] },
                  citytype: { $arrayElemAt: ["$citytype.city_name", 0] },
                },
              ],
            },
          },
        },
      ];
    case "2":
      return [
        {
          $match: { _id: new ObjectId(userId) },
        },
        {
          $lookup: {
            from: "cities", // name of the City collection
            localField: "additionalDetails.currentlyLivingInCity",
            foreignField: "city_id",
            as: "citytype",
          },
        },
        {
          $lookup: {
            from: "states", // name of the State collection
            localField: "additionalDetails.currentlyLivingInState",
            foreignField: "state_id",
            as: "statetype",
          },
        },
        {
          $lookup: {
            from: "countries", // name of the Country collection
            localField: "additionalDetails.currentlyLivingInCountry",
            foreignField: "country_id",
            as: "countrytype",
          },
        },
        {
          $lookup: {
            from: "diets", // name of the Country collection
            localField: "additionalDetails.diet",
            foreignField: "diet_id",
            as: "diettype",
          },
        },
        {
          $project: {
            _id: 1,
            userId: 1,
            additionalDetails: {
              $mergeObjects: [
                { $arrayElemAt: ["$additionalDetails", 0] },
                {
                  countrytype: {
                    $arrayElemAt: ["$countrytype.country_name", 0],
                  },
                  statetype: { $arrayElemAt: ["$statetype.state_name", 0] },
                  citytype: { $arrayElemAt: ["$citytype.city_name", 0] },
                  diettype: { $arrayElemAt: ["$diettype.diet_name", 0] },
                },
              ],
            },
          },
        },
      ];
    case "3":
      return [
        {
          $match: { _id: new ObjectId(userId) },
        },
        {
          $lookup: {
            from: "proffesions", // name of the Country collection
            localField: "careerDetails.profession",
            foreignField: "proffesion_id",
            as: "professiontype",
          },
        },
        {
          $lookup: {
            from: "educations", // name of the Country collection
            localField: "careerDetails.highestEducation",
            foreignField: "education_id",
            as: "educationtype",
          },
        },
        {
          $project: {
            _id: 1,
            userId: 1,
            careerDetails: {
              $mergeObjects: [
                { $arrayElemAt: ["$careerDetails", 0] },
                {
                  professiontype: {
                    $arrayElemAt: ["$professiontype.proffesion_name", 0],
                  },
                  educationtype: {
                    $arrayElemAt: ["$educationtype.education_name", 0],
                  },
                },
              ],
            },
          },
        },
      ];
    case "4":
      return [
        {
          $match: { _id: new ObjectId(userId) },
        },
        {
          $lookup: {
            from: "cities", // name of the City collection
            localField: "familyDetails.familyLocationCity",
            foreignField: "city_id",
            as: "citytype",
          },
        },
        {
          $lookup: {
            from: "states", // name of the State collection
            localField: "familyDetails.familyLocationState",
            foreignField: "state_id",
            as: "statetype",
          },
        },
        {
          $lookup: {
            from: "countries", // name of the Country collection
            localField: "familyDetails.familyLocationCountry",
            foreignField: "country_id",
            as: "countrytype",
          },
        },
        {
          $lookup: {
            from: "religions", // name of the Country collection
            localField: "familyDetails.religion",
            foreignField: "religion_id",
            as: "religiontype",
          },
        },
        {
          $lookup: {
            from: "communities", // name of the Country collection
            localField: "familyDetails.community",
            foreignField: "community_id",
            as: "communitytype",
          },
        },
        {
          $project: {
            _id: 1,
            userId: 1,
            familyDetails: {
              $mergeObjects: [
                { $arrayElemAt: ["$familyDetails", 0] },
                {
                  countrytype: {
                    $arrayElemAt: ["$countrytype.country_name", 0],
                  },
                  statetype: { $arrayElemAt: ["$statetype.state_name", 0] },
                  citytype: { $arrayElemAt: ["$citytype.city_name", 0] },
                  religiontype: {
                    $arrayElemAt: ["$religiontype.religion_name", 0],
                  },
                  communitytype: {
                    $arrayElemAt: ["$communitytype.community_name", 0],
                  },
                },
              ],
            },
          },
        },
      ];
    case "5":
      return [
        {
          $match: { _id: new ObjectId(userId) },
        },
        {
          $lookup: {
            from: "fitnesses", // name of the City collection
            localField: "selfDetails.fitness",
            foreignField: "fitness_id",
            as: "fitnesstype",
          },
        },
        {
          $lookup: {
            from: "funactivities", // name of the State collection
            localField: "selfDetails.fun",
            foreignField: "funActivity_id",
            as: "funactivitytype",
          },
        },
        {
          $lookup: {
            from: "interests", // name of the Country collection
            localField: "selfDetails.interests",
            foreignField: "interest_id",
            as: "interesttype",
          },
        },
        {
          $lookup: {
            from: "others", // name of the Country collection
            localField: "selfDetails.other",
            foreignField: "other_id",
            as: "othertype",
          },
        },
        {
          $project: {
            _id: 1,
            userId: 1,
            selfDetails: {
              $mergeObjects: [
                { $arrayElemAt: ["$selfDetails", 0] },
                {
                  fitnesstype: {
                    $arrayElemAt: ["$fitnesstype.fitness_name", 0],
                  },
                  funactivitytype: {
                    $arrayElemAt: ["$funactivitytype.funActivity_name", 0],
                  },
                  interesttype: {
                    $arrayElemAt: ["$interesttype.interest_name", 0],
                  },
                  othertype: { $arrayElemAt: ["$othertype.other_name", 0] },
                },
              ],
            },
          },
        },
      ];
    case "6":
      return [
        {
          $match: { _id: new ObjectId(userId) },
        },
        {
          $lookup: {
            from: "cities", // name of the City collection
            localField: "partnerPreference.city",
            foreignField: "city_id",
            as: "citytype",
          },
        },
        {
          $lookup: {
            from: "states", // name of the State collection
            localField: "partnerPreference.state",
            foreignField: "state_id",
            as: "statetype",
          },
        },
        {
          $lookup: {
            from: "countries", // name of the Country collection
            localField: "partnerPreference.country",
            foreignField: "country_id",
            as: "countrytype",
          },
        },
        {
          $lookup: {
            from: "proffesions", // name of the Country collection
            localField: "partnerPreference.profession",
            foreignField: "proffesion_id",
            as: "professiontype",
          },
        },
        {
          $project: {
            _id: 1,
            userId: 1,
            partnerPreference: {
              $mergeObjects: [
                { $arrayElemAt: ["$partnerPreference", 0] },
                {
                  countrytype: {
                    $arrayElemAt: ["$countrytype.country_name", 0],
                  },
                  statetype: { $arrayElemAt: ["$statetype.state_name", 0] },
                  citytype: { $arrayElemAt: ["$citytype.city_name", 0] },
                  professiontype: {
                    $arrayElemAt: ["$professiontype.proffesion_name", 0],
                  },
                },
              ],
            },
          },
        },
      ];
    // Add cases for other pages if needed
    default:
      return null;
  }
};
