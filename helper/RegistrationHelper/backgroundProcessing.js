const { generateFileName, uploadToS3, resizeImage } = require("../../utils/s3Utils");

const handleImageProcessing = async (userPhotos, selfDetails, profilePicture) => {
    if (userPhotos && userPhotos.length > 0) {
      try {
        const uploadedPhotos = await Promise.all(
          userPhotos.map(async (photo) => {
            const { buffer, originalname, mimetype } = photo;
            const resizedImageBuffer = await resizeImage(buffer);
            const fileName = generateFileName(originalname);
            await uploadToS3(resizedImageBuffer, fileName, mimetype);
            if (originalname === profilePicture) {
              selfDetails.profilePicture = String(fileName);
            }
            return fileName;
          })
        );
        selfDetails.userPhotos.push(...uploadedPhotos);
        
        // Save the updated user details after processing
        await user.save();
      } catch (error) {
        console.error("Error uploading images to S3:", error);
      }
    }
  };
  
  module.exports = { handleImageProcessing };