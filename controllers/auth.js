const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");

dotenv.config();

const User = require("../models/Users");
const { UserDetail } = require("otpless-node-js-auth-sdk");

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
    const countryCode = user.setCountryCode;
    const num = user.setNationalPhoneNumber;
    const existingUser = await User.findOne({
      "createdBy.countryCode": countryCode?.replace("+", ""),
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
      { expiresIn: user.authTime }
    );
    return res.status(200).json({ existingUser, token, message : "Can Now Login" });
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
      "createdBy.countryCode": countryCode,
      "createdBy.phone": mobile,
    });

    if (!existingUser) {
      redirectURI = "http://localhost:5173/signup";
      notFound = { notFound: "User doesn't exist!" };
    } else {
      if (existingUser.registrationPhase === "approved") {
        redirectURI = "http://localhost:5173/login";
        message = "Already A User, Redirecting to login page...";
      } else if (existingUser.registrationPhase === "registering") {
        redirectURI = `http://localhost:5173/registration-form/${existingUser.registrationPage}`; // Change this to your registration form page
        message = "You are Currently in registration process Redirecting to registration form...";
      } else {
        redirectURI = "http://localhost:5173/signup";
        message = "You are New to our Website Please Signup, Redirecting to signup page...";
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

    const newUser = new User({
      createdBy: [{ name, createdFor, gender, phone }],
      basicDetails: [],
      additionalDetails: [],
      carrierDetails: [],
      familyDetails: [],
      selfDetails: [],
      partnerPreference: [],
      gender: gender,
      registerationPhase: "registering"
    });

    const savedUser = await newUser.save();

    res.status(201).json({ savedUser });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const getUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) {
      const error = new Error("User not found.");
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
};
