const User = require("../models/Users");
const {
  resizeImage,
  uploadToS3,
  generateFileName,
  deleteFromS3,
} = require("../utils/s3Utils");

// import User from '../models/Users';

exports.registerUser = async (req, res) => {
  try {
    const { page } = req.params;
    const { userId } = req.body; // Assuming you have a userId to identify the user

    // Fetch the user based on userId
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Based on the page number, update the corresponding array
    switch (page) {
      case "1":
        user.basicDetails.push(req.body.basicDetails);
        break;
      case "2":
        user.additionalDetails.push(req.body.additionalDetails);
        break;
      case "3":
        user.carrierDetails.push(req.body.carrierDetails);
        break;
      case "4":
        user.familyDetails.push(req.body.familyDetails);
        break;
      case "5":
        const userPhotos = req.files;
        const { aboutYourself, interest, fun, fitness, other } = JSON.parse(
          req.body.selfDetails
        );
        // Upload user photos to S3
        if (userPhotos) {
          for (var i = 0; i < userPhotos.length; i++) {
            const { buffer, originalname, mimetype } = userPhotos[i];

            // a function for resizing images
            const resizedImageBuffer = await resizeImage(buffer);
            const fileName = generateFileName(originalname);

            // a function for uploading to S3
            await uploadToS3(resizedImageBuffer, fileName, mimetype);

            // Update userPhotos array with the generated file name
            userPhotos[i].originalname = fileName;
          }
        }
        if (userPhotos && user.selfDetails.length > 0) {
          // If 'selfDetails' already exists, update 'userPhotos' array
          user.selfDetails[0].userPhotos = userPhotos.map(
            (photo) => photo.originalname
          );
        } else {
          // If 'selfDetails' doesn't exist, create it with 'userPhotos' array
          const newSelfDetails = {
            userPhotos: userPhotos.map((photo) => photo.originalname),
            profilePicture:
              userPhotos.length > 0 ? userPhotos[0].originalname : null,
            aboutYourself: aboutYourself,
            interests: interest,
            fun: fun,
            fitness: fitness,
            other: other,
          };

          user.selfDetails = [newSelfDetails];
          await user.save();
        }

        break;
      case "6":
        user.partnerPreference.push(req.body.partnerPreference);
        break;
      default:
        return res.status(400).json({ error: "Invalid page number" });
    }

    // Save the updated user document
    await user.save();

    res.status(200).json({ message: "Data added successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
