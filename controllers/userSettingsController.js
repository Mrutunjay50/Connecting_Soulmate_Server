const User = require("../models/Users");
const brevo = require("@getbrevo/brevo");
const dotenv = require("dotenv");

dotenv.config();

const BREVO_API = process.env.BREVO_API_KEY;
const EMAIL_FROM = process.env.DOMAIN_EMAIL;
const DOMAIN = process.env.FRONTEND_URL;

const SibApiV3Sdk = require("@getbrevo/brevo");
const { getSignedUrlFromS3 } = require("../utils/s3Utils");

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
        // Retrieve all users' email and gender who are subscribed to emails
        const users = await User.find(
            { isEmailSubscribed: true },
            "additionalDetails.email gender"
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
            const sendSmtpEmail = {
                sender: { name: "Your Sender Name", email: EMAIL_FROM }, // Replace with your sender details
                to: [{ email: "gauravsrivastava0451@gmail.com" }], // Send email to user's email address
                subject: "Latest User Details",
                htmlContent: `
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
                </html>`
            };

            await apiInstance.sendTransacEmail(sendSmtpEmail)
        }

        console.log("Latest user details sent successfully");
    } catch (error) {
        console.error("Error sending latest user details:", error);
        // Handle error
    }
};


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