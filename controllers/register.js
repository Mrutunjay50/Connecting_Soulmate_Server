const {
  getUserAggregationPipeline,
} = require("../helper/AggregationOfUserData/getUserAggregationPipeline");
const { processUserDetails } = require("../helper/RegistrationHelper/processInterestDetails");
const { handlePage1, handlePage2, handlePage3, handlePage4, handlePage5, handlePage6 } = require("../helper/RegistrationHelper/registerationPageHandler");
const { sendApprovalEmail, sendApprovalEmailToAdmin } = require("../helper/emailGenerator/emailHelper");
const User = require("../models/Users");
const io = require("../socket");
const {
  Proffesion,
  Education,
  Diet,
  Country,
  City,
  State,
  Community,
} = require("../models/masterSchemas");
const {
  resizeImage,
  uploadToS3,
  generateFileName,
  deleteFromS3,
  getPublicUrlFromS3,
} = require("../utils/s3Utils");
const { populateAdminNotification } = require("../helper/NotificationsHelper/populateNotification");
const AdminNotifications = require("../models/adminNotification");

const { events } = require("../utils/eventsConstants");
const { sendNotificationToAdmins } = require("../helper/NotificationsHelper/sendNotifications");

exports.registerUser = async (req, res) => {
  try {
    let userId;
    const { page, type } = req.query; // Assuming you have a userId to identify the user

    if (req.user.accessType !== "0") {
      userId = req.user._id;
    }else {
      userId = req.params.userId;
    }
    // Fetch the user based on userId
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Based on the page number, update the corresponding array
    switch (page) {
      case "1":
        await handlePage1(req, user, type);
        break;
      case "2":
        await handlePage2(req, user);
        break;
      case "3":
        await handlePage3(req, user);
        break;
      case "4":
        await handlePage4(req, user);
        break;
      case "5":
        await handlePage5(req, user, type);
        break;
      case "6":
        await handlePage6(req, user);
        if(type !== "edit"){
          user.registrationPhase = "notapproved";
        }
        break;
      default:
        return res.status(400).json({ error: "Invalid page number" });
    }
    if (type === "edit"){
      user.registrationPage = user.registrationPage || "";
      user.reviewReason = user.reviewReason;
    }else {
      user.registrationPage = page;
      user.reviewReason = "";
    }
    // Save the updated user document
    await user.save();

    if(page === "6" && type === "add"){
      // for notifications
      // Create or update notification for profile request sent
      const notification = await AdminNotifications.findOneAndUpdate(
        {
          notificationBy: userId,
          notificationType: "approval",
        },
        {
          notificationBy: userId,
          notificationType: "approval",
        },
        {
          new: true, // Return the updated document
          upsert: true, // Create the document if it doesn't exist
          setDefaultsOnInsert: true // Apply default values if creating
        }
      );

      const formattedNotification = await populateAdminNotification(notification);

      // Send approval emails to each user's email address
      sendNotificationToAdmins(formattedNotification, "approval");
      await sendApprovalEmailToAdmin(user.basicDetails[0].name);
      await sendApprovalEmail(user.additionalDetails[0].email, user.basicDetails[0].name);
    }

    return res.status(200).json({ message: "Data added successfully", user });
  } catch (err) {
    if (err.message === 'A user with the same email or phone number already exists.') {
      return res.status(400).json({ error: err.message });
    }
    console.error(err);
    res.status(500).json({ error: "Internal Server Error", err });
  }
};

exports.getPageData = async (req, res) => {
  try {
    let userId;
    const { page } = req.query;

    if (req.user.accessType !== "0") {
      userId = req.user._id;
    }else {
      userId = req.params.userId;
    }
    // Fetch the user based on userId
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Get the aggregation pipeline based on the page
    const aggregationPipeline = getUserAggregationPipeline(userId, page);

    if (!aggregationPipeline) {
      return res.status(400).json({ error: "Invalid page number" });
    }

    let pageData = await User.aggregate(aggregationPipeline);

    // Add image URL setup for page 5
    if (page === "5" && pageData.length > 0) {
      try {
        pageData[0].selfDetails = await processUserDetails(pageData[0].selfDetails);
      } catch (error) {
        console.error("Error:", error);
      }
    }

    if (page === "6" && pageData.length > 0) {
      const partnerPreference = pageData[0].partnerPreference;
      const educations = partnerPreference.education
        .split(",")
        .map((education) => parseInt(education.trim()) || 0);
      const diets = partnerPreference.dietType
        .split(",")
        .map((dietType) => parseInt(dietType.trim()) || 0);
      const communities = partnerPreference.community
        .split(",")
        .map((community) => parseInt(community.trim()) || 0);
      const professions = partnerPreference.profession
        .split(",")
        .map((profession) => parseInt(profession.trim()) || 0);
      const states = partnerPreference.state
        .split(",")
        .map((state) => parseInt(state.trim()) || 0);
      const cities = partnerPreference.city
        .split(",")
        .map((city) => parseInt(city.trim()) || 0);
      const countries = partnerPreference.country
        .split(",")
        .map((country) => parseInt(country.trim()) || 0);

      //finding if the any of the strings present in the documents
      const [education, diet, community, profession, state, city, country] = await Promise.all([
        Education.find({ education_id: { $in: educations } }),
        Diet.find({ diet_id: { $in: diets } }),
        Community.find({ community_id: { $in: communities } }),
        Proffesion.find({ proffesion_id: { $in: professions } }),
        State.find({ state_id: { $in: states } }),
        City.find({ city_id: { $in: cities } }),
        Country.find({ country_id: { $in: countries } }),
      ]);

      partnerPreference.educationTypes = education
        ?.map((item) => item.education_name)
        ?.join(", ");
      partnerPreference.dietTypes = diet
        ?.map((item) => item.diet_name)
        ?.join(", ");
      partnerPreference.communityTypes = community
        ?.map((item) => item.community_name)
        ?.join(", ");
      partnerPreference.professionTypes = profession
        ?.map((item) => item.proffesion_name)
        ?.join(", ");
      partnerPreference.stateTypes = state
        ?.map((item) => item.state_name)
        ?.join(", ");
      partnerPreference.cityTypes = city
        ?.map((item) => item.city_name)
        ?.join(", ");
      partnerPreference.countryTypes = country
        ?.map((item) => item.country_name)
        ?.join(", ");
    }

    res
      .status(200)
      .json({ message: "Data fetched successfully", pageData: pageData[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error", err });
  }
};


exports.deleteImagesInUser = async (req, res) => {
  try {
    const { imageKey } = req.body;
    let userId;
    if (req.user.accessType !== "0") {
      userId = req.user._id;
    }else {
      userId = req.params.userId;
    }
    const user = await User.findById(userId); // Corrected variable name from 'id' to 'userId'
    if (!user) {
      return res.status(404).json({ message: "User not found" }); // Added 'return' statement
    }
    user.selfDetails[0].userPhotos = user.selfDetails[0].userPhotos.filter(
      (item) => item !== imageKey
    );
    // Remove corresponding userPhotosUrl if it exists
    if (user.selfDetails[0]?.userPhotosUrl) {
      user.selfDetails[0].userPhotosUrl = [];
      user?.selfDetails[0]?.userPhotos?.filter(
        (item) => user.selfDetails[0].userPhotosUrl.push(getPublicUrlFromS3(item))
      );
    }
    if(user.selfDetails[0]?.profilePicture === imageKey){
      user.selfDetails[0].profilePicture = user.selfDetails[0]?.userPhotos[0] || "";
      // user.selfDetails[0].profilePictureUrl = user.selfDetails[0]?.userPhotosUrl[0] || "";
    }
    await user.save();
    await deleteFromS3(imageKey);
    res.status(200).json({ message: "Image deleted successfully", selfDetails : user?.selfDetails }); // Moved response outside try block
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error", err });
  }
};

exports.selectProfileImageInUser = async (req, res) => {
  try {
    const { imageKey } = req.body;
    const { userId } = req.params;
    const user = await User.findById(userId); // Corrected variable name from 'id' to 'userId'
    if (!user) {
      return res.status(404).json({ message: "User not found" }); // Added 'return' statement
    }
    user.selfDetails[0].profilePictureUrl = getPublicUrlFromS3(imageKey)
    user.selfDetails[0].profilePicture = imageKey
    // Save the updated user object
    await user.save();

    // Send success response
    res.status(200).json({ message: "User Profile Image data updated successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error", err });
  }
};


exports.addImagesInUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const userPhotos = req.files || [];
    const profileImage = req.files.profileImage ? req.files.profileImage[0] : null;

    // console.log('====================================');
    // console.log(userPhotos);
    // console.log('====================================');

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!user.selfDetails || !user.selfDetails[0]) {
      user.selfDetails = [{}];
    }

    let selfDetails = user.selfDetails[0];

    // Handle profile image upload if provided
    if (profileImage) {
      const profileImageFileName = generateFileName(profileImage.originalname);
      await uploadToS3(profileImage.buffer, profileImageFileName, profileImage.mimetype);
      selfDetails.profilePicture = profileImageFileName;
      selfDetails.profilePictureUrl = getPublicUrlFromS3(profileImageFileName);
    }

    // Handle user photos upload if provided
    if (userPhotos.length > 0) {
      // Remove excess photos if total count exceeds 5
      if ((selfDetails.userPhotos || []).length + userPhotos.length > 5) {
        const excessCount = (selfDetails.userPhotos.length + userPhotos.length) - 5;
        selfDetails.userPhotos.splice(0, excessCount);
        selfDetails.userPhotosUrl.splice(0, excessCount);
      }

      try {
        const uploadedPhotos = await Promise.all(
          userPhotos.map(async (photo) => {
            const { buffer, originalname, mimetype } = photo;
            const fileName = generateFileName(originalname);
            await uploadToS3(buffer, fileName, mimetype);
            return { fileName, publicUrl: getPublicUrlFromS3(fileName) };
          })
        );

        selfDetails.userPhotos = (selfDetails.userPhotos || []).concat(uploadedPhotos.map(photo => photo.fileName));
        // selfDetails.userPhotosUrl = (selfDetails.userPhotosUrl || []).concat(uploadedPhotos.map(photo => photo.publicUrl));
      } catch (error) {
        console.error("Error uploading images to S3:", error);
        return res.status(500).json({ error: "Error uploading images to S3" });
      }
    }
    // console.log('====================================');
    // console.log(selfDetails);
    // console.log('====================================');
    await user.save();
    res.status(200).json({ message: "User photos added successfully" });
  } catch (error) {
    console.error("Error adding user photos:", error);
    res.status(500).json({ error: "Internal Server Error", message: error.message });
  }
};


exports.updateUserPhotos = async (req, res) => {
  try {
    const userPhotos = req.files;
    let userId;
    if (req.user.accessType !== "0") {
      userId = req.user._id;
    } else {
      userId = req.params.userId;
    }
    const { profilePictureIndex } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!user.selfDetails || !user.selfDetails[0]) {
      user.selfDetails = [{}];
    }

    // Update self details
    let selfDetails = user.selfDetails[0];

      if (userPhotos && userPhotos.length > 0) {
        // Upload new photos to S3 and add their file names and URLs to userPhotos and userPhotosUrl arrays
        try {
          const uploadedPhotos = await Promise.all(
            userPhotos.map(async (photo) => {
              const { buffer, originalname, mimetype } = photo;
              const resizedImageBuffer = await resizeImage(buffer);
              const fileName = generateFileName(originalname);
              await uploadToS3(resizedImageBuffer, fileName, mimetype);
              const publicUrl = getPublicUrlFromS3(fileName);
              return { fileName, publicUrl };
            })
          );

          // If profilePictureIndex is present and matches any uploaded photo, add it to selfDetails.profilePicture
          // if (profilePictureIndex !== undefined && uploadedPhotos.length > 0) {
          //   const { fileName, publicUrl } = uploadedPhotos[profilePictureIndex];
          //   selfDetails.profilePicture = fileName;
          //   selfDetails.profilePictureUrl = publicUrl;
          // }

          // Add uploaded photos and URLs to userPhotos and userPhotosUrl arrays
          selfDetails.userPhotos.push(...uploadedPhotos.map((photo) => photo.fileName));
          // selfDetails.userPhotosUrl.push(...uploadedPhotos.map((photo) => photo.publicUrl));
        } catch (error) {
          console.log("Error uploading images to S3:", error);
          return res.status(500).json({ error: "Error uploading images to S3" });
        }
      }
      // Update the profile picture based on profilePictureIndex
      if ( profilePictureIndex !== undefined && profilePictureIndex < selfDetails.userPhotos.length) {
        const newProfilePictureKey = selfDetails.userPhotos[profilePictureIndex];
        selfDetails.profilePicture = newProfilePictureKey;
        // selfDetails.profilePictureUrl = getPublicUrlFromS3(newProfilePictureKey);
      }
      // Save the updated user object
      await user.save();

      // Send success response
      res.status(200).json({ message: "User image updated successfully" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Internal Server Error", err });
  }
};


exports.createProfession = async (req, res) => {
  try {
    const { professionName } = req.body;

    // Check if the professionName is provided
    if (!professionName) {
      return res.status(400).json({ error: "Profession name is required" });
    }

    // Check if a profession with the same name already exists
    const existingProfession = await Proffesion.findOne({ proffesion_name: professionName });

    if (existingProfession) {
      return res.status(200).json({ message: "Profession already exists", profession: existingProfession });
    }

    // Count the number of professions to set a new profession ID
    const count = await Proffesion.countDocuments();
    const professionId = count + 1;

    // Create a new profession if the name is unique
    const profession = new Proffesion({
      proffesion_name: professionName,
      proffesion_id: parseInt(professionId),
    });

    await profession.save();

    res.status(201).json({ message: "Profession created successfully", profession });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error", err });
  }
};

exports.changeUserDetailsText = async (req, res) => {
  try {
    const userId = req.user._id;
    const { type, text } = req.body;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (type === "about-yourself") {
      user.selfDetails[0].aboutYourself = text;
    } else if (type === "personal-appearance") {
      user.additionalDetails[0].personalAppearance = text;
    }
    await user.save();
    res.status(200).json({ message: `${type} updated successfully`, user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error", err });
  }
};
