const express = require("express");
const mongoose = require("mongoose");
const helmet = require("helmet");
const cors = require("cors");
const morgan = require("morgan");
const dotenv = require("dotenv");

const apiRoute = require("./routes/userRoutes");
const userRoutes = require("./routes/auth");
const masterRoutes = require('./routes/masterDataRoutes');
const User = require("./models/Users"); // Import User model

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

async function connectToMongoDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    // Create indexes on User model
    await User.createIndexes([
      { "basicDetails.age": 1 },
      { "additionalDetails.height": 1 },
      { "carrierDetails.annualIncomeValue": 1 },
      { "additionalDetails.maritalStatus": 1 },
      { "familyDetails.community": 1 },
      { "familyDetails.caste": 1 },
      { "additionalDetails.currentlyLivingInCountry": 1 },
      { "additionalDetails.currentlyLivingInState": 1 },
      { "additionalDetails.currentlyLivingInCity": 1 },
      { "carrierDetails.highestEducation": 1 },
      { "carrierDetails.profession": 1 },
      { "additionalDetails.diet": 1 },
    ]);

    // Displaying indexes on the Users collection
    const userCollection = mongoose.connection.collection("users");
    const indexes = await userCollection.find({}).toArray();

    // console.log("Indexes on Users collection:", indexes);
    console.log("MongoDB connected successfully with indexes");
  } catch (error) {
    console.error("Error connecting to MongoDB or creating indexes:", error);
    process.exit(1);
  }
}


async function startServer() {
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(helmet({ crossOriginResourcePolicy: false }));
  app.use(morgan("common"));
  app.use(cors());

  // Routes setup
  app.use(apiRoute);
  app.use(userRoutes);
  app.use(masterRoutes);

  // Default route
  app.use('/', (req, res) => {
    res.status(200).send('API is connected');
  });

  // Start the server
  app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });
}

// Connect to MongoDB and start the server
connectToMongoDB().then(startServer);
