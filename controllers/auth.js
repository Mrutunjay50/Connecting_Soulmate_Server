const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const axios = require("axios");
const dotenv = require("dotenv");

const User = require("../models/Users");

dotenv.config();

const signinController = async (req, res) => {
  const { number } = req.body;
  console.log(number);
  if (number === "")
    return res.status(400).json({ message: "Invalid field!" });
  try {
    const existingUser = await User.findOne({ "additionalDetails.contact" : number });
    // const existingUser = await User.findOne({ "createdBy.phone" : phoneNumber });

    if (!existingUser)
      return res.status(404).json({ message: "User don't exist!" });

    const token = jwt.sign(
      {
        email: existingUser.createdBy[0].phone,
        id: existingUser._id,
      },
      process.env.SECRET_KEY,
      { expiresIn: "48h" }
    );

    res.status(200).json({ existingUser, token });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Something went wrong!" });
  }
};

const signupController = async (req, res) => {
  try {
    let { name, createdFor, gender, phone } = req.body;
    
    const mapFrontendToEnum = {
      1: "myself",
      2: "myson",
      3: "mydaughter",
      4: "myrelative",
      5: "myfriend",
    };

    createdFor = mapFrontendToEnum[createdFor] || null;

    // Create a new user instance
    const newUser = new User({
      createdBy: [{ name, createdFor, gender, phone }],
      basicDetails: [],
      additionalDetails: [],
      carrierDetails: [],
      familyDetails: [],
      selfDetails: [],
      partnerPreference: [],
      gender : gender
    });

    // Save the user to the database
    const savedUser = await newUser.save();

    res.status(201).json(savedUser);
    // res.status(201).json(newUser);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const getUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.query.userId);
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
const getUserNo = async (req, res, next) => {
  try {
    const totalUsers = await User.countDocuments({});
    // console.log('Total number of users:', totalUsers);
    res.status(200).json({ TotalUsers: totalUsers });
  } catch (error) {
    console.error("Error counting users:", error);
    throw error; // You can handle the error as per your application's needs
  }
};

module.exports = {
    signinController,
  signupController,
  //   getUserNo,
    getUser,
};
