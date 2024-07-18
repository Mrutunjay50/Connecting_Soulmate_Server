const fs = require("fs");
const path = require("path");
const json2csv = require("json2csv").parse;
const {
  getAggregationPipelineForUsers,
} = require("../helper/AggregationOfUserData/aggregationPipelineForUsers");
// const { generateUserPDFForAdmin } = require("../helper/generatePDF");
const { processUserDetails } = require("../helper/RegistrationHelper/processInterestDetails");
const User = require("../models/Users");
const { sendReviewEmail, sendRejectionEmail, sendSuccessfulRegisterationMessage, sendBannedEmailFromAdmin, sendDeleteEmailFromAdmin } = require("../helper/emailGenerator/emailHelper");
const SuccessfulMarriage = require("../models/successFullMarraige");
const { getPublicUrlFromS3 } = require("../utils/s3Utils");
const axios = require("axios");
const { deleteUserRelatedData } = require("../helper/deleteUserData");
const BannedUsers = require("../models/bannedUsers");
const io = require("../socket");

const addToSuccessfulMarriages = async (userId) => {
  let record = await SuccessfulMarriage.findOne();

  if (!record) {
    record = new SuccessfulMarriage({ userIds: [userId] });
  } else {
    record.userIds.push(userId);
  }

  await record.save();
  return record.userIds.length;
};

exports.updateRegistrationPhase = async (req, res) => {
  try {
    const { registrationPhase } = req.body;
    // console.log(registrationPhase);
    const { userId } = req.params;
    let user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (registrationPhase === "approved") {
      if (
        user?.basicDetails?.length > 0 &&
        user?.selfDetails?.length > 0 &&
        user?.additionalDetails?.length > 0 &&
        user?.careerDetails?.length > 0 &&
        user?.familyDetails?.length > 0
        // user?.additionalDetails[0]?.email
      ) {
        user.registrationPhase = registrationPhase;
        user.registrationPage = "";
        user.approvedAt = new Date().toISOString();
        if(user?.additionalDetails[0].email){
          await sendSuccessfulRegisterationMessage(user.additionalDetails[0].email, user.basicDetails[0]?.name);
        }
      }else {
        return res.status(403).json({message: `Some data on respective registration pages might be missing`});
      }
    } else {
      // user.registrationPhase = "deleted"; //this will be added when the review functionality will be added;
      user.registrationPage = "1";
      user.registrationPhase = "rejected";
      user.category = "";
      // Set the declinedOn date to the current date
      user.declinedOn = new Date();
      if (
        user?.additionalDetails?.length > 0 &&
        user?.additionalDetails[0]?.email
      ) {
        await sendRejectionEmail(user.additionalDetails[0].email, user?.basicDetails[0]?.name);
      }
    }


    user = await user.save();

    res.status(200).json({
      message: `registration phase ${user.registrationPhase} updated successfully`,
      user,
    });
  } catch (error) {
    console.error("Error updating registration phase:", error);
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
    user.category = ""
    user.reviewReason = reviewReason;
    user.registrationPage = "1"
    // Save the updated user
    await user.save();
    await sendReviewEmail(user.additionalDetails[0].email, reviewReason?.split(","), user?.basicDetails[0]?.name);

    res.status(200).json({ message: "Profile resent for review successfully" });
  } catch (error) {
    console.error("Error deleting profile:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};



exports.updateUserCategory = async (req, res) => {
  try {
    const { categoryType } = req.body;
    // console.log(categoryType);
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

    return res.status(200).json({
      message: `Category updated successfully for user ${user?.basicDetails[0]?.name}`,
      user,
    });
  } catch (error) {
    console.error("Error updating category:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.softDeleteUser = async (req, res) => {
  try {
    const { userId, deleteReason, isSuccessFulMarraige } = req.params;
    let user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    user.isDeleted = true;
    user.deleteReason = deleteReason;
    user.deletedStatus = "This profile has been deleted."
    user = await user.save();

    await deleteUserRelatedData(user?._id);
    const email = user?.additionalDetails?.[0]?.email;
    const name = user?.basicDetails?.[0]?.name || "user";
    io.getIO().emit(`DELETE_TOKEN_FOR_USER/${user._id?.toString()}`, { "message": "number changed login again" });
    if (email && email.trim() !== "") {
      await sendDeleteEmailFromAdmin(email, name);
    }
    
    if (isSuccessFulMarraige) {
      await addToSuccessfulMarriages(userId);
    }
    res.status(200).json({
      message: `user ${user?.basicDetails[0]?.name} deleted successfully`,
      user,
    });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.banUser = async (req, res) => {
  try {
    const { userId, banReason } = req.body;
    let user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Store the user's contact number before deleting
    const contactNumber = user.createdBy[0]?.phone; // Adjust this based on your user schema
    const name = user?.basicDetails?.[0]?.name || "user";
    const gender = user?.basicDetails?.[0]?.gender || "";
    const email = user?.additionalDetails?.[0]?.email;

    // Find the banned user document
    let bannedUser = await BannedUsers.findOne({ contact: contactNumber });

    if (bannedUser) {
      // If bannedUser is found, no need to update contactNumber again since it's already included
      res.status(200).json({
        message: `User ${bannedUser.name} already banned`,
      });
    } else {
      // Create a new document
      bannedUser = new BannedUsers({
        name: name,
        contact: contactNumber,
        userId: userId,
        bannedReason: banReason || "",
        gender: gender,
      });
    }

    await bannedUser.save();

    // Delete the user completely
    await User.findByIdAndDelete(userId);
    await deleteUserRelatedData(userId);
    io.getIO().emit(`DELETE_TOKEN_FOR_USER/${userId}`, { "message": "number changed login again" });

    if (email && email.trim() !== "") {
      await sendBannedEmailFromAdmin(email, name, reason);
    }

    res.status(200).json({
      message: `User ${name} banned successfully and contact number stored`,
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
          totalUsers: [
            { $match: { accessType: { $nin: ["0", "1"] }, registrationPhase : "approved", isDeleted : false } },
            { $count: "count" }
          ],
          totalMaleUsers: [
            { $match: { gender: 'M', accessType: { $nin: ["0", "1"] }, registrationPhase : "approved", isDeleted : false } },
            { $count: "count" }
          ],
          totalFemaleUsers: [
            { $match: { gender: 'F', accessType: { $nin: ["0", "1"] }, registrationPhase : "approved", isDeleted : false } },
            { $count: "count" }
          ],
          totalDeletedUsers: [
            { $match: { isDeleted: true, accessType: { $nin: ["0", "1"] }, registrationPhase : "approved" } },
            { $count: "count" }
          ],
          totalUsersCategoryA: [
            { $match: { category: /A/, accessType: { $nin: ["0", "1"] }, registrationPhase : "approved", isDeleted : false } },
            { $count: "count" }
          ],
          totalUsersCategoryB: [
            { $match: { category: /B/, accessType: { $nin: ["0", "1"] }, registrationPhase : "approved", isDeleted : false } },
            { $count: "count" }
          ],
          totalUsersCategoryC: [
            { $match: { category: /C/, accessType: { $nin: ["0", "1"] }, registrationPhase : "approved", isDeleted : false } },
            { $count: "count" }
          ],
          totalUsersUnCategorised: [
            { $match: { category: "", accessType: { $nin: ["0", "1"] }, registrationPhase : "approved", isDeleted : false } },
            { $count: "count" }
          ],
          totalActiveUsers: [
            { $match: { lastLogin: { $gte: pastDate }, accessType: { $nin: ["0", "1"] }, registrationPhase : "approved", isDeleted : false } },
            { $count: "count" }
          ],
        }
      },
      {
        $project: {
          totalUsers: { $arrayElemAt: ["$totalUsers.count", 0] },
          totalMaleUsers: { $arrayElemAt: ["$totalMaleUsers.count", 0] },
          totalFemaleUsers: { $arrayElemAt: ["$totalFemaleUsers.count", 0] },
          totalDeletedUsers: { $arrayElemAt: ["$totalDeletedUsers.count", 0] },
          totalUsersCategoryA: { $arrayElemAt: ["$totalUsersCategoryA.count", 0] },
          totalUsersCategoryB: { $arrayElemAt: ["$totalUsersCategoryB.count", 0] },
          totalUsersCategoryC: { $arrayElemAt: ["$totalUsersCategoryC.count", 0] },
          totalUsersUnCategorised: { $arrayElemAt: ["$totalUsersUnCategorised.count", 0] },
          totalActiveUsers: { $arrayElemAt: ["$totalActiveUsers.count", 0] },
        }
      }
    ]);

    // Query for the count of successful marriages
    const successfulMarriageRecord = await SuccessfulMarriage.findOne();
    const totalSuccessfulMarriages = successfulMarriageRecord ? successfulMarriageRecord.count : 0;

    const totalBannedUsers = await BannedUsers.countDocuments();

    // console.log("----------------");
    // console.timeEnd('getUserStatisticsForAdmin'); // End timing
    // console.log("----------------");

    const stats = statistics[0];

    res.status(200).json({
      totalUsers: stats.totalUsers || 0,
      totalMaleUsers: stats.totalMaleUsers || 0,
      totalFemaleUsers: stats.totalFemaleUsers || 0,
      totalDeletedUsers: stats.totalDeletedUsers || 0,
      totalUsersCategoryA: stats.totalUsersCategoryA || 0,
      totalUsersCategoryB: stats.totalUsersCategoryB || 0,
      totalUsersCategoryC: stats.totalUsersCategoryC || 0,
      totalUsersUnCategorised: stats.totalUsersUnCategorised || 0,
      totalActiveUsers: stats.totalActiveUsers || 0,
      totalSuccessfulMarriages: totalSuccessfulMarriages || 0,
      totalBannedUsers: totalBannedUsers || 0,
    });
  } catch (error) {
    console.error("Error fetching user statistics:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};


exports.downloadAllUsersAsCSV = async (req, res) => {
  try {
    let query = {
      registrationPhase: "approved",
      accessType: { $ne: "0" },
      name: { $ne: "" },
      isDeleted : false
    };
    const users = await User.find(query);

    // Prepare data for CSV
    const csvData = users.map((user) => {
      const basicDetails = user.basicDetails[0] || {};
      const additionalDetails = user.additionalDetails[0] || {};
      const careerDetails = user.careerDetails[0] || {};
      const familyDetails = user.familyDetails[0] || {};
      const selfDetails = user.selfDetails[0] || {};

      return {
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
        Gender: user.gender || "",
        Category: user.category || "",
        "Annual Income Type": careerDetails.currencyType || "",
      };
    });

    const csvDataString = json2csv(csvData, {
      fields: [
        "Name", "Gender", "Place of Birth (Country)", "Place of Birth (State)", "Place of Birth (City)",
        "Date of Birth", "Time of Birth", "Age", "Manglik", "Horoscope", "Height", "Weight", "Email",
        "Contact", "Personal Appearance", "Currently Living In (Country)", "Currently Living In (State)",
        "Currently Living In (City)", "Country Code", "Relocation in Future", "Diet", "Alcohol", "Smoking",
        "Marital Status", "Highest Education", "Highest Qualification", "School/University", "Passing Year",
        "Profession", "Current Designation", "Previous Occupation", "Annual Income Value", "Father's Name",
        "Father's Occupation", "Mother's Name", "Mother's Occupation", "Siblings", "With Family Status",
        "Family Location (Country)", "Family Location (State)", "Family Location (City)", "Religion", "Caste",
        "Community", "Family Annual Income", "Interests", "Fun", "Fitness", "Other", "Profile Picture",
        "User Photos", "User Photos URL", "Profile Picture URL", "About Yourself", "WhatsApp Setting",
        "Email Subscribe", "Gender", "Category", "Annual Income Type"
      ]
    });

    const folderPath = path.join(__dirname, "..", "csv");
    const filePath = path.join(folderPath, "users.csv");

    // Ensure the folder exists
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath);
    }

    // Save the CSV data to a file
    fs.writeFileSync(filePath, csvDataString);

    // Send the CSV file as a response
    res.download(filePath, filePath, (err) => {
      if (err) {
        console.error(err);
        res.status(500).send("Internal Server Error");
      }
    });
  } catch (error) {
    console.error("Error downloading users as CSV:", error);
    res.status(500).send("Internal Server Error");
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


exports.getUserImageInBase64ByIdForAdmin = async (req, res, next) => {
  try {
    const userData = await User.findById(req.params.userId);
    if (!userData) {
      return res.status(404).json({ error: "User not found." });
    }

    // Assuming userData has a property like imageUrl that contains the public URL of the image
    const imageUrl = getPublicUrlFromS3(userData.selfDetails[0].profilePicture);

    // Fetch the image data from the public URL using Axios
    const imageResponse = await axios.get(imageUrl, {
      responseType: 'arraybuffer'
    });

    // Convert the image data to base64
    const imageBase64 = Buffer.from(imageResponse.data, 'binary').toString('base64');

    // Optionally, you can save the base64 data to a file for testing purposes
    // const base64FilePath = path.join(__dirname, 'base64image.txt');
    // fs.writeFileSync(base64FilePath, imageBase64);

    // Send the base64 data as JSON response
    return res.status(200).json({ base64Image: imageBase64, url : imageUrl });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};
// exports.getUserPDFForAdmin = async (req, res, next) => {
//   try {
//     const userData = await User.findById(req.params.userId);
//     if (!userData) {
//       return res.status(404).json({ error: "User not found." });
//     }

//     const aggregationPipeline = getAggregationPipelineForUsers(req.params.userId);
//     let aggregatedData = await User.aggregate(aggregationPipeline);

//     if (aggregatedData.length === 0) {
//       return res.status(404).json({ error: "User data not found." });
//     }

//     let user = aggregatedData[0];

//     try {
//       user.selfDetails = await processUserDetails(user.selfDetails);
//     } catch (error) {
//       console.error("Error:", error);
//     }

//     const pdfBuffer = await generateUserPDFForAdmin(user);

//     res.setHeader('Content-Type', 'application/pdf');
//     res.setHeader('Content-Disposition', `attachment; filename=user_${req.params.userId}.pdf`);
//     res.send(pdfBuffer);

//   } catch (err) {
//     console.log(err);
//     res.status(500).json({ error: "Internal Server Error" });
//   }
// };

exports.getAllPendingUsersForAdmin = async (req, res, next) => {
  try {
    const adminId = req.user._id;
    let { page, limit, search } = req.query;
    let query = {
      registrationPhase: "notapproved",
      // registrationPhase: {$in: ["notapproved", "rejected"]},
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
            .select("_id basicDetails.name createdBy.createdFor createdBy.name category gender userId deletedStatus createdAt")
            .sort({ createdAt: -1 })
            .limit(pageSize)
            .skip(startIndex),
        };
      } else {
        result = {
          data: await User.find(query)
            .select("_id basicDetails.name createdBy.createdFor createdBy.name category gender userId deletedStatus createdAt")
            .sort({ createdAt: -1 })
            .limit(pageSize)
            .skip(startIndex),
        };
      }
    } else {
      result = {
        data: await User.find(query)
          .select("_id basicDetails.name createdBy.createdFor createdBy.name category gender userId deletedStatus createdAt")
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
      registrationPhase: "approved",
      _id: { $ne: adminId }, // Exclude users with _id matching adminId,
      isDeleted : false,
      accessType: { $ne: "0" },
      name: { $ne: "" }
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
            .select("_id basicDetails.name createdBy.createdFor createdBy.name category isDeleted gender userId deletedStatus createdAt")
            .sort({ createdAt: -1 })
            .limit(pageSize)
            .skip(startIndex),
        };
      } else {
        result = {
          data: await User.find(query)
            .select("_id basicDetails.name createdBy.createdFor createdBy.name category isDeleted gender userId deletedStatus createdAt")
            .sort({ createdAt: -1 })
            .limit(pageSize)
            .skip(startIndex),
        };
      }
    } else {
      result = {
        data: await User.find(query)
          .select("_id basicDetails.name createdBy.createdFor createdBy.name category isDeleted gender userId deletedStatus createdAt")
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

