const User = require("../models/Users");
const ExchangeRate = require("../models/exchangeRate");
const moment = require("moment");
const { generateFileName, uploadToS3 } = require("../utils/s3Utils");


function generateUniqueNumber() {
  const randomNumber = Math.floor(Math.random() * 100);
  const uniqueNumber = `${randomNumber}`;
  return uniqueNumber;
}

exports.handlePage1 = async (req, user) => {
  const { fname, mname, lname, dateOfBirth } = req.body.basicDetails;
  const currentDate = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = currentDate.getFullYear() - birthDate.getFullYear();
  const currentMonth = currentDate.getMonth();
  const birthMonth = birthDate.getMonth();

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
  user.basicDetails[0].userId =
    `CS${namePrefix}${genderPrefix}${noOfUsers}${dobFormatted}`
      ?.toUpperCase()
      .replaceAll(" ", "");
};

exports.handlePage2 = async (req, user) => {
  user.additionalDetails[0] = { ...req.body.additionalDetails };
};

exports.handlePage3 = async (req, user) => {
  const { annualIncomeValue, currencyType } = req.body.careerDetails;
  const exchangeRate = await ExchangeRate.findOne({ currency: currencyType });
  let annualIncomeUSD = annualIncomeValue * exchangeRate?.rateToUSD;
  user.careerDetails[0] = { ...req.body.careerDetails, annualIncomeUSD };
};

exports.handlePage4 = async (req, user) => {
  const { annualIncomeValue, country, state, city } = req.body.familyDetails;
  user.familyDetails[0] = {
    ...req.body.familyDetails,
    familyAnnualIncomeStart: annualIncomeValue,
    familyLocationCountry: country,
    familyLocationState: state,
    familyLocationCity: city,
  };
};

exports.handlePage5 = async (req, user) => {
  const userPhotos = req.files;
  const { aboutYourself, interests, fun, fitness, other, profilePicture, profileImage } =
    JSON.parse(req.body.selfDetails);

    console.log(aboutYourself, interests, fun, fitness, other, profilePicture);
  if (!user.selfDetails || !user.selfDetails[0]) {
    user.selfDetails = [{}];
  }

  const selfDetails = user.selfDetails[0];
  selfDetails.profilePicture = profileImage;
  selfDetails.aboutYourself = aboutYourself;
  selfDetails.interests = interests;
  selfDetails.fun = fun;
  selfDetails.fitness = fitness;
  selfDetails.other = other;

  if (userPhotos && userPhotos.length > 0) {
    if (
      selfDetails.userPhotos &&
      selfDetails.userPhotos.length + userPhotos.length > 5
    ) {
      const excessCount = selfDetails.userPhotos.length + userPhotos.length - 5;
      selfDetails.userPhotos.splice(0, excessCount);
    }

    try {
      const uploadedPhotos = await Promise.all(
        userPhotos.map(async (photo) => {
          const { buffer, originalname, mimetype } = photo;
          const resizedImageBuffer = await buffer;
          const fileName = generateFileName(originalname);
          await uploadToS3(resizedImageBuffer, fileName, mimetype);
          if(originalname === profilePicture){
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
};

exports.handlePage6 = async (req, user) => {
  let {
    ageRangeStart,
    ageRangeEnd,
    heightRangeStart,
    heightRangeEnd,
    annualIncomeValue,
    annualIncomeRangeEnd
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

  console.log(req.body);
  user.partnerPreference[0] = {
    ...req.body.partnerPreference,
    dietType : req.body.partnerPreference.dietType,
    profession :req.body.partnerPreference.profession,
    ageRangeStart: ageRangeStart,
    ageRangeEnd: ageRangeEnd,
    heightRangeStart: heightRangeStart,
    heightRangeEnd: heightRangeEnd,
    annualIncomeRangeStart: annualIncomeValue,
    annualIncomeRangeEnd: annualIncomeRangeEnd,
  };
};
