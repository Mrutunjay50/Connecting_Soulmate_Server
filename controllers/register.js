const User = require("../models/Users");
const {
  resizeImage,
  uploadToS3,
  generateFileName,
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
        console.log(req.body.careerDetails);
        user.careerDetails[0] = { ...req.body.careerDetails };
        break;
      case "4":
        const { familyAnnualIncome, country, state, city } =
          req.body.familyDetails;

        user.familyDetails[0] = {
          ...req.body.familyDetails,
          familyAnnualIncomeStart: familyAnnualIncome.start,
          familyAnnualIncomeEnd: familyAnnualIncome.end,
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
        // Upload user photos to S3

        if (userPhotos) {
          for (var i = 0; i < userPhotos.length; i++) {
            const { buffer, originalname, mimetype } = userPhotos[i];

            // a function for resizing images
            const resizedImageBuffer = await resizeImage(buffer);
            const fileName = generateFileName(originalname);

            // a function for uploading to S3
            await uploadToS3(resizedImageBuffer, fileName, mimetype);

            // Update userPhotos array with the generated file name
            userPhotos[i].originalname = fileName;
          }
        }
        if (userPhotos && user.selfDetails.length > 0) {
          // If 'selfDetails' already exists, update 'userPhotos' array
          user.selfDetails[0].userPhotos = userPhotos.map(
            (photo) => photo.originalname
          );
          const newSelfDetails = {
            userPhotos: userPhotos.map((photo) => photo.originalname),
            profilePicture:
              userPhotos.length > 0 ? userPhotos[0].originalname : null,
            aboutYourself: aboutYourself,
            interests: interests,
            fun: fun,
            fitness: fitness,
            other: other,
          };

          user.selfDetails[0] = { ...newSelfDetails };
          await user.save();
        } else {
          // If 'selfDetails' doesn't exist, create it with 'userPhotos' array
          const newSelfDetails = {
            userPhotos: userPhotos.map((photo) => photo.originalname),
            profilePicture:
              userPhotos.length > 0 ? userPhotos[0].originalname : null,
            aboutYourself: aboutYourself,
            interests: interests,
            fun: fun,
            fitness: fitness,
            other: other,
          };

          user.selfDetails = [newSelfDetails];
          await user.save();
        }

        break;
      case "6":
        const { ageRange, heightrange, annualIncomeRange } =
          req.body.partnerPreference;
        user.partnerPreference[0] = {
          ...req.body.partnerPreference,
          ageRangeStart: ageRange.start,
          ageRangeEnd: ageRange.end,
          heightRangeStart: heightrange.start,
          heightRangeEnd: heightrange.end,
          annualIncomeRangeStart: annualIncomeRange.start,
          annualIncomeRangeEnd: annualIncomeRange.end,
        };
        break;
      default:
        return res.status(400).json({ error: "Invalid page number" });
    }

    console.log(user);
    // Save the updated user document
    await user.save();

    res.status(200).json({ message: "Data added successfully", user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
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

    let pageData;

    switch (page) {
      case "1":
        pageData = user.basicDetails[0];
        break;
      case "2":
        pageData = user.additionalDetails[0];
        break;
      case "3":
        pageData = user.careerDetails[0];
        break;
      case "4":
        pageData = user.familyDetails[0];
        break;
      case "5":
        pageData = user.selfDetails[0];
        break;
      case "6":
        pageData = user.partnerPreference[0];
        break;
      default:
        return res.status(400).json({ error: "Invalid page number" });
    }

    res.status(200).json({ message: "Data fetched successfully", pageData });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
