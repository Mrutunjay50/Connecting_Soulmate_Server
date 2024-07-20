const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");

dotenv.config();

const User = require("../models/Users");
// const { UserDetail } = require("otpless-node-js-auth-sdk");
const { getPublicUrlFromS3 } = require("../utils/s3Utils");
const { getAggregationPipelineForUsers } = require("../helper/AggregationOfUserData/aggregationPipelineForUsers");
const BannedUsers = require("../models/bannedUsers");

// const client_id = process.env.CLIENT_ID;
// const client_secret = process.env.CLIENT_SECRET;
// const channel = "WHATSAPP";
// const DOMAIN = process.env.FRONTEND_URL;

const threeMonthsInSeconds = 3 * 30 * 24 * 60 * 60;

const signinController = async (req, res) => {
  const { num, expiryTime } = req.body;
  console.log(req.body);
  try {
    // const user = await UserDetail.verifyCode(code, client_id, client_secret);
    // console.log(user);
    // const num = user.name;

    // Check if the user is in the banned list
    const bannedUser = await BannedUsers.findOne({ contact: num });
    if (bannedUser) {
      return res.status(403).json({ message: "You are banned" });
    }

    const existingUser = await User.findOne({
      "createdBy.phone": num,
    });

    if (!existingUser){
      return res.status(200).json({ message: "User doesn't exist! Redirecting to Signup Page" });
    }


    // Check if declinedOn date exists and is older than 15 days
    if (existingUser.declinedOn) {
      const declinedDate = new Date(existingUser.declinedOn);
      const currentDate = new Date();
      const daysDifference = Math.floor((currentDate - declinedDate) / (1000 * 60 * 60 * 24));

      if (daysDifference > 15) {
        // Delete user data
        await User.deleteOne({ _id: existingUser._id });

        return res.status(200).json({ message: "Your previous data has been deleted. You can now re-signup." });
      }
    }

    const aggregationPipeline = getAggregationPipelineForUsers(existingUser._id);
    let aggregatedData = await User.aggregate(aggregationPipeline);
    
    if (aggregatedData.length === 0) {
      return res.status(404).json({ error: "User data not found." });
    }
    
    let user = aggregatedData[0]; // Get the first element of the aggregated result
    
    const profileUrl = getPublicUrlFromS3(
      user.selfDetails?.profilePicture
    );
    user.selfDetails.profilePictureUrl = profileUrl || "";
    const signedUrlsPromises = user.selfDetails?.userPhotos?.map((item) =>
      getPublicUrlFromS3(item)
    );
    try {
      const signedUrls = signedUrlsPromises;
      user.selfDetails.userPhotosUrl = signedUrls;
    } catch (error) {
      console.error("Error:", error);
    }

    const token = jwt.sign(
      {
        number: existingUser.createdBy[0].phone,
        id: existingUser._id,
      },
      process.env.SECRET_KEY,
      { expiresIn: expiryTime || threeMonthsInSeconds }
    );
    
    existingUser.lastLogin = new Date().toISOString();
    const isNotification = existingUser?.isNotification || false;
    const isAdminNotification = existingUser?.isAdminNotification || false;
    await existingUser.save();

    return res
      .status(200)
      .json({ user, existingUser, token, isNotification, isAdminNotification, message: "Can Now Login" });
  } catch (err) {
    console.error("Error:", err);
    res.status(500).json({ message: "Something went wrong!" });
  }
};

// const magicLinkController = async (req, res) => {
//   try {
//     const { number, email } = req.body;

//     if (!number.trim()) {
//       return res.status(400).json({ message: "Invalid field!" });
//     }

//     const mobile = number.split("-")[1].trim();
//     const countryCode = number.split("-")[0].trim();
//     const existingUser = await User.findOne({
//       "createdBy.phone": countryCode + mobile,
//     });

//     let expiryTime;

//     if (!existingUser) {
//       const redirectURI = `${DOMAIN}/signup/${parseInt(number.split("-").join(""))}`;
//       const notFound = { notFound: "You are New to our Website Please Signup!" };

//       const magicLinkTokens = await UserDetail.magicLink(
//         parseInt(number.split("-").join("")),
//         email,
//         redirectURI,
//         "",
//         client_id,
//         client_secret,
//         channel
//       );

//       if (magicLinkTokens) {
//         return res.status(200).json({ message: "Magic link created for new user", notFound });
//       }
//     } else {
//       let message;
//       if (existingUser.isDeleted === true) {
//         message = "Your account is deleted";
//         expiryTime = "1h";
//         return res.status(200).json({ message, user: existingUser, expiryTime });
//       }else if (existingUser.accessType === "0" || existingUser.accessType === "1") {
//         message = "Redirecting to login page...";
//         expiryTime = threeMonthsInSeconds;
//       } else if (existingUser.registrationPhase === "approved") {
//         message = "Already A User, Redirecting to login page...";
//         expiryTime = threeMonthsInSeconds;
//       } else if (existingUser.registrationPhase === "notapproved") {
//         message = "Your Approval request has been Submitted wait until your request get accepted";
//         expiryTime = "1h";
//         return res.status(200).json({ message, user: existingUser, expiryTime });
//       } else if (existingUser.registrationPhase === "rejected") {
//         message = "Your Approval request has been declined, Kindly checkout whether your information is valid or not";
//         expiryTime = "1h";
//       } else if (existingUser.registrationPhase === "registering" && existingUser.registrationPage !== "") {
//         message = "You are currently in the registration process. Redirecting to registration form...";
//         expiryTime = "1h";
//       } else {
//         message = "You have once visited our website. Please continue the registration process. Redirecting to signup page...";
//         expiryTime = "1h";
//       }

//       const redirectURI = `${DOMAIN}/login/${parseInt(number.split("-").join(""))}?expiryTime=${expiryTime}`;
//       const magicLinkTokens = await UserDetail.magicLink(
//         parseInt(number.split("-").join("")),
//         email,
//         redirectURI,
//         "",
//         client_id,
//         client_secret,
//         channel
//       );

//       if (magicLinkTokens) {
//         return res.status(200).json({ message });
//       }
//     }
//   } catch (err) {
//     console.error("Error:", err);
//     res.status(500).json({ error: "Internal Server Error" });
//   }
// };


const signupController = async (req, res) => {
  try {
    let { name, createdFor, gender, phone } = req.body;
    phone = phone?.trim();
    const mapFrontendToEnum = {
      1: "myself",
      2: "myson",
      3: "mydaughter",
      4: "mybrother",
      5: "mysister",
      6: "myfriend",
      7: "myrelative"
    };

    createdFor = mapFrontendToEnum[createdFor] || null;
    // Check if the user is in the banned list
    const bannedUser = await BannedUsers.findOne({ contact: phone });
    if (bannedUser) {
      return res.status(403).json({ message: "This number is banned can't sigup with this number" });
    }
    // Check if user already exists with the provided phone number
    const existingUser = await User.findOne({ "createdBy.phone": phone });
    if (existingUser) {
      return res.status(409).json({ message: "User already exists" });
    }

    const newUser = new User({
      createdBy: [{ name, createdFor, gender, phone }],
      basicDetails: [],
      additionalDetails: [],
      carrierDetails: [],
      familyDetails: [],
      selfDetails: [],
      partnerPreference: [],
      gender: gender,
      registrationPhase: "registering",
      registrationPage: "1",
    });

    const savedUser = await newUser.save();

    const token = jwt.sign(
      {
        number: savedUser.createdBy[0].phone,
        id: savedUser._id,
      },
      process.env.SECRET_KEY,
      { expiresIn: threeMonthsInSeconds || '30d' }
    );

    res.status(201).json({ savedUser, token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const getUser = async (req, res, next) => {
  try {
    const userData = await User.findById(req.params.userId);
    if (!userData) {
      const error = new Error("User not found.");
      error.statusCode = 404;
      console.log(error);
      return res.status(404).json({ error: "User not found." });
    }
    const aggregationPipeline = getAggregationPipelineForUsers(req.params.userId);
    let aggregatedData = await User.aggregate(aggregationPipeline);
    
    if (aggregatedData.length === 0) {
      return res.status(404).json({ error: "User data not found." });
    }
    
    let user = aggregatedData[0]; // Get the first element of the aggregated result
    
    const profileUrl = getPublicUrlFromS3(
      user.selfDetails?.profilePicture
    );
    user.selfDetails.profilePictureUrl = profileUrl || "";
    const signedUrlsPromises = user.selfDetails?.userPhotos?.map((item) =>
      getPublicUrlFromS3(item)
    );
    try {
      const signedUrls = signedUrlsPromises;
      user.selfDetails.userPhotosUrl = signedUrls;
    } catch (error) {
      console.error("Error:", error);
    }
    res.status(200).json({ user });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};


module.exports = {
  signinController,
  signupController,
  // magicLinkController,
  getUser,
};
