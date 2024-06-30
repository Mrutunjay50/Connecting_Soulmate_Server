const User = require("../models/Users");
const io = require("../socket");
const dotenv = require("dotenv");
const { sendEmail } = require("../utils/emailUtils");

dotenv.config();

const DOMAIN = process.env.FRONTEND_URL;
const { getSignedUrlFromS3 } = require("../utils/s3Utils");
const SuccessfulMarriage = require("../models/successFullMarraige");
const { sendDeleteEmail, sendChangeRegistrationEmail } = require("../helper/emailGenerator/emailHelper");

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
        // Retrieve all users' email and gender who are subscribed to emails
        const users = await User.find(
            { isEmailSubscribed: true },
            "additionalDetails.email gender basicDetails.name"
        ).sort({ createdAt: -1 });

        // Iterate over each user
        for (const user of users) {
            const { gender } = user;
            const queryGender = gender === "F" ? "M" : "F";

            // Find the three latest user details for the current user, excluding the current user
            const latestDetails = await User.find(
                { gender: queryGender, _id: { $ne: user._id } },
                "additionalDetails basicDetails selfDetails"
            ).limit(3).sort({ createdAt: -1 });

            // Retrieve signed URLs for profile pictures and user photos
            const latestDetailsWithUrls = await Promise.all(latestDetails.map(async detail => {
                const profileUrl = await getSignedUrlFromS3(detail.selfDetails[0]?.profilePicture);
                detail.selfDetails[0].profilePictureUrl = profileUrl || "";

                return detail;
            }));

            // Construct HTML template with flex column layout for each user
            const emailContent = latestDetailsWithUrls.map(detail => (
                `<div class="user-card">
                    <img src="${detail.selfDetails[0].profilePictureUrl}" alt="Profile Picture" class="user-image">
                    <div class="user-info">
                        <p>Name: ${detail.basicDetails[0]?.name}</p>
                        <p>Age: ${detail.basicDetails[0]?.age}</p>
                        <p>UserId: ${detail.basicDetails[0]?.userId}</p>
                    </div>
                </div>`
            )).join('');

            // Send the email to the user's email address
            const htmlContent = `
                <!DOCTYPE html>
                <html lang="en">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Latest User Details</title>
                    <style>
                        body {
                            font-family: Arial, sans-serif;
                            margin: 0;
                            padding: 0;
                        }
                        .container {
                            max-width: 600px;
                            margin: 0 auto;
                            padding: 20px;
                            background-color: #f9f9f9;
                        }
                        .user-card {
                            background-color: #fff;
                            border-radius: 10px;
                            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
                            margin-bottom: 20px;
                            padding: 20px;
                            display: flex;
                            flex-direction: column;
                        }
                        .user-image {
                            width: 100px;
                            height: 100px;
                            border-radius: 50%;
                            margin-bottom: 20px;
                            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
                        }
                        .user-info {
                            text-align: center;
                        }
                        .user-info p {
                            margin: 5px 0;
                        }
                        .user-info p.name {
                            font-size: 18px;
                            font-weight: bold;
                        }
                        .user-info p.user-id {
                            font-size: 14px;
                        }
                        .user-info p.age {
                            font-size: 12px;
                        }
                        .see-more-button {
                            background-color: #007bff;
                            color: #fff;
                            border: none;
                            border-radius: 5px;
                            padding: 10px 20px;
                            cursor: pointer;
                            margin-top: 20px;
                        }
                        .see-more-button:hover {
                            background-color: #0056b3;
                        }
                    </style>
                </head>
                <body>
                    <div class="container">
                        ${emailContent}
                    </div>
                </body>
                </html>`;

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
