const User = require("../models/Users");
const io = require("../socket");
const dotenv = require("dotenv");
const { sendEmail } = require("../utils/emailUtils");

dotenv.config();

const DOMAIN = process.env.FRONTEND_URL;
const { getSignedUrlFromS3, getPublicUrlFromS3 } = require("../utils/s3Utils");
const SuccessfulMarriage = require("../models/successFullMarraige");
const { sendDeleteEmail, sendChangeRegistrationEmail } = require("../helper/emailGenerator/emailHelper");
const { City, State } = require("../models/masterSchemas");
const LOGO_URL = process.env.LOGO_IMAGE_URL;

exports.generateLinkForChangingRegisteredNumber = async (req, res) => {
  try {
    const { userId } = req.body;
    // Check if the user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Check if the user has provided an email
    const email = user?.additionalDetails[0]?.email;
    if (!email || email.trim() === "") {
      return res.status(400).json({ error: "You have not provided an email for this account." });
    }

    const verificationLink = `${DOMAIN}/change-register-number/${userId}/${email}`;
    await sendChangeRegistrationEmail(user?.additionalDetails[0]?.email, user?.basicDetails[0]?.name || "user", verificationLink);

    return res.status(200).json({ message: "Verification link sent successfully" });
  } catch (error) {
    console.log(error);
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

    // Check if the number is already used by another user
    const alreadyUserWithNumber = await User.find({"createdBy.phone" : number, _id: { $ne: userId } });
    if (alreadyUserWithNumber.length > 0) {
      return res.status(403).json({ error: "User with this number already exists try another number" });
    }
    // Set isDeleted to true and deleteReason
    user.createdBy[0].phone = number;

    // Save the updated user
    await user.save();
    io.getIO().emit(`registeredNumberChanged/${user._id}`, { "message": "number changed login again" });
    res.status(200).json({ message: "Number Changed successfully" });
  } catch (error) {
    console.error("Error changing registered number:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.subscribeEveryFifteenDays = async (req, res) => {
    try {
        const { userId, isValue} = req.body;
    
        // Find the user by userId
        const user = await User.findById(userId);
        if (!user) {
          return res.status(404).json({ error: "User not found" });
        }
    
        // Set isDeleted to true and deleteReason
        user.isEmailSubscribed = isValue;
    
        // Save the updated user
        await user.save();
    
        res.status(200).json({ message: "subscribed successfully" });
      } catch (error) {
        console.error("Error subscribing email :", error);
        res.status(500).json({ error: "Internal Server Error" });
      }
};


exports.sendLatestUserDetails = async () => {
  try {
    const restrict = true;
    const subject = "Newly Joined - Connecting Soulmate"
      // Retrieve all users' email and gender who are subscribed to emails
      const users = await User.find(
          { isEmailSubscribed: true, registrationPhase : "approved" },
          "additionalDetails.email gender category basicDetails.name"
      ).sort({ createdAt: -1 });

      // Iterate over each user
      for (const user of users) {
          const { gender, category } = user;
          const queryGender = gender === "F" ? "M" : "F";
          const categoryRegex = new RegExp(`(^|,| )${category}(,|$| )`);
          // Find the three latest user details for the current user, excluding the current user
          const latestDetails = await User.find(
              { gender: queryGender, _id: { $ne: user._id }, category: categoryRegex, registrationPhase : "approved" },
              "additionalDetails basicDetails selfDetails careerDetails"
          ).limit(4).sort({ createdAt: -1 });

          // Retrieve signed URLs for profile pictures and user photos
          const latestDetailsWithUrls = await Promise.all(latestDetails.map(async detail => {
            if (detail?.selfDetails && detail.selfDetails[0]) {
              const profileUrl = await getPublicUrlFromS3(detail.selfDetails[0].profilePicture || "");
              detail.selfDetails[0].profilePictureUrl = profileUrl || "";
            } else {
              // Initialize selfDetails with an empty object if it doesn't exist
              detail.selfDetails = [{}];
              const profileUrl = await getPublicUrlFromS3(""); // Generate URL for empty profile picture
              detail.selfDetails[0].profilePictureUrl = profileUrl || "";
            }
            // Fetch city and state names
            if (detail?.additionalDetails && detail.additionalDetails[0]) {
              const { currentlyLivingInCity, currentlyLivingInState } = detail.additionalDetails[0];
            
              if (currentlyLivingInCity) {
                const cityData = await City.findOne({ city_id: currentlyLivingInCity });
                detail.additionalDetails[0].currentCityName = cityData?.city_name || "";
              }
            
              if (currentlyLivingInState) {
                const stateData = await State.findOne({ state_id: currentlyLivingInState });
                detail.additionalDetails[0].currentStateName = stateData?.state_name || "";
              }
            } else {
              // Initialize additionalDetails with an empty object if it doesn't exist
              detail.additionalDetails = [{}];
              detail.additionalDetails[0].currentCityName = "";
              detail.additionalDetails[0].currentStateName = "";
            }
          
            return detail;
          }));
          // Construct HTML template with flex column layout for each user
          const emailContent = latestDetailsWithUrls.map(detail => (
              `<div
                  style="border: 1px solid #A92525; border-radius: 8px;  display: flex; flex-direction: column; align-items: center; width: 17%; padding-bottom: 20px;">
                <img src=${(detail?.selfDetails[0]?.profilePictureUrl)} alt="img" style="border-radius: 80px;  width: 50%;">
                  <div style="display: flex; flex-direction: column; align-items: start;">
                    <div style="padding-top: 7px;">${detail.basicDetails[0]?.name?.replaceAll("undefined", "") || "user"}</div>
                    <div style="padding-top: 7px;"> ${detail.basicDetails[0]?.age || 21} Yrs</div>
                    <div style="padding-top: 7px;"> ${detail.careerDetails[0]?.profession || ""}</div>
                    <div style="padding-top: 7px;">${detail.additionalDetails[0].currentCityName || ""}</div>
                    <div style="padding-top: 7px;">${detail.additionalDetails[0].currentStateName || ""}</div>
                  </div>
               </div>
              `
          )).join('');

          // Send the email to the user's email address

        const htmlContent = `
 <!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Document</title>
  </head>
  <body>
    <div>
      <div style="display: flex; align-items: center; margin-left: 8%; margin-top: 3%;">
        <span style="margin-right: 8%;">
        <img src="${LOGO_URL}" alt="img" style="border-radius: 50px; width: 80%;">
        </span>
      </div>
      <p style="margin-left: 9%;">Dear ${user?.basicDetails[0]?.name?.replaceAll("undefined", "")},<br><br>
        We hope you are having a good day! <br><br>
        Here are some new matches that we found for you. <br><br>
      </p>
      <div style="display: flex; gap: 20px; margin-left: 9%;">
        ${emailContent}
      </div>
      <div style="margin-top: 4%;">
        <a href="#"
          style="margin-left: 42%; text-decoration: none; background-color: #A92525; color: white; border-radius: 8px; padding: 9px;">View
        All..</a>
      </div>
      <p style="margin-left: 9%; margin-right: 35%; margin-top: 3%;">You’re receiving this email because you have a
        Connecting Soulmate account. This email is not a marketing or promotional email. That is why this email does
        not contain an unsubscribe link.
      </p>
      <p>
      <p style="margin-left: 9%;">Connecting Soulmate</p>
      </p>
      <p style="margin-left: 9%">For any queries please reach out to us at work.connectingsoulmate@gmail.com</p>
      <p style="margin-top:20px; margin-left: 9%; margin-right: 35%;">
        Thank You <br>
        Team - Connecting Soulmate <br><br>
        ____
        <br><br>
        You’re receiving this email because you have a Connecting Soulmate account. This email is not a marketing or
        promotional email. That is why this email does not contain an unsubscribe link
      </p>
      <div style="display: flex; gap: 90px; margin-left: 9%; margin-top: 35px;">
        <span>
        <img src="${LOGO_URL}" alt="Connecting Soulmate Logo"
          style="vertical-align: middle; width: 55px; height: 55px; border-radius: 4px;">
        </span>
        <span>
          <p>Connecting Soulmate <br>
            For any queries please reach out to us at
          </p>
        </span>
      </div>
      <p style="margin-left: 9%;">work.connectingsoulmate@gmail.com</p>
    </div>
  </body>
</html>
        `

        // to: "pmrutunjay928@gmail.com",
        await sendEmail({
          to: additionalDetails.email,
          subject,
          htmlContent,
          restrict
        });
      }

      console.log("Latest user details sent successfully");
  } catch (error) {
      console.error("Error sending latest user details:", error);
      // Handle error
  }
};


exports.deleteProfile = async (req, res) => {
  try {
    const { userId, deleteReason, isSuccessFulMarraige } = req.body;

    // Find the user by userId
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Set isDeleted to true and deleteReason
    user.isDeleted = true;
    user.deleteReason = deleteReason;
    user.deletedStatus = "This profile has been deleted."
    // Save the updated user
    await user.save();
    await sendDeleteEmail(user?.additionalDetails[0]?.email, user?.basicDetails[0]?.name || "user");
    // Increment the count of successful marriages if applicable
    if (isSuccessFulMarraige) {
      await addToSuccessfulMarriages(userId);
    }

    res.status(200).json({ message: "Profile deleted successfully" });
  } catch (error) {
    console.error("Error deleting profile:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Function to increment the count of successful marriages
const addToSuccessfulMarriages = async (userId) => {
  let record = await SuccessfulMarriage.findOne();

  if (!record) {
    record = new SuccessfulMarriage({ userIds: [userId] });
  } else {
    record.userIds.push(userId);
  }

  await record.save();
  return record.userIds.length;
};

exports.reApprovalRequest = async (req, res) => {
  try {
    const { userId } = req.body;

    // Find the user by userId
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Set isDeleted to true and deleteReason
    user.isDeleted = false;
    user.deleteReason = `peviously deleted for the reason : ${user.deleteReason}`;
    user.deletedStatus = "This profile has been deleted. User request for re-approval.";
    user.registrationPhase = "notapproved"
    user.registrationPage = "6"
    // Save the updated user
    await user.save();

    res.status(200).json({ message: "Profile resent for approval successfully" });
  } catch (error) {
    console.error("Error deleting profile:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.updateContactInfo = async (req, res) => {
  try {
    const { userId, email, phone } = req.body;

    // Find the user by userId
    const countryCode = phone?.split("-")[0] || "";
    const num = phone?.split("-")[1] || "";
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Update email if it's not empty
    if (email?.trim() !== "") {
      user.additionalDetails[0].email = email;
    }

    // Update contact if it's not empty
    if (num?.trim() !== "") {
      user.additionalDetails[0].contact = num;
      user.additionalDetails[0].countryCode = countryCode;
    }

    await user.save();

    res.status(200).json({ message: "Contact info updated successfully" });
  } catch (error) {
    console.error("Error updating contact info:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
