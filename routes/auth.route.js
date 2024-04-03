const { body, validationResult } = require("express-validator");
const {
  signinController,
  signupController,
  getUser,
  getUserNo,
} = require("../controllers/auth");
const express = require("express");
const {
  getAllUsers,
  createMatch,
  getMatchesNewlyJoined,
  sendMatchRequest,
  respondToMatchRequest,
  addToShortlist,
  getShortlistedUser,
  getAllMatches,
  getUserMatches,
  deleteMatchById,
} = require("../controllers/matchingProfile");
const router = express.Router();
const validateSignupInput = [
  body("email")
    .if((value, { req }) => !req.body.googleAccessToken) // Skip validation for Google signup
    .isEmail()
    .withMessage("Invalid email address")
    .bail(),
  body("password")
    .if((value, { req }) => !req.body.googleAccessToken)
    .isLength({ min: 4 })
    .withMessage("Password must be at least 4 characters long")
    .bail(),
  body("confirmPassword")
    .if((value, { req }) => !req.body.googleAccessToken)
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error("Passwords do not match");
      }
      return true;
    }),
  body("name")
    .if((value, { req }) => !req.body.googleAccessToken)
    .notEmpty()
    .withMessage("Name is required"),

  // Handle validation errors
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorMessage = errors
        .array()
        .find((error) => error.param === "email")
        ? "No email provided"
        : errors.array()[0].msg; // Send the first validation error message
      return res.status(400).json({ message: errorMessage });
    }
    next();
  },
];

// const router = (app) => {
router.post("/signup", signupController);
router.get("/new/getUser", getAllUsers);

router.get("/newlyJoined", getMatchesNewlyJoined);

// Route to send a match request
router.post("/matches/send-request", async (req, res) => {
  try {
    const { senderId, recipientId } = req.body;
    const matchRequest = await sendMatchRequest(senderId, recipientId);
    res.status(201).json(matchRequest);
  } catch (error) {
    console.error("Error sending match request:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Route to respond to a match request
router.post("/matches/respond", async (req, res) => {
  try {
    const { matchRequestId, response } = req.body;
    await respondToMatchRequest(matchRequestId, response);
    res.status(200).json({ message: "Match request responded successfully" });
  } catch (error) {
    console.error("Error responding to match request:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/shortlist/add", addToShortlist);
router.get("/shortlist/get/:UserId", getShortlistedUser);
router.get("/matches/get", getAllMatches);
router.get("/matches/get/:userId", getUserMatches);

// router.get("/usersno", getUserNo);
// };

module.exports = router;
