const {
  signinController,
  signupController,
  getUser,
  // magicLinkController
} = require("../controllers/auth");
const express = require("express");
const { getUserByIdForAdmin } = require("../controllers/admin");
const router = express.Router();

// const router = (app) => {
// router.post("/createMagicLink", magicLinkController);
router.post("/signup", signupController);
router.post("/signin", signinController);
router.get("/getUser/:userId", getUser);
router.get("/get-user-data-view/:userId", getUserByIdForAdmin);

module.exports = router;