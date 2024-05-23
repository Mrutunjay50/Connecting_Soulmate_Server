const {
  getUserAggregationPipeline,
} = require("../helper/getUserAggregationPipeline");
const { processUserDetails } = require("../helper/processInterestDetails");
const { handlePage1, handlePage2, handlePage3, handlePage4, handlePage5, handlePage6 } = require("../helper/registerationPageHandler");
const User = require("../models/Users")
const {
  Proffesion,
  Education,
  Diet,
} = require("../models/masterSchemas");
const {
  // resizeImage,
  uploadToS3,
  generateFileName,
  deleteFromS3,
} = require("../utils/s3Utils");


exports.registerUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { page } = req.query; // Assuming you have a userId to identify the user
    // Fetch the user based on userId
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Based on the page number, update the corresponding array
    switch (page) {
      case "1":
        await handlePage1(req, user);
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
        await handlePage5(req, user);
        break;
      case "6":
        await handlePage6(req, user);
        break;
      default:
        return res.status(400).json({ error: "Invalid page number" });
    }
    user.registrationPage = page;
    // Save the updated user document
    await user.save();

    res.status(200).json({ message: "Data added successfully", user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error", err });
  }
};

exports.getPageData = async (req, res) => {
  try {
    const { userId } = req.params;
    const { page } = req.query;

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
        .map((interest) => parseInt(interest.trim()));
      const diets = partnerPreference.dietType
        .split(",")
        .map((other) => parseInt(other.trim()));
      //finding if the any of the strings present in the documents
      const [education, diet] = await Promise.all([
        Education.find({ education_id: { $in: educations } }),
        Diet.find({ diet_id: { $in: diets } }),
      ]);

      partnerPreference.educationTypes = education
        ?.map((item) => item.education_name)
        ?.join(", ");
      partnerPreference.dietTypes = diet
        ?.map((item) => item.diet_name)
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
    const { userId } = req.params;
    const user = await User.findById(userId); // Corrected variable name from 'id' to 'userId'
    if (!user) {
      return res.status(404).json({ message: "User not found" }); // Added 'return' statement
    }
    user.selfDetails[0].userPhotos = user.selfDetails[0].userPhotos.filter(
      (item) => item !== imageKey
    );
    if(user.selfDetails[0]?.profilePicture === imageKey){
      user.selfDetails[0].profilePicture = user.selfDetails[0]?.userPhotos[0];
    }
    await user.save();
    await deleteFromS3(imageKey);
    res.status(200).json({ message: "Image deleted successfully" }); // Moved response outside try block
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error", err });
  }
};

exports.addImagesInUser = async (req, res) => {
  try {
    const userPhotos = req.files;
    const { userId } = req.params;
    const {userPhotosKeys, profilePictureIndex, profilePictureKey} = req.body

    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ message: "user not found" });
    }
    if (!user.selfDetails || !user.selfDetails[0]) {
      user.selfDetails = [{}];
    }
    // Update self details
    let selfDetails = user.selfDetails[0];

    if (profilePictureKey) {
      selfDetails.profilePicture = profilePictureKey;
    }
    // Remove photos not present in userPhotosKeys from both userPhotos array and S3
    if (selfDetails.userPhotos && selfDetails.userPhotos.length > 0) {
      selfDetails.userPhotos.forEach(async (photo) => {
        if (!userPhotosKeys.includes(photo)) {
          // Remove photo from S3
          await deleteFromS3(photo); // Assuming there is a function to delete from S3
          // Remove photo from userPhotos array
          selfDetails.userPhotos = selfDetails.userPhotos.filter(
            (p) => p !== photo
          );
        }
      });
    }
    if (userPhotos && userPhotos.length > 0) {
      // Remove excess photos if total count exceeds 5
      if (
        selfDetails.userPhotos &&
        selfDetails.userPhotos.length + userPhotos.length > 5
      ) {
        const excessCount =
          selfDetails.userPhotos.length + userPhotos.length - 5;
        selfDetails.userPhotos.splice(0, excessCount);
      }
      // Upload new photos to S3 and add their file names to userPhotos array
      try {
        const uploadedPhotos = await Promise.all(
          userPhotos.map(async (photo) => {
            const { buffer, originalname, mimetype } = photo;
            const resizedImageBuffer = await buffer;
            const fileName = generateFileName(originalname);
            await uploadToS3(resizedImageBuffer, fileName, mimetype);
            return fileName;
          })
        );
        // If profilePictureKey is present and matches any uploaded photo, add it to selfDetails.profilePicture
        if (profilePictureIndex && uploadedPhotos.length > 0) {
          selfDetails.profilePicture = uploadedPhotos[profilePictureIndex];
        }
        // Add uploaded photos to userPhotos array
        selfDetails.userPhotos.push(...uploadedPhotos);
      } catch (error) {
        console.error("Error uploading images to S3:", error);
        res.status(500).json({ error: "Error uploading images to S3" });
        return; // Exit the function early
      }
    }
    try {
      // Save the updated user object
      await user.save();
      // Send success response
      res.status(200).json({ message: "User data updated successfully" });
    } catch (error) {
      console.error("Error saving user data:", error);
      res.status(500).json({ error: "Error saving user data" });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error", err });
  }
};

exports.createProfession = async (req, res) => {
  try {
    const { professionName } = req.body;
    const count = await Proffesion.countDocuments();

    const professionId = count + 1;
    let profession;
    if (professionName !== "") {
      profession = new Proffesion({
        proffesion_name: professionName,
        proffesion_id: parseInt(professionId),
      });
    }

    await profession.save();

    res
      .status(201)
      .json({ message: "Profession created successfully", profession });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error", err });
  }
};

exports.changeUserDetailsText = async (req, res) => {
  try {
    const { userId } = req.params;
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
