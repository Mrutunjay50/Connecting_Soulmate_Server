const User = require("../models/Users");
const io = require("../socket");
const dotenv = require("dotenv");
const { sendEmail } = require("../utils/emailUtils");
const jwt = require("jsonwebtoken");

dotenv.config();

const DOMAIN = process.env.FRONTEND_URL;
const { getPublicUrlFromS3 } = require("../utils/s3Utils");
const SuccessfulMarriage = require("../models/successFullMarraige");
const { sendDeleteEmail, sendChangeRegistrationEmail } = require("../helper/emailGenerator/emailHelper");
const { City, State, Proffesion } = require("../models/masterSchemas");
const { deleteUserRelatedData } = require("../helper/deleteUserData");
const AdminNotifications = require("../models/adminNotification");
const { populateAdminNotification } = require("../helper/NotificationsHelper/populateNotification");
const { events } = require("../utils/eventsConstants");
const BannedUsers = require("../models/bannedUsers");
const axios = require("axios");
const LOGO_URL = process.env.LOGO_IMAGE_URL;
const JWT_SECRET = process.env.JWT_SECRET || "jwt-secret-token-csm-change-registration-number-key";


// Function to generate a token with a 10-minute expiration
const generateToken = (userId, email) => {
  return jwt.sign({ userId, email }, JWT_SECRET, { expiresIn: '10m' });
};

function formatName(name) {
  // Remove "undefined" from the name
  const cleanedName = name.replaceAll("undefined", "").trim();

  // Split the name into parts
  const nameParts = cleanedName.split(" ");

  // If there are not enough parts to format, return the cleaned name
  if (nameParts.length < 2) {
    return cleanedName;
  }

  // Get the first part and the first character of the last part
  const firstName = nameParts[0];
  const lastNameInitial = nameParts[nameParts.length - 1].charAt(0);

  // Format the name
  const formattedName = `${firstName} ${lastNameInitial}...`;

  return formattedName;
}

exports.generateLinkForChangingRegisteredNumber = async (req, res) => {
  try {
    const user = req.user;

    // Check if the user has provided an email
    const email = user?.additionalDetails[0]?.email;
    if (!email || email.trim() === "") {
      return res.status(400).json({ error: "You have not provided an email for this account." });
    }

    // Generate a JWT token with a 10-minute expiration
    const token = generateToken(user._id, email);

    const verificationLink = `${DOMAIN}/change-register-number/${token}`;
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
    const { number } = req.body;
    const userId = req.user._id;
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
    const bannedUser = await BannedUsers.findOne({ contact: number });
    if (bannedUser) {
      return res.status(403).json({ message: "The number you entered is banned" });
    }
    // Set isDeleted to true and deleteReason
    user.createdBy[0].phone = number;

    // Save the updated user
    await user.save();
    io.getIO().emit(`${events.DELETETOKEN}/${user._id}`, { "message": "number changed login again" });
    res.status(200).json({ message: "Number Changed successfully" });
  } catch (error) {
    console.error("Error changing registered number:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.subscribeEveryFifteenDays = async (req, res) => {
    try {
        const { isValue} = req.body;
        const userId = req.user._id;
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

exports.notificationStatusUserType = async (req, res) => {
    try {
        const { userId, isValue } = req.body;
    
        // Find the user by userId
        const user = await User.findById(userId);
        if (!user) {
          return res.status(404).json({ error: "User not found" });
        }
    
        user.isNotification = isValue;
    
        await user.save();
    
        res.status(200).json({ message: "notification status updated" });
      } catch (error) {
        console.error("Error updating notification status :", error);
        res.status(500).json({ error: "Internal Server Error" });
      }
};


exports.notificationStatusAdminType = async (req, res) => {
    try {
        const { userId, isValue } = req.body;
    
        // Find the user by userId
        const user = await User.findById(userId);
        if (!user) {
          return res.status(404).json({ error: "User not found" });
        }
    
        user.isAdminNotification = isValue;
    
        await user.save();
    
        res.status(200).json({ message: "notification status updated" });
      } catch (error) {
        console.error("Error updating notification status :", error);
        res.status(500).json({ error: "Internal Server Error" });
      }
};


exports.sendLatestUserDetails = async () => {
  try {
    const restrict = true;
    const subject = "Newly Joined - Connecting Soulmate"
    const RedirectLink = `${DOMAIN}/new-join`;
      // Retrieve all users' email and gender who are subscribed to emails
      const users = await User.find(
          { isEmailSubscribed: true, registrationPhase : "approved", isDeleted : false },
          "additionalDetails.email gender category basicDetails.name"
      ).sort({ createdAt: -1 });

      // Iterate over each user
      for (const user of users) {
          const { gender, category } = user;
          const queryGender = gender === "F" ? "M" : "F";
          const categoryRegex = new RegExp(`(^|,| )${category}(,|$| )`);

          // Find the three latest user details for the current user, excluding the current user
        let latestDetails = await User.find(
              { gender: queryGender, _id: { $ne: user._id }, category: categoryRegex, registrationPhase : "approved", isDeleted : false },
              "additionalDetails basicDetails selfDetails careerDetails"
          ).limit(4).sort({ createdAt: -1 });
          // console.log(latestDetails);
           latestDetails = JSON.parse(JSON.stringify(latestDetails))
          // Retrieve signed URLs for profile pictures and user photos
          const latestDetailsWithUrls = await Promise.all(latestDetails.map(async detail => {
            // console.log(detail?.careerDetails)
            if (detail?.selfDetails && detail.selfDetails[0]) {
              const profileUrl = getPublicUrlFromS3(detail?.selfDetails[0]?.profilePicture || "");
              detail.selfDetails[0].profilePictureUrl = profileUrl || "";
            } else {
              // Initialize selfDetails with an empty object if it doesn't exist
              detail.selfDetails = [{}];
              const profileUrl = getPublicUrlFromS3(""); // Generate URL for empty profile picture
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
            if (detail?.careerDetails && detail.careerDetails[0]) {
              const { profession } = detail.careerDetails[0];
            
              if (profession) {
                // console.log(profession);
                const professionData = await Proffesion.findOne({ proffesion_id: profession });
                detail.careerDetails[0].professionType = professionData?.proffesion_name || "";
              }
            } else {
              // Initialize careerDetails with an empty object if it doesn't exist
              detail.careerDetails = [{}];
              detail.careerDetails[0].professionType = "";
            }
          // console.log("Career", detail);
            return detail;
          }));
          // Construct HTML template with flex column layout for each user
          const emailContent = latestDetailsWithUrls.map(detail => (
              `<div class="profile-card">
                  <img src="${detail?.selfDetails[0]?.profilePictureUrl}" alt="img" class="profile-picture">
                  <div class="profile-details">
                  <span class="flexm">
              
                    <div style = "padding-left:2px">${formatName(detail?.basicDetails[0]?.name) || "user"}</div>,
                    <div>${detail?.basicDetails[0]?.age || 21} Yrs</div>
                    </span>
                    <div>${detail?.careerDetails[0]?.professionType || ""}</div>
                    <div>${detail?.additionalDetails[0]?.currentCityName || ""}</div>
                    <div>${detail?.additionalDetails[0]?.currentStateName || ""}</div>
                  </div>
                </div>
              `
          )).join('');

          // Send the email to the user's email address

        const htmlContent = `
 <!DOCTYPE html>
<html lang="en">
<head>
  <style>
    body {
      font-family: Arial, sans-serif;
      margin: 0;
      padding: 0;
      width: 100%;
    }

    .profile-card {
      border: 1px solid #A92525;
      border-radius: 8px;
      padding: 10px;
      box-sizing: border-box;
      margin: 5px;
      width: 100%;
      max-width: 500px;
    }
    .flexm{
      display:flex;
    }
    .profile-picture {
      border-radius: 50%;
      width: 60px;
      height: 60px;
      background-color: black;
    }

    .profile-details {
      text-align: start;
    }

    .profile-details > div {
      padding-top: 7px;
    
    }

    @media only screen and (max-width: 600px) {
      .profile-card {
        width: 100%; /* Full width on smaller screens */
      }
        .flexm{
        display: block;
        }
    }
  </style>
</head>
<body>
  <div>
    <table style=" margin: 0 auto;">
      <tr>
        <td style="padding: 20px 0; text-align:start; p">
          <img src="${LOGO_URL}" alt="img" style="border-radius: 50%; width: 80px; height: 80px;">
        </td>
      </tr>
      <tr>
        <td style="padding: 0 0">
          <p>Dear ${user?.basicDetails[0]?.name?.replaceAll("undefined", "")},<br><br>
          We hope you are having a good day! <br><br>
          Here are some new matches that we found for you. <br><br>
          </p>
        </td>
      </tr>
      <tr>
        <td>
          <table style=" margin: 0 auto; text-align: center;">
            <tr>
              <td style=" padding: 5px;" class = "flexm">
               ${emailContent}
              </td>
            </tr>
          </table>
        </td>
      </tr>
      <tr>
        <td style="text-align: center; padding-top: 20px;">
          <a href="${RedirectLink}" style="text-decoration: none; background-color: #A92525; color: white; border-radius: 8px; padding: 9px;">View All..</a>
        </td>
      </tr>
      <tr>
        <td style="padding: 20px 0;">
        
          <p>For any queries please reach out to us at work.connectingsoulmate@gmail.com</p>
          <p>Thank You<br>Team - Connecting Soulmate<br><br>__<br><br>You’re receiving this email because you have a Connecting Soulmate account. This email is not a marketing or promotional email. That is why this email does not contain an unsubscribe link</p>
        </td>
      </tr>
      <tr>
        <td style="text-align: center; padding: 20px 0%;">
          <table style="width: 100%; margin: 0 auto; text-align: center;">
            <tr>
              <td style="width: 20%;">
                <img src="${LOGO_URL}" alt="Connecting Soulmate Logo" style="vertical-align: middle; width: 55px; height: 55px; border-radius: 4px;">
              </td>
              <td style="width: 80%; text-align: left;">
                <p>Connecting Soulmate<br>For any queries please reach out to us at work.connectingsoulmate@gmail.com</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </div>
</body>
</html>
        `
          await sendEmail({
            to: user?.additionalDetails[0]?.email,
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
    const { deleteReason, isSuccessFulMarraige } = req.body;
    const userId = req.user._id;
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
    await deleteUserRelatedData(user?._id);
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
    const userId = req.user._id;

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
    const notification = await AdminNotifications.findOneAndUpdate(
      {
        notificationBy: userId,
        notificationType: "reapproval",
      },
      {
        notificationBy: userId,
        notificationType: "reapproval",
      },
      {
        new: true, // Return the updated document
        upsert: true, // Create the document if it doesn't exist
        setDefaultsOnInsert: true // Apply default values if creating
      }
    );

    const formattedNotification = await populateAdminNotification(notification);
    // Find all admin users
    const admins = await User.find({ accessType : '0' }); // Adjust the query based on your user schema
    const adminIds = admins.map(admin => admin._id);
    // Emit the notification to all admins
    adminIds.forEach(adminId => {
      io.getIO().emit(`${events.ADMINNOTIFICATION}/${adminId}`, formattedNotification);
    });

  } catch (error) {
    console.error("Error deleting profile:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.updateContactInfo = async (req, res) => {
  try {
    const { email, phone } = req.body;
    const userId = req.user._id;

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

exports.getUserImagesInBase64 = async (req, res, next) => {
  try {
    const userPhotosArray = req.body.imgUrls;

    if (!userPhotosArray || !Array.isArray(userPhotosArray) || userPhotosArray.length === 0) {
      return res.status(400).json({ error: "No image URLs provided." });
    }

    // Create a map of URLs to their base64-encoded image data
    const imagesBase64Map = {};

    // Loop through each URL in the array
    for (const imageUrl of userPhotosArray) {
      try {
        // Fetch the image data from the public URL using Axios
        const imageResponse = await axios.get(imageUrl, {
          responseType: 'arraybuffer'
        });

        // Convert the image data to base64
        const imageBase64 = Buffer.from(imageResponse.data, 'binary').toString('base64');

        // Map the original URL to its base64 representation
        imagesBase64Map[imageUrl] = imageBase64;
      } catch (err) {
        console.error(`Error processing image URL ${imageUrl}:`, err);
        // Optionally, you can handle specific image errors here (e.g., add a placeholder or skip)
        imagesBase64Map[imageUrl] = null; // Indicate that the image failed to process
      }
    }

    // Send the base64 data map as a JSON response
    return res.status(200).json({ images: imagesBase64Map });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.getUserImageAsFile = async (req, res, next) => {
  try {
    const imageUrl = req.body.url;
    console.log(imageUrl);

    if (!imageUrl) {
      return res.status(400).json({ error: "No image URL provided." });
    }

    try {
      // Fetch the image data from the public URL using Axios
      const imageResponse = await axios.get(imageUrl, {
        responseType: 'arraybuffer',
      });

      // Convert the response data (ArrayBuffer) to Buffer
      const imageBuffer = Buffer.from(imageResponse.data, 'binary');

      // Optional: Save the buffer as a file on the server (for testing or other purposes)
      // const filename = path.basename(imageUrl);
      // const filePath = path.join(__dirname, filename);
      // fs.writeFileSync(filePath, imageBuffer);

      // Send the file data as a response
      res.set('Content-Type', imageResponse.headers['content-type']);
      res.send(imageBuffer);
    } catch (err) {
      console.log(`Error processing image URL ${imageUrl}:`, err);
      return res.status(500).json({ error: "Failed to fetch and send the image." });
    }
  } catch (err) {
    console.log(err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};


// Controller function to update browserId
exports.updateBrowserId = async (req, res) => {
  try {
    const userId = req.user._id;
    const { browserId } = req.body;
    // Check if browserId is provided
    if (!browserId || typeof browserId !== 'string' || browserId === 'null') {
      return res.status(400).json({ message: 'Browser ID is required and must be a valid string' });
    }
    // Find the user and add the new browserId to the array, or create one if the user doesn't exist
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    // Step 3: If the user exists, check and update browserIds
    if (!user.browserIds) {
      // If browserIds field is not present, initialize it
      user.browserIds = [browserId];
    } else {
      // If the browserId is not already present
      if (!user.browserIds.includes(browserId)) {
        if (user.browserIds.length >= 3) {
          // Remove the last element (oldest one) when there are already 3 browserIds
          user.browserIds.pop();
        }
        // Add the new browserId at the 0th index
        user.browserIds.unshift(browserId);
      }
    }
    await user.save(); // Save the user with the updated browserIds

    return res.status(200).json({ message: 'Browser ID updated successfully', user });
  } catch (error) {
    console.error('Error updating browserId:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Controller function to delete browserId
exports.deleteBrowserId = async (req, res) => {
  try {
    const userId = req.user._id;
    const { browserId } = req.body;
    // Check if browserId is provided
    if (!browserId || typeof browserId !== 'string') {
      return res.status(400).json({ message: 'Browser ID is required and must be a valid string' });
    }
    // Find the user by ID
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if the browserId exists in the browserIds array
    if (user.browserIds && user.browserIds.includes(browserId)) {
      // Remove the browserId from the array
      user.browserIds = user.browserIds.filter(id => id !== browserId);
      await user.save(); // Save the updated user

      return res.status(200).json({ message: 'Browser ID deleted successfully', user });
    }

    // If browserId is not found in the array
    return res.status(400).json({ message: 'Browser ID not found' });
  } catch (error) {
    console.error('Error deleting browserId:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};
