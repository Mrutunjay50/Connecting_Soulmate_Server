const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");

const User = require("../models/Users");

dotenv.config();

const signinController = async (req, res) => {
  const { number } = req.body;
  if (!number.trim())
    return res.status(400).json({ message: "Invalid field!" });
  try {
    const num = number.split("-")[1].trim();
    const countryCode = number.split("-")[0].trim();
    const existingUser = await User.findOne({ "createdBy.countryCode": countryCode, "createdBy.phone": num });

    if (!existingUser)
      return res.status(404).json({ message: "User doesn't exist!" });

    // console.log("Existing User:", existingUser);

    const token = jwt.sign(
      {
        number: existingUser.createdBy[0].phone,
        id: existingUser._id,
      },
      process.env.SECRET_KEY,
      { expiresIn: "48h" }
    );

    res.status(200).json({ existingUser, token });
  } catch (err) {
    console.error("Error:", err);
    res.status(500).json({ message: "Something went wrong!" });
  }
};


const signupController = async (req, res) => {
  try {
    let { name, createdFor, gender, phone } = req.body;
    phone = phone?.trim()
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

    console.log(savedUser);

    res.status(201).json(savedUser);
    // res.status(201).json(newUser);
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
