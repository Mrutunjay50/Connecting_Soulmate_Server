const { body, validationResult } = require("express-validator");
const {
  signinController,
  signupController,
  getUser,
  magicLinkController,
  getAllUsers,
  getAllPendingUsers,
} = require("../controllers/auth");
const express = require("express");
const { isAdmin } = require("../middleware/is_auth");
const router = express.Router();
const validateSignupInput = [
  body("email")
    .if((value, { req }) => !req.body.googleAccessToken)
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
router.post("/createMagicLink", magicLinkController);
router.post("/signup", signupController);
router.post("/signin", signinController);
router.get("/getUser/:userId", getUser);
router.get("/get-all-users",isAdmin ,getAllUsers);
router.get("/get-all-pending-users",isAdmin ,getAllPendingUsers);

module.exports = router;
