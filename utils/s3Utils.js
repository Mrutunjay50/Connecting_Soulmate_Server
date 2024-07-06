const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const sharp = require('sharp');
const { v4: uuidv4 } = require('uuid');

const dotenv = require('dotenv');
dotenv.config();

const bucketName = process.env.BUCKET_NAME;
const bucketRegion = process.env.BUCKET_REGION;
const accessKey = process.env.ACCESS_KEY;
const secretKey = process.env.SECRET_ACCESS_KEY;

const S3 = new S3Client({
  credentials: { accessKeyId: accessKey, secretAccessKey: secretKey },
  region: bucketRegion,
});


const resizeImage = async (buffer, resizeFactor = 0.10) => {
  try {
    // Get metadata to determine the original dimensions and size
    const originalMetadata = await sharp(buffer).metadata();
    const originalSize = buffer.length;

    // Calculate the new dimensions
    const newWidth = Math.floor(originalMetadata.width * (1 - resizeFactor));
    const newHeight = Math.floor(originalMetadata.height * (1 - resizeFactor));

    // Crop height to the new height or keep original if smaller than 480
    const cropHeight = newHeight > 480 ? newHeight : originalMetadata.height;

    // Resize and convert the image
    const resizedBuffer = await sharp(buffer)
      .rotate() // Disable automatic rotation based on Exif data
      .extract({ left: 0, top: 0, width: originalMetadata.width, height: cropHeight }) // Crop from the top
      .resize({ width: newWidth, height: newHeight, fit: 'cover' })
      .toFormat('jpeg') // Convert to JPEG to handle file size reduction
      .jpeg({ quality: 75 }) // Adjust quality to reduce file size
      .toBuffer();

    // Get metadata of the resized image
    const resizedMetadata = await sharp(resizedBuffer).metadata();
    const resizedSize = resizedBuffer.length;

    // Log the original and resized details
    console.log('====================================');
    console.log('Original Dimensions:', originalMetadata.width, 'x', originalMetadata.height);
    console.log('Original Size:', (originalSize / 1024).toFixed(2), 'KB');
    console.log('Resized Dimensions:', resizedMetadata.width, 'x', resizedMetadata.height);
    console.log('Resized Size:', (resizedSize / 1024).toFixed(2), 'KB');
    console.log('====================================');
    return resizedBuffer;
  } catch (error) {
    throw new Error('Error resizing image: ' + error.message);
  }
};

const uploadToS3 = async (buffer, fileName, mimeType) => {
  try {
    const params = {
      Bucket: process.env.BUCKET_NAME,
      Key: fileName,
      Body: buffer,
      ContentType: mimeType,
    };

    const command = new PutObjectCommand(params);
    await S3.send(command);
  } catch (error) {
    throw new Error('Error uploading to S3: ' + error.message);
  }
};

const deleteFromS3 = async (key) => {
  try {
    const deleteObjectParams = {
      Bucket: bucketName,
      Key: key,
    };

    console.log(key);

    const deleteObjectCommand = new DeleteObjectCommand(deleteObjectParams);
    await S3.send(deleteObjectCommand);
  } catch (error) {
    throw new Error('Error deleting from S3: ' + error.message);
  }
};

const generateFileName = (originalname) => {
  return uuidv4() + '-' + originalname?.replaceAll(" ","-");
};

const getSignedUrlFromS3 = async (key, expiresIn = 3600) => {
  try {
    if (key) {
      const getObjectParams = {
        Bucket: process.env.BUCKET_NAME,
        Key: key,
      };
      const command = new GetObjectCommand(getObjectParams);
      return await getSignedUrl(S3, command, { expiresIn });
    } else {
      return null;
    }
  } catch (error) {
    throw new Error('Error generating signed URL: ' + error.message);
  }
};
const getPublicUrlFromS3 = (key) => {
  return `https://${bucketName}.s3.${bucketRegion}.amazonaws.com/${key}`;
};

module.exports = {
  resizeImage,
  uploadToS3,
  deleteFromS3,
  generateFileName,
  getSignedUrlFromS3,
  getPublicUrlFromS3
};
