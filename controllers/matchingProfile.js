const User = require("../models/Users");
const Matches = require("../models/matches");
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

exports.getMatchesNewlyJoined = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 2;
    const skip = (page - 1) * limit;

    // Fetch users in descending order of creation date
    const users = await User.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.status(200).json({ users });
  } catch (error) {
    console.error("Error retrieving newly joined users:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find();
    res.status(200).json({ users });
  } catch (error) {
    console.error("Error retrieving users:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.getShortlistedUsers = async (req, res) => {
  try {
    const shortlistedUsers = await Matches.find().populate(
      "matchedBy matchedTo"
    );
    res.status(200).json({ shortlistedUsers });
  } catch (error) {
    console.error("Error retrieving shortlisted users:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.sendMatchRequest = async (senderId, recipientId) => {
  try {
    const matchRequest = new Matches({
      matchedBy: senderId,
      matchedTo: recipientId,
      status: "pending",
    });
    await matchRequest.save();
    return matchRequest;
  } catch (error) {
    console.error("Error sending match request:", error);
    throw new Error("Failed to send match request");
  }
};

// Function to respond to a match request
exports.respondToMatchRequest = async (matchRequestId, response) => {
  try {
    await Matches.findByIdAndUpdate(matchRequestId, { status: response });
  } catch (error) {
    console.error("Error responding to match request:", error);
    throw new Error("Failed to respond to match request");
  }
};

// module.exports = {
//   sendMatchRequest,
//   respondToMatchRequest
// };
