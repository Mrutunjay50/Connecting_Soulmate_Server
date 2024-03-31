const User = require("../models/Users");

exports.getMatchesAccordingToPreference = async (req, res) => {
  try {
    const {
      ageRange,
      heightRange,
      annualIncomeRange,
      maritalStatus,
      community,
      caste,
      country,
      state,
      city,
      education,
      workingpreference,
      dietType,
    } = req.body;

    const [minAge, maxAge] = ageRange.split("-").map(Number);
    const [minHeight, maxHeight] = heightRange.split("-").map(Number);
    const [minIncome, maxIncome] = annualIncomeRange.split("-").map(Number);

    const filterConditions = [
      { "basicDetails.age": { $gt: minAge, $lte: maxAge } },
      { "additionalDetails.height": { $gt: minHeight, $lte: maxHeight } },
      {
        "carrierDetails.annualIncomeValue": {
          $gt: minIncome,
          $lte: maxIncome,
        },
      },
      { "additionalDetails.maritalStatus": maritalStatus },
      { "familyDetails.community": community },
      { "familyDetails.caste": caste },
      { "additionalDetails.currentlyLivingInCountry": country },
      { "carrierDetails.highestEducation": education },
      { "carrierDetails.profession": workingpreference },
      { "additionalDetails.diet": dietType },
    ];

    if (country && state && city) {
      filterConditions.push({
        $and: [
          { "additionalDetails.currentlyLivingInCountry": country },
          { "additionalDetails.currentlyLivingInState": state },
          { "additionalDetails.currentlyLivingInCity": city },
        ],
      });
    } else if (country && state) {
      filterConditions.push({
        $and: [
          { "additionalDetails.currentlyLivingInCountry": country },
          { "additionalDetails.currentlyLivingInState": state },
        ],
      });
    } else if (country) {
      filterConditions.push({
        "additionalDetails.currentlyLivingInCountry": country,
      });
    }

    const filteredUsers = await User.find({ $and: filterConditions });

    res.status(200).json({ success: true, data: filteredUsers });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
};

exports.getMatchesNewlyJoined = async (req, res) => {};

exports.getMatchesShortedByU = async (req, res) => {
  const { userId } = req.params;
  const { matchId } = req.body;
};
