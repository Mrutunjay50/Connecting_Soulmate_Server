const {
  getUserAggregationPipeline,
} = require("../helper/getUserAggregationPipeline");
const User = require("../models/Users");
const ExchangeRate = require("../models/exchangeRate");
const { Proffesion, FunActivity, Interest, Other, Fitness } = require("../models/masterSchemas");
const {
  resizeImage,
  uploadToS3,
  generateFileName,
  getSignedUrlFromS3,
  deleteFromS3,
} = require("../utils/s3Utils");
const moment = require("moment");

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
        const genderPrefix = user.basicDetails[0].gender;
        const namePrefix = user.basicDetails[0].name.slice(0, 3).toUpperCase();
        const dob = moment(user.basicDetails[0].dateOfBirth, "YYYY-MM-DD");
        const dobFormatted = dob.format("YYYYMMDD");
        const timeOfBirth = user.basicDetails[0].timeOfBirth.replace(":", "");
        const loginTime = moment().format("HHmmss");

        user.basicDetails[0].userId =
          `${genderPrefix}${namePrefix}${dobFormatted}${timeOfBirth
            .split(" ")
            .join("")}${loginTime}`
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

        if (
          user.selfDetails.length > 0 &&
          userPhotos &&
          userPhotos.length > 0
        ) {
          // If 'selfDetails' and 'userPhotos' exist, delete existing images from S3
          const existingPhotos = user.selfDetails[0].userPhotos;
          if (existingPhotos && existingPhotos.length > 0) {
            try {
              // Delete existing images from S3
              await Promise.all(existingPhotos.map(deleteFromS3));
            } catch (error) {
              console.error("Error deleting existing images:", error);
            }
          }
        }

        // Upload new user photos to S3
        if (userPhotos && userPhotos.length > 0) {
          for (var i = 0; i < userPhotos.length; i++) {
            const { buffer, originalname, mimetype } = userPhotos[i];

            // Resize images if needed
            const resizedImageBuffer = await buffer;
            const fileName = generateFileName(originalname);

            // Upload resized images to S3
            try {
              await uploadToS3(resizedImageBuffer, fileName, mimetype);
              // Update userPhotos array with the generated file name
              userPhotos[i].originalname = fileName;
            } catch (error) {
              console.error("Error uploading image to S3:", error);
            }
          }
        }

        const newSelfDetails = {
          userPhotos: userPhotos
            ? userPhotos.map((photo) => photo.originalname)
            : [],
          profilePicture:
            userPhotos && userPhotos.length > 0
              ? userPhotos[0].originalname
              : null,
          aboutYourself: aboutYourself,
          interests: interests,
          fun: fun,
          fitness: fitness,
          other: other,
        };

        if (user.selfDetails.length > 0) {
          // If 'selfDetails' already exist, update it with new details
          user.selfDetails[0] = { ...newSelfDetails };
        } else {
          // If 'selfDetails' doesn't exist, create it with new details
          user.selfDetails = [newSelfDetails];
        }

        await user.save();
        break;

      case "6":
        var {
          ageRangeStart,
          ageRangeEnd,
          heightRangeStart,
          heightRangeEnd,
          annualIncomeValue,
          annualIncomeRange,
        } = req.body.partnerPreference;
        user.partnerPreference[0] = {
          ...req.body.partnerPreference,
          ageRangeStart: ageRangeStart,
          ageRangeEnd: ageRangeEnd,
          heightRangeStart: heightRangeStart,
          heightRangeEnd: heightRangeEnd,
          annualIncomeRangeStart: annualIncomeValue,
          annualIncomeRangeEnd: "",
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

    const selfData = pageData[0].selfDetails;

    // Add image URL setup for page 5
    if (page === "5" && pageData.length > 0) {
      const signedUrlsPromises = selfData.userPhotos.map(
        (item) => getSignedUrlFromS3(item)
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
      const interests = selfData.interests.split(",").map((interest) => parseInt(interest.trim()));
      const funActivities = selfData.fun.split(",").map((activity) => parseInt(activity.trim()));
      const others = selfData.other.split(",").map((other) => parseInt(other.trim()));
      const fitnesses = selfData.fitness.split(",").map((fitness) => parseInt(fitness.trim()));
      
      const interest = await Interest.find({ intrest_id: { $in: interests } });
      const funActivity = await FunActivity.find({ funActivity_id: { $in: funActivities } });
      const fitness = await Fitness.find({ fitness_id: { $in: fitnesses } });
      const other = await Other.find({ other_id: { $in: others } });

      selfData.interestsTypes = interest?.map((item) => item.intrest_name)?.join(", ");
      selfData.funActivitiesTypes = funActivity?.map((item) => item.funActivity_name)?.join(", ");
      selfData.fitnessTypes =  fitness?.map((item) => item.fitness_name)?.join(", ");
      selfData.otherTypes = other?.map((item) => item.other_name)?.join(", ");
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
