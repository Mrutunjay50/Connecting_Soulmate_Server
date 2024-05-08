const mongoose = require("mongoose");
const { ObjectId } = mongoose.Types;
exports.getAggregationPipelineForUsers = (userId) => {
      return [
        {
          $match: { _id: new ObjectId(userId) },
        },
        {
          $lookup: {
            from: "cities", // name of the City collection
            localField: "basicDetails.placeOfBirthCity",
            foreignField: "city_id",
            as: "citybtype",
          },
        },
        {
          $lookup: {
            from: "states", // name of the State collection
            localField: "basicDetails.placeOfBirthState",
            foreignField: "state_id",
            as: "statebtype",
          },
        },
        {
          $lookup: {
            from: "countries", // name of the Country collection
            localField: "basicDetails.placeOfBirthCountry",
            foreignField: "country_id",
            as: "countrybtype",
          },
        },
        {
            $lookup: {
              from: "cities", // name of the City collection
              localField: "additionalDetails.currentlyLivingInCity",
              foreignField: "city_id",
              as: "cityatype",
            },
          },
          {
            $lookup: {
              from: "states", // name of the State collection
              localField: "additionalDetails.currentlyLivingInState",
              foreignField: "state_id",
              as: "stateatype",
            },
          },
          {
            $lookup: {
              from: "countries", // name of the Country collection
              localField: "additionalDetails.currentlyLivingInCountry",
              foreignField: "country_id",
              as: "countryatype",
            },
          },
          {
            $lookup: {
              from: "diets", // name of the Country collection
              localField: "additionalDetails.diet",
              foreignField: "diet_id",
              as: "dietatype",
            },
          },
          {
            $lookup: {
              from: "proffesions", // name of the Country collection
              localField: "careerDetails.profession",
              foreignField: "proffesion_id",
              as: "professionctype",
            },
          },
          {
            $lookup: {
              from: "educations", // name of the Country collection
              localField: "careerDetails.highestEducation",
              foreignField: "education_id",
              as: "educationctype",
            },
          },
          {
            $lookup: {
              from: "cities", // name of the City collection
              localField: "familyDetails.familyLocationCity",
              foreignField: "city_id",
              as: "cityftype",
            },
          },
          {
            $lookup: {
              from: "states", // name of the State collection
              localField: "familyDetails.familyLocationState",
              foreignField: "state_id",
              as: "stateftype",
            },
          },
          {
            $lookup: {
              from: "countries", // name of the Country collection
              localField: "familyDetails.familyLocationCountry",
              foreignField: "country_id",
              as: "countryftype",
            },
          },
          {
            $lookup: {
              from: "religions", // name of the Country collection
              localField: "familyDetails.religion",
              foreignField: "religion_id",
              as: "religionftype",
            },
          },
          {
            $lookup: {
              from: "communities", // name of the Country collection
              localField: "familyDetails.community",
              foreignField: "community_id",
              as: "communityftype",
            },
          },
          {
            $lookup: {
              from: "fitnesses", // name of the City collection
              localField: "selfDetails.fitness",
              foreignField: "fitness_id",
              as: "fitnessstype",
            },
          },
          {
            $lookup: {
              from: "funactivities", // name of the State collection
              localField: "selfDetails.fun",
              foreignField: "funActivity_id",
              as: "funactivitystype",
            },
          },
          {
            $lookup: {
              from: "interests", // name of the Country collection
              localField: "selfDetails.interests",
              foreignField: "interest_id",
              as: "intereststype",
            },
          },
          {
            $lookup: {
              from: "others", // name of the Country collection
              localField: "selfDetails.other",
              foreignField: "other_id",
              as: "otherstype",
            },
          },
          {
            $project: {
              _id: 1,
              userId: 1,
              gender : 1,
              lastLogin : 1,
              registrationPage : 1,
              registrationPhase : 1,
              accessType : 1,
              annualIncomeType : 1,
              category : 1,
              isDeleted : 1,
              createdBy : 1,
              partnerPreference : 1,
              basicDetails: {
                $mergeObjects: [
                  { $arrayElemAt: ["$basicDetails", 0] },
                  {
                    countrybtype: {
                      $arrayElemAt: ["$countrybtype.country_name", 0],
                    },
                    statebtype: { $arrayElemAt: ["$statebtype.state_name", 0] },
                    citybtype: { $arrayElemAt: ["$citybtype.city_name", 0] },
                  },
                ],
              },
              additionalDetails: {
                $mergeObjects: [
                  { $arrayElemAt: ["$additionalDetails", 0] },
                  {
                    countryatype: {
                      $arrayElemAt: ["$countryatype.country_name", 0],
                    },
                    stateatype: { $arrayElemAt: ["$stateatype.state_name", 0] },
                    cityatype: { $arrayElemAt: ["$cityatype.city_name", 0] },
                    dietatype: { $arrayElemAt: ["$dietatype.diet_name", 0] },
                  },
                ],
              },
              careerDetails: {
                $mergeObjects: [
                  { $arrayElemAt: ["$careerDetails", 0] },
                  {
                    professionctype: {
                      $arrayElemAt: ["$professionctype.proffesion_name", 0],
                    },
                    educationctype: {
                      $arrayElemAt: ["$educationctype.education_name", 0],
                    },
                  },
                ],
              },
              familyDetails: {
                $mergeObjects: [
                  { $arrayElemAt: ["$familyDetails", 0] },
                  {
                    countryftype: {
                      $arrayElemAt: ["$countryftype.country_name", 0],
                    },
                    stateftype: { $arrayElemAt: ["$stateftype.state_name", 0] },
                    cityftype: { $arrayElemAt: ["$cityftype.city_name", 0] },
                    religionftype: {
                      $arrayElemAt: ["$religionftype.religion_name", 0],
                    },
                    communityftype: {
                      $arrayElemAt: ["$communityftype.community_name", 0],
                    },
                  },
                ],
              },
              selfDetails: {
                $mergeObjects: [
                  { $arrayElemAt: ["$selfDetails", 0] },
                  {
                    fitnessstype: {
                      $arrayElemAt: ["$fitnessstype.fitness_name", 0],
                    },
                    funactivitystype: {
                      $arrayElemAt: ["$funactivitystype.funActivity_name", 0],
                    },
                    intereststype: {
                      $arrayElemAt: ["$intereststype.interest_name", 0],
                    },
                    otherstype: { $arrayElemAt: ["$otherstype.other_name", 0] },
                  },
                ],
              },
            },
          },
      ];
};
