const User = require("../models/Users");
const { getFilteredProfiles } = require("../helper/RegistrationHelper/getFilteredUsers");

exports.searchById = async (req, res) => {
  try {
    const { userId } = req.params;
    const { category, gender, userIds } = req.query;

    if (!userId) {
      return res.status(400).json({ error: "userId is required" });
    }

    if (gender !== "M" && gender !== "F") {
      return res.status(400).json({ error: "Invalid gender" });
    }
    // Construct the query with userId, gender, and category condition
    const user = await User.findOne({
      userId : userIds,
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    const filters = {
      category: category === "" ? { $exists: true } : { $in: [category, ""] },
      userId: userIds
    };

    await getFilteredProfiles(req, res, filters, "findOne");
  } catch (error) {
    console.error("Error searching user by ID:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.advanceSearch = async (req, res) => {
  try {
    const searchParams = req.body;
    const orQueries = []; // Array to store individual OR queries

    // Define mapping between search parameters and MongoDB fields
    const fieldMap = {
      country: "basicDetails.placeOfBirthCountry",
      state: "basicDetails.placeOfBirthState",
      maritalStatus: "additionalDetails.maritalStatus",
      education: "careerDetails.highestEducation",
      smoking: "additionalDetails.smoking",
      profession: "careerDetails.profession",
      community: "familyDetails.community",
      interests: "selfDetails.interests",
      dietType: "additionalDetails.diet",
      ageRangeStart: {
        field: "basicDetails.age",
        startField: "start",
      },
      ageRangeEnd: {
        field: "basicDetails.age",
        endField: "end",
      },
      heightRangeStart: {
        field: "additionalDetails.height",
        startField: "start",
      },
      heightRangeEnd: {
        field: "additionalDetails.height",
        endField: "end",
      },
      annualIncomeRangeStart: {
        field: "careerDetails.annualIncomeValue",
        startField: "start",
      },
      annualIncomeRangeEnd: {
        field: "careerDetails.annualIncomeValue",
        endField: "end",
      },
    };

    // Iterate through search parameters and add them to the OR queries array
    for (const [param, value] of Object.entries(searchParams)) {
      const field = fieldMap[param];
      if (field) {
        // Exclude empty strings from the query
        if (
          (typeof value === "string" && (value.trim() === "" || isNaN(value.trim()))) ||
          (Array.isArray(value) && value.length === 0)
        ) {
          continue;
        }
        if (param === "ageRangeStart" || param === "heightRangeStart" || param === "annualIncomeRangeStart") {
          const { field: mainField, startField } = field;
          orQueries.push({ [`${mainField}.${startField}`]: { $gte: value } });
        } else if (param === "ageRangeEnd" || param === "heightRangeEnd" || param === "annualIncomeRangeEnd") {
          const { field: mainField, endField } = field;
          orQueries.push({ [`${mainField}.${endField}`]: { $lte: value } });
        } else if (value === "opentoall") {
          // Handle the special case where the parameter value is "opentoall"
          orQueries.push({ [field]: { $exists: true } });
        } else if (typeof field === "string") {
          orQueries.push({ [field]: Array.isArray(value) ? { $in: value } : value });
        }
      }
    }

    // Construct the final query with OR conditions
    const query = { $or: orQueries };

    // Execute the query
    const filters = { ...query };
    await getFilteredProfiles(req, res, filters);
  } catch (error) {
    console.error("Error searching users:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};



// exports.advanceSearch = async (req, res) => {
//   try {
//     const searchParams = req.body;
//     const page = parseInt(req.query.page) || 1;
//     const limit = parseInt(req.query.limit) || 10;
//     const skip = (page - 1) * limit;
//     const { gender } = req.params;
//     const queryGender = gender === "F" ? "M" : "F";

//     // Define mapping between search parameters and MongoDB fields
//     const fieldMap = {
//       gender: "gender",
//       marital: "additionalDetails.maritalStatus",
//       country: "basicDetails.placeOfBirthCountry",
//       state: "basicDetails.placeOfBirthState",
//       city: "basicDetails.placeOfBirthCity",
//       profession: "careerDetails.profession",
//       manglik: "basicDetails.manglik",
//       education: "careerDetails.highestEducation",
//       community: "familyDetails.community",
//       interest: "selfDetails.interests",
//       smoking: "additionalDetails.smoking",
//       drinking: "additionalDetails.alcohol",
//       diet: "additionalDetails.diet",
//       category: "category",
//       agerange: {
//         field: "basicDetails.age",
//         startField: "start",
//         endField: "end",
//       },
//       heightrange: {
//         field: "additionalDetails.height",
//         startField: "start",
//         endField: "end",
//       },
//       annualincome: {
//         field: "careerDetails.annualIncomeValue",
//         startField: "start",
//         endField: "end",
//       },
//     };

//     // Construct the query
//     const query = {
//       gender: queryGender,
//     };

//     // Define an array to hold individual conditions
//     const conditions = [];

//     // Iterate through search parameters and add them to the conditions array
//     for (const [param, value] of Object.entries(searchParams)) {
//       const field = fieldMap[param];
//       if (field) {
//         // Exclude empty strings from the query
//         if (typeof value === "string" && value.trim() === "") {
//           continue;
//         }
//         if (param === "category") {
//           conditions.push({ [field]: { $in: [value, new RegExp(`^${value}$`, "i")] } });
//         } else if (typeof field === "string") {
//           // If the value is a comma-separated string, split it into an array
//           if (param !== "gender" && param !== "agerange" && param !== "heightrange" && param !== "annualincome" && value.includes(",")) {
//             const options = value.split(",").map((option) => option.trim());
//             conditions.push({ [field]: { $in: options } });
//           } else {
//             conditions.push({ [field]: value });
//           }
//         } else {
//           const { field: mainField, startField, endField } = field;
//           conditions.push({
//             [mainField]: {
//               $gte: value[startField],
//               $lte: value[endField],
//             },
//           });
//         }
//       }
//     }

//     // Combine all conditions with $and operator
//     if (conditions.length > 0) {
//       query["$and"] = conditions;
//     }

//     // Execute the query
//     const users = await User.find(query)
//       .skip(skip)
//       .limit(limit)
//       .select(ListData);
//     return res.status(200).json({ users });
//   } catch (error) {
//     console.error("Error searching users:", error);
//     return res.status(500).json({ error: "Internal Server Error" });
//   }
// };
