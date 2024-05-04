const {
  getUserAggregationPipeline,
} = require("../helper/getUserAggregationPipeline");
const User = require("../models/Users");
const ExchangeRate = require("../models/exchangeRate");
const {
  Proffesion,
  FunActivity,
  Interest,
  Other,
  Fitness,
  Education,
  Diet,
} = require("../models/masterSchemas");
const {
  resizeImage,
  uploadToS3,
  generateFileName,
  getSignedUrlFromS3,
  deleteFromS3,
} = require("../utils/s3Utils");
const moment = require("moment");

function generateUniqueNumber() {
  const randomNumber = Math.floor(Math.random() * 100);
  const uniqueNumber = `${randomNumber}`;
  return uniqueNumber;
}

exports.registerUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { page } = req.query; // Assuming you have a userId to identify the user
    // Fetch the user based on userId
    const user = await User.findById(userId);

    console.log(req.body);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Based on the page number, update the corresponding array
    switch (page) {
      case "1":
        const { fname, mname, lname, dateOfBirth } = req.body.basicDetails;
        const currentDate = new Date();
        const birthDate = new Date(dateOfBirth);
        let age = currentDate.getFullYear() - birthDate.getFullYear();
        const currentMonth = currentDate.getMonth();
        const birthMonth = birthDate.getMonth();

        if (
          currentMonth < birthMonth ||
          (currentMonth === birthMonth &&
            currentDate.getDate() < birthDate.getDate())
        ) {
          age--;
        }
        user.basicDetails[0] = {
          ...req.body.basicDetails,
          name: `${fname} ${mname} ${lname}`,
          gender: user.createdBy[0].gender,
          age: age.toString(),
        };
        user.registrationPhase = "registering";

        // Generate userId and save the updated user document
        const genderPrefix = generateUniqueNumber();
        const namePrefix = user.basicDetails[0].name.slice(0, 2).toUpperCase();
        const dob = moment(user.basicDetails[0].dateOfBirth, "YYYY-MM-DD");
        const dobFormatted = dob.format("YYYYMMDD");
        const loginTime = moment().format("HHmmss");

        user.basicDetails[0].userId =
          `CS${namePrefix}${genderPrefix}${dobFormatted}${loginTime}`
            ?.toUpperCase()
            .replaceAll(" ", "");
        break;
      case "2":
        user.additionalDetails[0] = { ...req.body.additionalDetails };
        break;
      case "3":
        var { annualIncomeValue, currencyType } = req.body.careerDetails;
        // Fetch exchange rates from the database
        const exchangeRate = await ExchangeRate.findOne({
          currency: currencyType,
        });

        // Convert annualIncomeValue to USD
        let annualIncomeUSD = annualIncomeValue * exchangeRate?.rateToUSD;
        user.careerDetails[0] = { ...req.body.careerDetails, annualIncomeUSD };
        break;
      case "4":
        var { annualIncomeValue, country, state, city } =
          req.body.familyDetails;

        user.familyDetails[0] = {
          ...req.body.familyDetails,
          familyAnnualIncomeStart: annualIncomeValue,
          familyLocationCountry: country,
          familyLocationState: state,
          familyLocationCity: city,
        };
        break;
      case "5":
        const userPhotos = req.files;
        const { aboutYourself, interests, fun, fitness, other } = JSON.parse(
          req.body.selfDetails
        );
        
        // Check if user.selfDetails exists, if not, create a new object
        if (!user.selfDetails || !user.selfDetails[0]) {
          user.selfDetails = [{}];
        }
        
        // Update self details
        const selfDetails = user.selfDetails[0];
        selfDetails.aboutYourself = aboutYourself;
        selfDetails.interests = interests;
        selfDetails.fun = fun;
        selfDetails.fitness = fitness;
        selfDetails.other = other;
        
        // If new photos are uploaded, process them
        if (userPhotos && userPhotos.length > 0) {
          // Remove excess photos if total count exceeds 5
          if (selfDetails.userPhotos && selfDetails.userPhotos.length + userPhotos.length > 5) {
            const excessCount = selfDetails.userPhotos.length + userPhotos.length - 5;
            selfDetails.userPhotos.splice(0, excessCount);
          }
        
          // Upload new photos to S3 and add their file names to userPhotos array
          try {
            const uploadedPhotos = await Promise.all(userPhotos.map(async (photo) => {
              const { buffer, originalname, mimetype } = photo;
              const resizedImageBuffer = await buffer;
              const fileName = generateFileName(originalname);
              await uploadToS3(resizedImageBuffer, fileName, mimetype);
              return fileName;
            }));
            // Add uploaded photos to userPhotos array
            selfDetails.userPhotos.push(...uploadedPhotos);
          } catch (error) {
            console.error("Error uploading images to S3:", error);
          }
        }
        
        try {
          // Save the updated user object
          await user.save();
          // Send response or handle success
        } catch (error) {
          console.error("Error saving user data:", error);
          // Send error response or handle failure
        }
        break;
      case "6":
        var {
          ageRangeStart,
          ageRangeEnd,
          heightRangeStart,
          heightRangeEnd,
          annualIncomeRangeStart,
          annualIncomeRangeEnd,
        } = req.body.partnerPreference;
        user.partnerPreference[0] = {
          ...req.body.partnerPreference,
          ageRangeStart: ageRangeStart,
          ageRangeEnd: ageRangeEnd,
          heightRangeStart: heightRangeStart,
          heightRangeEnd: heightRangeEnd,
          annualIncomeRangeStart: annualIncomeRangeStart,
          annualIncomeRangeEnd: annualIncomeRangeEnd,
        };
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

exports.deleteImagesInUser = async (req, res) => {
  try {
    const { imageKey } = req.body;
    const { userId } = req.params;
    const user = await User.findById(userId); // Corrected variable name from 'id' to 'userId'
    if (!user) {
      return res.status(404).json({ message: "User not found" }); // Added 'return' statement
    }
    user.selfDetails[0].userPhotos = user.selfDetails[0].userPhotos.filter((item) => item !== imageKey);
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
    const user = await User.findById(id);
    if (!user) {
      res.status(404).json({ message: "user not found" });
    }
    if (!user.selfDetails || !user.selfDetails[0]) {
      user.selfDetails = [{}];
    }
    
    // Update self details
    if (userPhotos && userPhotos.length > 0) {
      // Remove excess photos if total count exceeds 5
      if (selfDetails.userPhotos && selfDetails.userPhotos.length + userPhotos.length > 5) {
        const excessCount = selfDetails.userPhotos.length + userPhotos.length - 5;
        selfDetails.userPhotos.splice(0, excessCount);
      }
    
      // Upload new photos to S3 and add their file names to userPhotos array
      try {
        const uploadedPhotos = await Promise.all(userPhotos.map(async (photo) => {
          const { buffer, originalname, mimetype } = photo;
          const resizedImageBuffer = await buffer;
          const fileName = generateFileName(originalname);
          await uploadToS3(resizedImageBuffer, fileName, mimetype);
          return fileName;
        }));
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
      const selfData = pageData[0].selfDetails;
      const signedUrlsPromises = selfData.userPhotos.map((item) =>
        getSignedUrlFromS3(item)
      );
      try {
        // Use Promise.all() to wait for all promises to resolve
        const signedUrls = await Promise.all(signedUrlsPromises);
        selfData.userPhotosUrl = signedUrls;
      } catch (error) {
        // Handle any errors that occurred during promise resolution
        console.error("Error:", error);
      }
      selfData.profilePictureUrl = await getSignedUrlFromS3(
        selfData.profilePicture
      );
      // Assuming interests and funActivities are arrays of strings
      // sending already populated data
      const interests = selfData.interests
        .split(",")
        .map((interest) => parseInt(interest.trim()) || 0); // Add a fallback value if parsing fails
      const funActivities = selfData.fun
        .split(",")
        .map((activity) => parseInt(activity.trim()) || 0); // Add a fallback value if parsing fails
      const others = selfData.other
        .split(",")
        .map((other) => parseInt(other.trim()) || 0); // Add a fallback value if parsing fails
      const fitnesses = selfData.fitness
        .split(",")
        .map((fitness) => parseInt(fitness.trim()) || 0);
      //finding if the any of the strings present in the documents
      const interest = await Interest.find({ intrest_id: { $in: interests } });
      const funActivity = await FunActivity.find({
        funActivity_id: { $in: funActivities },
      });
      const fitness = await Fitness.find({ fitness_id: { $in: fitnesses } });
      const other = await Other.find({ other_id: { $in: others } });

      selfData.interestsTypes = interest
        ?.map((item) => item.intrest_name)
        ?.join(", ");
      selfData.funActivitiesTypes = funActivity
        ?.map((item) => item.funActivity_name)
        ?.join(", ");
      selfData.fitnessTypes = fitness
        ?.map((item) => item.fitness_name)
        ?.join(", ");
      selfData.otherTypes = other?.map((item) => item.other_name)?.join(", ");
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
      const education = await Education.find({
        education_id: { $in: educations },
      });
      const diet = await Diet.find({
        diet_id: { $in: diets },
      });

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

exports.createProfession = async (req, res) => {
  try {
    const { professionName } = req.body;
    const count = await Proffesion.countDocuments();

    const professionId = count + 1;

    const profession = new Proffesion({
      profession_name: professionName,
      profession_id: parseInt(professionId),
    });

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
