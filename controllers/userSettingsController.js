const User = require("../models/Users");
const brevo = require("@getbrevo/brevo");
const dotenv = require("dotenv");

dotenv.config();

const BREVO_API = process.env.BREVO_API_KEY;
const EMAIL_FROM = process.env.DOMAIN_EMAIL;
const DOMAIN = process.env.FRONTEND_URL;

const SibApiV3Sdk = require("@getbrevo/brevo");

let apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();

let apiKey = apiInstance.authentications["apiKey"];
apiKey.apiKey = BREVO_API;

let sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();

exports.generateLinkForChangingRegisteredNumber = async (req, res) => {
  try {
    const { userId, email } = req.body;

    // Check if the user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const verificationLink = `${DOMAIN}/change-register-number/${userId}/${email}`;

    sendSmtpEmail.subject = "Change Registered Number Verification";
    sendSmtpEmail.htmlContent = `<p>Click the link below to change your registered number:</p><p><a href="${verificationLink}">Verify Email Address amd Change Your Number</a></p>`;
    sendSmtpEmail.sender = { name: "Your Sender Name", email: EMAIL_FROM }; // Replace with your sender details
    sendSmtpEmail.to = [{ email: email }];

    // Send the email
    apiInstance
      .sendTransacEmail(sendSmtpEmail)
      .then(function (data) {
        console.log("Email sent successfully");
        res
          .status(200)
          .json({ message: "Verification link sent successfully" });
      })
      .catch(function (error) {
        console.error("Error sending email:", error);
        res.status(500).json({ error: "Failed to send verification link" });
      });
  } catch (error) {
    console.error("Error changing registered number:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.changeRegisteredNumber = async (req, res) => {
  try {
    const { number, userId } = req.body;

    // Find the user by userId
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Set isDeleted to true and deleteReason
    user.createdBy[0].phone = number;

    // Save the updated user
    await user.save();
    res.status(200).json({ message: "Number Changed successfully" });
  } catch (error) {
    console.error("Error changing registered number:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.subscribeEveryFifteenDays = async (req, res) => {};

exports.deleteProfile = async (req, res) => {
  try {
    const { userId, deleteReason } = req.body;

    // Find the user by userId
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Set isDeleted to true and deleteReason
    user.isDeleted = true;
    user.deleteReason = deleteReason;

    // Save the updated user
    await user.save();

    res.status(200).json({ message: "Profile deleted successfully" });
  } catch (error) {
    console.error("Error deleting profile:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.updateContactInfo = async (req, res) => {
  try {
    const { userId, email, phone } = req.body;

    // Find the user by userId
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Update email if it's not empty
    if (email.trim() !== "") {
      user.additionalDetails[0].email = email;
    }

    // Update contact if it's not empty
    if (phone.trim() !== "") {
      user.additionalDetails[0].contact = phone;
    }

    await user.save();

    res.status(200).json({ message: "Contact info updated successfully" });
  } catch (error) {
    console.error("Error updating contact info:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
