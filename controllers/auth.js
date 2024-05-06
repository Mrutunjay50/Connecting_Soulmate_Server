const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");

dotenv.config();

const User = require("../models/Users");
const { UserDetail } = require("otpless-node-js-auth-sdk");
const { getSignedUrlFromS3 } = require("../utils/s3Utils");
const { getAggregationPipelineForUsers } = require("../helper/aggregationPipelineForUsers");

const client_id = process.env.CLIENT_ID;
const client_secret = process.env.CLIENT_SECRET;
const channel = "WHATSAPP";

dotenv.config();

const signinController = async (req, res) => {
  const { code } = req.body;
  console.log(req.body);
  try {
    const user = await UserDetail.verifyCode(code, client_id, client_secret);
    console.log(user);
    const num = user.name;
    const existingUser = await User.findOne({
      "createdBy.phone": num,
    });

    if (!existingUser)
      return res.status(404).json({ message: "User doesn't exist!" });

    const token = jwt.sign(
      {
        number: existingUser.createdBy[0].phone,
        id: existingUser._id,
      },
      process.env.SECRET_KEY,
      { expiresIn: "30d" }
    );
    return res
      .status(200)
      .json({ existingUser, token, message: "Can Now Login" });
  } catch (err) {
    console.error("Error:", err);
    res.status(500).json({ message: "Something went wrong!" });
  }
};

const magicLinkController = async (req, res) => {
  try {
    const { number, email } = req.body;

    let redirectURI;
    let message;
    let notFound;

    if (!number.trim())
      return res.status(400).json({ message: "Invalid field!" });

    const mobile = number.split("-")[1].trim();
    const countryCode = number.split("-")[0].trim();
    const existingUser = await User.findOne({
      "createdBy.phone": countryCode + mobile,
    });
    console.log(existingUser);

    if (!existingUser) {
      redirectURI = `http://localhost:5173/signup/${parseInt(
        number.split("-").join("")
      )}`;
      notFound = { notFound: "You are New to our Website Please Signup!" };
    } else {
      if (existingUser.registrationPhase === "approved") {
        redirectURI = `http://localhost:5173/login/${parseInt(
          number.split("-").join("")
        )}`;
        message = "Already A User, Redirecting to login page...";
      } else if (
        existingUser.registrationPhase === "registering" &&
        existingUser.registrationPage !== ""
      ) {
        redirectURI = `http://localhost:5173/login/${parseInt(
          number.split("-").join("")
        )}`; // Change this to your registration form page
        message =
          "You are Currently in registration process Redirecting to registration form...";
      } else {
        redirectURI = `http://localhost:5173/signup/${parseInt(
          number.split("-").join("")
        )}`;
        message =
          "You have Once visited to our Website Please Continue the registeration Process, Redirecting to signup page...";
      }
    }

    const magicLinkTokens = await UserDetail.magicLink(
      parseInt(number.split("-").join("")),
      email,
      redirectURI,
      "",
      client_id,
      client_secret,
      channel
    );

    if (magicLinkTokens) {
      res.status(200).json({ message, notFound });
    }
  } catch (err) {
    console.error("Error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const signupController = async (req, res) => {
  try {
    let { name, createdFor, gender, phone } = req.body;
    phone = phone?.trim();
    const mapFrontendToEnum = {
      1: "myself",
      2: "myson",
      3: "mydaughter",
      4: "myrelative",
      5: "myfriend",
    };

    createdFor = mapFrontendToEnum[createdFor] || null;
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
      { expiresIn: "30d" }
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
    
    const profileUrl = await getSignedUrlFromS3(
      user.selfDetails?.profilePicture
    );
    user.selfDetails.profilePictureUrl = profileUrl || "";
    const signedUrlsPromises = user.selfDetails?.userPhotos.map((item) =>
      getSignedUrlFromS3(item)
    );
    try {
      const signedUrls = await Promise.all(signedUrlsPromises);
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

const getAllUsers = async (req, res, next) => {
  try {
    const user = await User.find({}).select("_id basicDetails.name createdBy.createdFor category gender userId createdAt").sort({ createdAt: -1 })
    .exec();

    if (!user) {
      const error = new Error("No Users found.");
      error.statusCode = 404;
      console.log(error);
    }
    res.status(200).json({ user });
  } catch (err) {
    console.log(err);
  }
};
module.exports = {
  signinController,
  signupController,
  magicLinkController,
  getUser,
  getAllUsers
};
