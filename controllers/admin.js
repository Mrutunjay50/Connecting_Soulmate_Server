const fs = require("fs");
const fastcsv = require("fast-csv");
const {
  getAggregationPipelineForUsers,
} = require("../helper/AggregationOfUserData/aggregationPipelineForUsers");
const { generateUserPDFForAdmin } = require("../helper/generatePDF");
const { processUserDetails } = require("../helper/RegistrationHelper/processInterestDetails");
const User = require("../models/Users");
const { sendReviewEmail, sendApprovalEmail, sendRejectionEmail } = require("../helper/emailGenerator/emailHelper");


exports.updateRegistrationPhase = async (req, res) => {
  try {
    const { registrationPhase } = req.body;
    console.log(registrationPhase);
    const { userId } = req.params;
    let user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (registrationPhase === "approved") {
      user.registrationPhase = registrationPhase;
      user.registrationPage = "";
      await sendApprovalEmail(user.additionalDetails[0].email);
    } else {
      user.registrationPhase = "deleted";
      user.category = "";
      user.registrationPage = "";
      await sendRejectionEmail(user.additionalDetails[0].email);
    }


    user = await user.save();

    res.status(200).json({
      message: `registration phase ${user.registrationPhase} updated successfully`,
      user,
    });
  } catch (error) {
    console.error("Error updating category and registration phase:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.reviewRequest = async (req, res) => {
  try {
    const { reviewReason } = req.body;
    const { userId } = req.params;

    // Find the user by userId
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    user.registrationPhase = "rejected"
    user.reviewReason = reviewReason;
    user.registrationPage = "1"
    // Save the updated user
    await user.save();
    await sendReviewEmail(user.additionalDetails[0].email, reviewReason?.split(","));

    res.status(200).json({ message: "Profile resent for approval successfully" });
  } catch (error) {
    console.error("Error deleting profile:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};



exports.updateUserCategory = async (req, res) => {
  try {
    const { categoryType } = req.body;
    console.log(categoryType);
    const { userId } = req.params;
    let user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    let categories = user.category.split(',').filter(Boolean); // Split and filter out empty strings

    if (categories.includes(categoryType)) {
      // Remove the category if it already exists
      categories = categories.filter(cat => cat !== categoryType);
    } else {
      // Add the category if it doesn't exist
      categories.push(categoryType);
    }

    user.category = categories.join(',');

    user = await user.save();

    res.status(200).json({
      message: `Category updated successfully for user ${user?.basicDetails[0]?.name}`,
      user,
    });
  } catch (error) {
    console.error("Error updating category and registration phase:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.softDeleteUser = async (req, res) => {
  try {
    const { userId } = req.params;
    let user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    user.isDeleted = true;
    user = await user.save();

    res.status(200).json({
      message: `user ${user?.basicDetails[0]?.name} deleted successfully`,
      user,
    });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// exports.getUserStatisticsForAdmin = async (req, res) => {
//   try {
//     const currentDate = new Date();
//     const pastDate = new Date();
//     pastDate.setDate(currentDate.getDate() - 15);
    
//     const totalUsers = await User.countDocuments({});
//     const totalMaleUsers = await User.countDocuments({ gender: 'M' });
//     const totalFemaleUsers = await User.countDocuments({ gender: 'F' });
//     const totalUsersCategoryA = await User.countDocuments({ category: /A/ });
//     const totalUsersCategoryB = await User.countDocuments({ category: /B/ });
//     const totalUsersCategoryC = await User.countDocuments({ category: /C/ });
//     const totalUsersUnCategorised = await User.countDocuments({ category: "" });
//     const totalActiveUsers = await User.countDocuments({ lastLogin: { $gte: pastDate } });
//     console.log("fkjghkjdfbgkjdfhgkjdfkjdhfvkj");
//     console.timeEnd('getUserStatisticsForAdmin'); // End timing
//     console.log("fkjghkjdfbgkjdfhgkjdfkjdhfvkj");
//     res.status(200).json({
//       totalUsers,
//       totalMaleUsers,
//       totalFemaleUsers,
//       totalUsersCategoryA,
//       totalUsersCategoryB,
//       totalUsersCategoryC,
//       totalUsersUnCategorised,
//       totalActiveUsers,
//     });
//   } catch (error) {
//     console.error("Error fetching user statistics:", error);
//     res.status(500).json({ error: "Internal Server Error" });
//   }
// };


// with aggregation just testing whether this is faster or the above
exports.getUserStatisticsForAdmin = async (req, res) => {
  try {
    const currentDate = new Date();
    const pastDate = new Date();
    pastDate.setDate(currentDate.getDate() - 15);

    // console.log("----------------");
    // console.time('getUserStatisticsForAdmin'); // Start timing
    // console.log("----------------");

    const statistics = await User.aggregate([
      {
        $facet: {
          totalUsers: [{ $count: "count" }],
          totalMaleUsers: [{ $match: { gender: 'M' } }, { $count: "count" }],
          totalFemaleUsers: [{ $match: { gender: 'F' } }, { $count: "count" }],
          totalUsersCategoryA: [{ $match: { category: /A/ } }, { $count: "count" }],
          totalUsersCategoryB: [{ $match: { category: /B/ } }, { $count: "count" }],
          totalUsersCategoryC: [{ $match: { category: /C/ } }, { $count: "count" }],
          totalUsersUnCategorised: [{ $match: { category: "" } }, { $count: "count" }],
          totalActiveUsers: [{ $match: { lastLogin: { $gte: pastDate } } }, { $count: "count" }],
        }
      },
      {
        $project: {
          totalUsers: { $arrayElemAt: ["$totalUsers.count", 0] },
          totalMaleUsers: { $arrayElemAt: ["$totalMaleUsers.count", 0] },
          totalFemaleUsers: { $arrayElemAt: ["$totalFemaleUsers.count", 0] },
          totalUsersCategoryA: { $arrayElemAt: ["$totalUsersCategoryA.count", 0] },
          totalUsersCategoryB: { $arrayElemAt: ["$totalUsersCategoryB.count", 0] },
          totalUsersCategoryC: { $arrayElemAt: ["$totalUsersCategoryC.count", 0] },
          totalUsersUnCategorised: { $arrayElemAt: ["$totalUsersUnCategorised.count", 0] },
          totalActiveUsers: { $arrayElemAt: ["$totalActiveUsers.count", 0] },
        }
      }
    ]);
    
    // console.log("----------------");
    // console.timeEnd('getUserStatisticsForAdmin'); // End timing
    // console.log("----------------");

    const stats = statistics[0];

    res.status(200).json({
      totalUsers: stats.totalUsers || 0,
      totalMaleUsers: stats.totalMaleUsers || 0,
      totalFemaleUsers: stats.totalFemaleUsers || 0,
      totalUsersCategoryA: stats.totalUsersCategoryA || 0,
      totalUsersCategoryB: stats.totalUsersCategoryB || 0,
      totalUsersCategoryC: stats.totalUsersCategoryC || 0,
      totalUsersUnCategorised: stats.totalUsersUnCategorised || 0,
      totalActiveUsers: stats.totalActiveUsers || 0,
    });
  } catch (error) {
    console.error("Error fetching user statistics:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};


exports.downloadAllUsersAsCSV = async (req, res) => {
  try {
    const users = await User.find();

    // Create a writable stream and write headers to the CSV file
    const csvStream = fastcsv.format({ headers: true });
    const writableStream = fs.createWriteStream("users.csv");
    csvStream.pipe(writableStream);

    // Write each user's data to the CSV file
    users.forEach((user) => {
      const basicDetails = user.basicDetails[0] || {};
      const additionalDetails = user.additionalDetails[0] || {};
      const careerDetails = user.careerDetails[0] || {};
      const familyDetails = user.familyDetails[0] || {};
      const selfDetails = user.selfDetails[0] || {};
      const partnerPreference = user.partnerPreference[0] || {};

      csvStream.write({
        Name: basicDetails.name || "",
        Gender: basicDetails.gender || "",
        "Place of Birth (Country)": basicDetails.placeOfBirthCountry || "",
        "Place of Birth (State)": basicDetails.placeOfBirthState || "",
        "Place of Birth (City)": basicDetails.placeOfBirthCity || "",
        "Date of Birth": basicDetails.dateOfBirth || "",
        "Time of Birth": basicDetails.timeOfBirth || "",
        Age: basicDetails.age || "",
        Manglik: basicDetails.manglik || "",
        Horoscope: basicDetails.horoscope || "",
        Height: additionalDetails.height || "",
        Weight: additionalDetails.weight || "",
        Email: additionalDetails.email || "",
        Contact: additionalDetails.contact || "",
        "Personal Appearance": additionalDetails.personalAppearance || "",
        "Currently Living In (Country)":
          additionalDetails.currentlyLivingInCountry || "",
        "Currently Living In (State)":
          additionalDetails.currentlyLivingInState || "",
        "Currently Living In (City)":
          additionalDetails.currentlyLivingInCity || "",
        "Country Code": additionalDetails.countryCode || "",
        "Relocation in Future": additionalDetails.relocationInFuture || "",
        Diet: additionalDetails.diet || "",
        Alcohol: additionalDetails.alcohol || "",
        Smoking: additionalDetails.smoking || "",
        "Marital Status": additionalDetails.maritalStatus || "",
        "Highest Education": careerDetails.highestEducation || "",
        "Highest Qualification": careerDetails.highestQualification || "",
        "School/University": careerDetails["school/university"] || "",
        "Passing Year": careerDetails.passingYear || "",
        Profession: careerDetails.profession || "",
        "Current Designation": careerDetails.currentDesignation || "",
        "Previous Occupation": careerDetails.previousOccupation || "",
        "Annual Income Value": careerDetails.annualIncomeValue || "",
        "Father's Name": familyDetails.fatherName || "",
        "Father's Occupation": familyDetails.fatherOccupation || "",
        "Mother's Name": familyDetails.motherName || "",
        "Mother's Occupation": familyDetails.motherOccupation || "",
        Siblings: familyDetails.siblings || "",
        "With Family Status": familyDetails.withFamilyStatus || "",
        "Family Location (Country)": familyDetails.familyLocationCountry || "",
        "Family Location (State)": familyDetails.familyLocationState || "",
        "Family Location (City)": familyDetails.familyLocationCity || "",
        Religion: familyDetails.religion || "",
        Caste: familyDetails.caste || "",
        Community: familyDetails.community || "",
        "Family Annual Income": familyDetails.familyAnnualIncome || "",
        Interests: selfDetails.interests || "",
        Fun: selfDetails.fun || "",
        Fitness: selfDetails.fitness || "",
        Other: selfDetails.other || "",
        "Profile Picture": selfDetails.profilePicture || "",
        "User Photos": selfDetails.userPhotos || "",
        "User Photos URL": selfDetails.userPhotosUrl || "",
        "Profile Picture URL": selfDetails.profilePictureUrl || "",
        "About Yourself": selfDetails.aboutYourself || "",
        "WhatsApp Setting": user.whatsAppSetting || "",
        "Email Subscribe": user.emailSubscribe || "",
        "Partner Preference": JSON.stringify(partnerPreference) || "",
        Gender: user.gender || "",
        Category: user.category || "",
        "Registration Phase": user.registrationPhase || "",
        "Registration Page": user.registerationPage || "",
        "Annual Income Type": user.annualIncomeType || "",
      });
    });

    // End the writable stream
    csvStream.end();

    // Set response headers for file download
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=users.csv");

    // Send the CSV file as response
    fs.createReadStream("users.csv").pipe(res);
  } catch (error) {
    console.error("Error downloading users as CSV:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.downloadUserAsCSV = async (req, res) => {
  const userId = req.params.userId; // Assuming you're passing the userId in the request params

  try {
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Create a writable stream and write headers to the CSV file
    const csvStream = fastcsv.format({ headers: true });
    const writableStream = fs.createWriteStream("user.csv");
    csvStream.pipe(writableStream);

    // Write user's data to the CSV file
    const basicDetails = user.basicDetails[0] || {};
    const additionalDetails = user.additionalDetails[0] || {};
    const careerDetails = user.careerDetails[0] || {};
    const familyDetails = user.familyDetails[0] || {};
    const selfDetails = user.selfDetails[0] || {};
    const partnerPreference = user.partnerPreference[0] || {};

    csvStream.write({
      Name: basicDetails.name || "",
      Gender: basicDetails.gender || "",
      "Place of Birth (Country)": basicDetails.placeOfBirthCountry || "",
      "Place of Birth (State)": basicDetails.placeOfBirthState || "",
      "Place of Birth (City)": basicDetails.placeOfBirthCity || "",
      Height: additionalDetails.height || "",
      Weight: additionalDetails.weight || "",
      Email: additionalDetails.email || "",
      Contact: additionalDetails.contact || "",
      "Personal Appearance": additionalDetails.personalAppearance || "",
      "Currently Living In (Country)":
        additionalDetails.currentlyLivingInCountry || "",
      "Currently Living In (State)":
        additionalDetails.currentlyLivingInState || "",
      "Currently Living In (City)":
        additionalDetails.currentlyLivingInCity || "",
      "Country Code": additionalDetails.countryCode || "",
      "Relocation in Future": additionalDetails.relocationInFuture || "",
      Diet: additionalDetails.diet || "",
      Alcohol: additionalDetails.alcohol || "",
      Smoking: additionalDetails.smoking || "",
      "Marital Status": additionalDetails.maritalStatus || "",
      "Highest Education": careerDetails.highestEducation || "",
      "Highest Qualification": careerDetails.highestQualification || "",
      "School/University": careerDetails["school/university"] || "",
      "Passing Year": careerDetails.passingYear || "",
      Profession: careerDetails.profession || "",
      "Current Designation": careerDetails.currentDesignation || "",
      "Previous Occupation": careerDetails.previousOccupation || "",
      "Annual Income Value": careerDetails.annualIncomeValue || "",
      "Father's Name": familyDetails.fatherName || "",
      "Father's Occupation": familyDetails.fatherOccupation || "",
      "Mother's Name": familyDetails.motherName || "",
      "Mother's Occupation": familyDetails.motherOccupation || "",
      Siblings: familyDetails.siblings || "",
      "With Family Status": familyDetails.withFamilyStatus || "",
      "Family Location (Country)": familyDetails.familyLocationCountry || "",
      "Family Location (State)": familyDetails.familyLocationState || "",
      "Family Location (City)": familyDetails.familyLocationCity || "",
      Religion: familyDetails.religion || "",
      Caste: familyDetails.caste || "",
      Community: familyDetails.community || "",
      "Family Annual Income": familyDetails.familyAnnualIncome || "",
      Interests: selfDetails.interests || "",
      Fun: selfDetails.fun || "",
      Fitness: selfDetails.fitness || "",
      Other: selfDetails.other || "",
      "Profile Picture": selfDetails.profilePicture || "",
      "User Photos": selfDetails.userPhotos || "",
      "User Photos URL": selfDetails.userPhotosUrl || "",
      "Profile Picture URL": selfDetails.profilePictureUrl || "",
      "About Yourself": selfDetails.aboutYourself || "",
      "WhatsApp Setting": user.whatsAppSetting || "",
      "Email Subscribe": user.emailSubscribe || "",
      "Partner Preference": JSON.stringify(partnerPreference) || "",
      Gender: user.gender || "",
      Category: user.category || "",
      "Registration Phase": user.registrationPhase || "",
      "Registration Page": user.registerationPage || "",
      "Annual Income Type": user.annualIncomeType || "",
    });

    // End the writable stream
    csvStream.end();

    // Set response headers for file download
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=user.csv");

    // Send the CSV file as response
    fs.createReadStream("user.csv").pipe(res);
  } catch (error) {
    console.error("Error downloading user as CSV:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.getUserByIdForAdmin = async (req, res, next) => {
  try {
    const userData = await User.findById(req.params.userId);
    if (!userData) {
      const error = new Error("User not found.");
      error.statusCode = 404;
      console.log(error);
      return res.status(404).json({ error: "User not found." });
    }

    const aggregationPipeline = getAggregationPipelineForUsers(
      req.params.userId
    );
    let aggregatedData = await User.aggregate(aggregationPipeline);

    if (aggregatedData.length === 0) {
      return res.status(404).json({ error: "User data not found." });
    }

    let user = aggregatedData[0]; // Get the first element of the aggregated result

    try {
      let data = await processUserDetails(user.selfDetails)
      user.selfDetails = {...data};
    } catch (error) {
      console.error("Error:", error);
    }

    res.status(200).json({ user });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.getUserPDFForAdmin = async (req, res, next) => {
  try {
    const userData = await User.findById(req.params.userId);
    if (!userData) {
      return res.status(404).json({ error: "User not found." });
    }

    const aggregationPipeline = getAggregationPipelineForUsers(req.params.userId);
    let aggregatedData = await User.aggregate(aggregationPipeline);

    if (aggregatedData.length === 0) {
      return res.status(404).json({ error: "User data not found." });
    }

    let user = aggregatedData[0];

    try {
      user.selfDetails = await processUserDetails(user.selfDetails);
    } catch (error) {
      console.error("Error:", error);
    }

    const pdfBuffer = await generateUserPDFForAdmin(user);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=user_${req.params.userId}.pdf`);
    res.send(pdfBuffer);

  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.getAllPendingUsersForAdmin = async (req, res, next) => {
  try {
    const adminId = req.user._id;
    let { page, limit, search } = req.query;
    let query = {
      registrationPhase: "notapproved",
      _id: { $ne: adminId }, // Exclude users with _id matching adminId
      accessType: { $ne: "0" },
      name: { $ne: "" },
      isDeleted : false
    };
    
    // Apply search filter if present
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      query = { ...query, $or: [{ "basicDetails.name": searchRegex },{"userId" : searchRegex}, { category: searchRegex }] };
      // Add more fields to search in if needed, here we're searching in 'basicDetails.name' and 'category'
    }
    
    let result;
    let totalUsersCount;
    let endIndex;

    // Pagination logic
    if (page && limit) {
      const pageNumber = parseInt(page);
      const pageSize = parseInt(limit);
      const startIndex = (pageNumber - 1) * pageSize;
      endIndex = pageNumber * pageSize;

      totalUsersCount = await User.countDocuments(query);
      if (endIndex < totalUsersCount) {
        result = {
          nextPage: pageNumber + 1,
          data: await User.find(query)
            .select("_id basicDetails.name createdBy.createdFor category gender userId deletedStatus createdAt")
            .sort({ createdAt: -1 })
            .limit(pageSize)
            .skip(startIndex),
        };
      } else {
        result = {
          data: await User.find(query)
            .select("_id basicDetails.name createdBy.createdFor category gender userId deletedStatus createdAt")
            .sort({ createdAt: -1 })
            .limit(pageSize)
            .skip(startIndex),
        };
      }
    } else {
      result = {
        data: await User.find(query)
          .select("_id basicDetails.name createdBy.createdFor category gender userId deletedStatus createdAt")
          .sort({ createdAt: -1 }),
      };
    }

    res.status(200).json({
      result,
      currentPage: parseInt(page),
      hasLastPage: endIndex < totalUsersCount,
      hasPreviousPage: parseInt(page) > 1,
      nextPage: parseInt(page) + 1,
      previousPage: parseInt(page) - 1,
      lastPage: Math.ceil(totalUsersCount / parseInt(limit)),
      totalUsersCount
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Internal server error" });
  }
};


exports.getAllUsers = async (req, res, next) => {
  try {
    const { page, limit, search } = req.query;
    const adminId = req.user._id;
    let query = { 
      registrationPhase: { $in: ["approved", "notapproved", "rejected", "registering"] },
      _id: { $ne: adminId }, // Exclude users with _id matching adminId
      accessType: { $ne: "0" },
      name: { $ne: "" },
      isDeleted : false
    };

    // Apply search filter if present
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      query = { ...query, $or: [{ "basicDetails.name": searchRegex }, { "userId": searchRegex }, { category: searchRegex }] };
      // Add more fields to search in if needed, here we're searching in 'basicDetails.name', 'userId', and 'category'
    }

    let result;
    let totalUsersCount;
    let endIndex;

    // Pagination logic
    if (page && limit) {
      const pageNumber = parseInt(page);
      const pageSize = parseInt(limit);
      const startIndex = (pageNumber - 1) * pageSize;
      endIndex = pageNumber * pageSize;

      totalUsersCount = await User.countDocuments(query);
      if (endIndex < totalUsersCount) {
        result = {
          nextPage: pageNumber + 1,
          data: await User.find(query)
            .select("_id basicDetails.name createdBy.createdFor category gender userId deletedStatus createdAt")
            .sort({ createdAt: -1 })
            .limit(pageSize)
            .skip(startIndex),
        };
      } else {
        result = {
          data: await User.find(query)
            .select("_id basicDetails.name createdBy.createdFor category gender userId deletedStatus createdAt")
            .sort({ createdAt: -1 })
            .limit(pageSize)
            .skip(startIndex),
        };
      }
    } else {
      result = {
        data: await User.find(query)
          .select("_id basicDetails.name createdBy.createdFor category gender userId deletedStatus createdAt")
          .sort({ createdAt: -1 }),
      };
    }

    res.status(200).json({
      result,
      currentPage: parseInt(page),
      hasLastPage: endIndex < totalUsersCount,
      hasPreviousPage: parseInt(page) > 1,
      nextPage: parseInt(page) + 1,
      previousPage: parseInt(page) - 1,
      lastPage: Math.ceil(totalUsersCount / parseInt(limit)),
      totalUsersCount
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Internal server error" });
  }
};
