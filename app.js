const express = require("express");
const mongoose = require("mongoose");
const helmet = require("helmet");
const cors = require("cors");
const morgan = require("morgan");
const dotenv = require("dotenv");
let router = express.Router();
const UserRoutes = require("./routes/authRoute");
const cron = require("node-cron");
http = require("http");

const { initializeRoutes } = require("./routes/index");
const {
  sendLatestUserDetails,
} = require("./controllers/userSettingsController");
const {chatSocket} = require("./chatSocket");
const getUserDetailsFromToken = require("./helper/getUserDetailsFromToken");
const { deleteOldData } = require("./controllers/notificationController");
initializeRoutes(router);

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

async function connectToMongoDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    // // Get a reference to the collection
    // const collectionName = "users";
    // const userCollection1 = mongoose.connection.collection("profilerequests");

    // // Displaying indexes on the Users collection
    // const userCollection2 = mongoose.connection.collection("interestrequests");
    // const indexes1 = await userCollection1.indexes();
    // const indexes2 = await userCollection2.indexes();
    // // Drop all indexes
    // await userCollection.dropIndexes();

    // console.log("Indexes on Users collection:", indexes1, indexes2);
    console.log("MongoDB connected successfully");
  } catch (error) {
    console.error("Error connecting to MongoDB", error);
    process.exit(1);
  }
}

async function startServer() {
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(helmet({ crossOriginResourcePolicy: false }));
  app.use(morgan("common"));
  app.use(cors());

  const server = http.createServer(app);

  const io = require("./socket").init(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST", "PUT", "DELETE"],
    },
  });
  io.on("connection", async (socket) => {
    await chatSocket(socket);
  });

  cron.schedule(
    "0 0 1 * *",
    async () => {
      const startTime = new Date().toLocaleString("en-US", { timeZone: "Asia/Tokyo" });
      console.log(`Cron job started at: ${startTime}`);
  
      try {
        // Call the function to send the latest user details
        await sendLatestUserDetails();
        const endTime = new Date().toLocaleString("en-US", { timeZone: "Asia/Tokyo" });
        console.log(`Cron job executed successfully at: ${endTime}`);
      } catch (error) {
        const errorTime = new Date().toLocaleString("en-US", { timeZone: "Asia/Tokyo" });
        console.error(`Error executing cron job at: ${errorTime}`, error);
      }
    },
    {
      scheduled: true,
      timezone: "Asia/Tokyo", // Replace "your-timezone-here" with your timezone
    }
  );

  cron.schedule(
    "0 0 1 * *",
    async () => {
      const startTime = new Date().toLocaleString();
      console.log(`Cron job started at: ${startTime}`);
  
      try {
        // Call the function to delete notifications and admin notifications
        await deleteOldData();
        const endTime = new Date().toLocaleString();
        console.log(`Cron job executed successfully at: ${endTime}`);
      } catch (error) {
        const errorTime = new Date().toLocaleString();
        console.error(`Error executing cron job at: ${errorTime}`, error);
      }
    },
    {
      scheduled: true,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone, // Automatically use local timezone
    }
  );


  // cron.schedule(
  //   "0 0 */5 * *",
  //   async () => {
  //     try {
  //       // Call the function to send latest user details
  //       await sendLatestUserDetails();
  //       console.log("Cron job executed successfully");
  //     } catch (error) {
  //       console.error("Error executing cron job:", error);
  //     }
  //   },
  //   {
  //     scheduled: true,
  //     timezone: "Asia/Tokyo", // Replace "your-timezone-here" with your timezone
  //   }
  // );

  app.use(router);
  app.use("/auth", UserRoutes);

  app.use("/running-status", (req, res) => {
    res.status(200).send("API is connected");
  });

  server.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });
}

connectToMongoDB().then(startServer);
