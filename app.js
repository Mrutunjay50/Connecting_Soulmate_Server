const express = require("express");
const mongoose = require("mongoose");
const helmet = require("helmet");
const cors = require("cors");
const morgan = require("morgan");
const dotenv = require("dotenv");
let router = express.Router();
const UserRoutes = require("./routes/authRoute");
const cron = require('node-cron');
http = require("http");

const { initializeRoutes } = require("./routes/index");
const { sendLatestUserDetails } = require("./controllers/userSettingsController");
const User = require("./models/Users");
const chatSocket = require("./chatSocket");
initializeRoutes(router);

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

async function connectToMongoDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    // Get a reference to the collection
    // const collectionName = "users";
    // const userCollection = mongoose.connection.collection(collectionName);

    // // Displaying indexes on the Users collection
    // // const userCollection = mongoose.connection.collection("users");
    // const indexes = await userCollection.indexes();
    // // // Drop all indexes
    // await userCollection.dropIndexes();

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

  const server = http.createServer(app);

  const io = require("./socket").init(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST", "PUT", "DELETE"],
    },
  });
  io.on("connection", (socket) => {
    console.log(`User connected ${socket.id}`);
  });

  chatSocket(io);

  cron.schedule('0 0 */5 * *', async () => {
    try {
        // Call the function to send latest user details
        await sendLatestUserDetails();
        console.log('Cron job executed successfully');
    } catch (error) {
        console.error('Error executing cron job:', error);
    }
}, {
    scheduled: true,
    timezone: "Asia/Tokyo" // Replace "your-timezone-here" with your timezone
});

// app.post('/updateField', async (req, res) => {
//   const query = req.body.query;  // query to find the document(s) to update

//   try {
//       const result = await User.updateMany({}, {
//           $unset: { justAt: "" },
//       });

//       res.status(200).send({
//           matchedCount: result.matchedCount,
//           modifiedCount: result.modifiedCount
//       });
//   } catch (error) {
//       res.status(500).send({ error: error.message });
//   }
// });
  app.use(router);
  app.use("/auth", UserRoutes);

  // app.use("/", (req, res) => {
  //   res.status(200).send("API is connected");
  // });

  server.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });
}

connectToMongoDB().then(startServer);