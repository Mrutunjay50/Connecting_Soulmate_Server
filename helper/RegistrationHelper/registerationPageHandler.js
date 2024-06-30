const User = require("../../models/Users");
const ExchangeRate = require("../../models/exchangeRate");
const moment = require("moment");
const { generateFileName, uploadToS3, resizeImage } = require("../../utils/s3Utils");


function generateUniqueNumber() {
  const randomNumber = Math.floor(Math.random() * 100);
  const uniqueNumber = `${randomNumber}`;
  return uniqueNumber;
}

exports.handlePage1 = async (req, user) => {
  try {
    const { fname, mname, lname, dateOfBirth } = req.body.basicDetails;
    const currentDate = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = currentDate.getFullYear() - birthDate.getFullYear();
    const currentMonth = currentDate.getMonth();
    const birthMonth = birthDate.getMonth();
    // // Get current date and time as a formatted string
    // const formattedDatessss = currentDate.toISOString().replace(/T/, ' ').replace(/\..+/, '');

    // // Log user basicDetails with the current date and time
    // console.log(`[${formattedDatessss}] User basicDetails:`, req.body.basicDetails);
    if (
      currentMonth < birthMonth ||
      (currentMonth === birthMonth && currentDate.getDate() < birthDate.getDate())
    ) {
      age--;
    }

    if (age < 21) {
      throw new Error("You must be at least 21 years old to register.");
    }

    user.basicDetails[0] = {
      ...req.body.basicDetails,
      name: `${fname} ${mname} ${lname}`,
      gender: user.createdBy[0].gender,
      age: age.toString(),
    };
    user.registrationPhase = "registering";

    const genderPrefix = generateUniqueNumber();
    const namePrefix = user.basicDetails[0].name.slice(0, 2).toUpperCase();
    const dob = moment(user.basicDetails[0].dateOfBirth, "YYYY-MM-DD");
    const dobFormatted = dob.format("YYYYMM");
    const noOfUsers = await User.countDocuments({});
    const generatedUserId = `CS${namePrefix}${genderPrefix}${noOfUsers}${dobFormatted}`
      .toUpperCase()
      .replaceAll(" ", "");

    user.basicDetails[0].userId = generatedUserId;
    user.userId = generatedUserId;
  } catch (err) {
    console.error("Error in handlePage1:", err);
    throw err;
  }
};

exports.handlePage2 = async (req, user) => {
  const { contact } = req.body.additionalDetails;

  try {
    // Check if a user with the same email or contact number exists
    const existingUser = await User.findOne({
      $or: [{ 'additionalDetails.contact': contact }], _id: { $ne: user._id }
    });

    if (existingUser) {
      throw new Error('A user with the same email or phone number already exists.');
    }

    // If no user is found, update the additional details
    user.additionalDetails[0] = { ...req.body.additionalDetails };

  } catch (err) {
    // Handle any errors that occur
    console.error(err);
    return { error: 'An error occurred while updating the user.' };
  }
};

exports.handlePage3 = async (req, user) => {
  try {
    const { annualIncomeValue = 0, currencyType = "INR" } = req.body.careerDetails;
    const exchangeRate = await ExchangeRate.findOne({ currency: currencyType });
    let annualIncomeUSD = annualIncomeValue * exchangeRate?.rateToUSD;
    user.careerDetails[0] = { ...req.body.careerDetails, annualIncomeUSD : annualIncomeUSD.toString() };
  } catch (err) {
    console.error("Error in handlePage3:", err);
    throw err;
  }
};

exports.handlePage4 = async (req, user) => {
  try {
    const { annualIncomeValue, country, state, city } = req.body.familyDetails;
    user.familyDetails[0] = {
      ...req.body.familyDetails,
      familyAnnualIncomeStart: annualIncomeValue,
      familyLocationCountry: country,
      familyLocationState: state,
      familyLocationCity: city,
    };

  } catch (err) {
    console.error("Error in handlePage4:", err);
    throw err;
  }
};

exports.handlePage5 = async (req, user, type) => {
  try {
    const userPhotos = req.files;
    const { aboutYourself, interests, fun, fitness, other, profilePicture, profileImage } = JSON.parse(req.body.selfDetails);
  
    console.log(aboutYourself, interests, fun, fitness, other, profilePicture, profileImage);

    if (!user.selfDetails || !user.selfDetails[0]) {
      user.selfDetails = [{}];
    }

    const selfDetails = user.selfDetails[0];

    if (type === "edit") {
      // Only update the interests, fun, fitness, and other fields
      // selfDetails.aboutYourself = aboutYourself;
      selfDetails.interests = interests;
      selfDetails.fun = fun;
      selfDetails.fitness = fitness;
      selfDetails.other = other;
    } else {
      // Update all fields, including profilePicture and userPhotos
      selfDetails.profilePicture = profileImage;
      selfDetails.aboutYourself = aboutYourself;
      selfDetails.interests = interests;
      selfDetails.fun = fun;
      selfDetails.fitness = fitness;
      selfDetails.other = other;
  
      if (userPhotos && userPhotos.length > 0) {
        if (selfDetails.userPhotos && selfDetails.userPhotos.length + userPhotos.length > 5) {
          const excessCount = selfDetails.userPhotos.length + userPhotos.length - 5;
          selfDetails.userPhotos.splice(0, excessCount);
        }
  
        try {
          const uploadedPhotos = await Promise.all(
            userPhotos.map(async (photo) => {
              const { buffer, originalname, mimetype } = photo;
              const resizedImageBuffer = await resizeImage(buffer);
              const fileName = generateFileName(originalname);
              await uploadToS3(resizedImageBuffer, fileName, mimetype);
              if (originalname === profilePicture) {
                selfDetails.profilePicture = String(fileName); 
              } 
              return fileName;
            })
          );
          selfDetails.userPhotos.push(...uploadedPhotos);
        } catch (error) {
          console.error("Error uploading images to S3:", error);
        }
      }
    }
  } catch (err) {
    console.error("Error in handlePage5:", err);
  }
};


exports.handlePage6 = async (req, user) => {
  try {
    let {
      ageRangeStart,
      ageRangeEnd,
      heightRangeStart,
      heightRangeEnd,
      annualIncomeValue,
      annualIncomeRangeEnd,
      // community
    } = req.body.partnerPreference;

    if (req.body.partnerPreference && req.body.partnerPreference.education) {
      if (Array.isArray(req.body.partnerPreference.education)) {
        req.body.partnerPreference.education =
          req.body.partnerPreference.education.toString();
      }
    }
    if (req.body.partnerPreference && req.body.partnerPreference.maritalStatus) {
      if (Array.isArray(req.body.partnerPreference.maritalStatus)) {
        req.body.partnerPreference.maritalStatus =
          req.body.partnerPreference.maritalStatus.toString();
      }
    }
    if (req.body.partnerPreference && req.body.partnerPreference.dietType) {
      if (Array.isArray(req.body.partnerPreference.dietType)) {
        req.body.partnerPreference.dietType = req.body.partnerPreference.dietType.toString();
      }
    }
    if (req.body.partnerPreference && req.body.partnerPreference.profession) {
      if (Array.isArray(req.body.partnerPreference.profession)) {
        req.body.partnerPreference.profession = req.body.partnerPreference.profession.toString();
      }
    }
    // if (req.body.partnerPreference && req.body.partnerPreference.community) {
    //   if (Array.isArray(req.body.partnerPreference.community)) {
    //     req.body.partnerPreference.community = req.body.partnerPreference.community.toString();
    //   }
    // }

    user.partnerPreference[0] = {
      ...req.body.partnerPreference,
      dietType: req.body.partnerPreference.dietType,
      profession: req.body.partnerPreference.profession,
      ageRangeStart: ageRangeStart,
      ageRangeEnd: ageRangeEnd,
      heightRangeStart: heightRangeStart,
      heightRangeEnd: heightRangeEnd,
      annualIncomeRangeStart: annualIncomeValue,
      annualIncomeRangeEnd: annualIncomeRangeEnd,
    };

  } catch (err) {
    console.error("Error in handlePage6:", err);
    throw err;
  }
};