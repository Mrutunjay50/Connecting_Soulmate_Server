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

const resizeImage = async (buffer) => {
  try {
    return await sharp(buffer)
      .resize({ height: 400, width: 800, fit: 'contain' })
      .toBuffer();
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
  return uuidv4() + '-' + originalname;
};

const getSignedUrlFromS3 = async (key, expiresIn = 3600) => {

  if(key){
    try {
      const getObjectParams = {
        Bucket: process.env.BUCKET_NAME,
        Key: key,
      };
      const command = new GetObjectCommand(getObjectParams);
      return await getSignedUrl(S3, command, { expiresIn });
    } catch (error) {
      throw new Error('Error generating signed URL: ' + error.message);
    }
  }
};

module.exports = {
  resizeImage,
  uploadToS3,
  deleteFromS3,
  generateFileName,
  getSignedUrlFromS3,
};
