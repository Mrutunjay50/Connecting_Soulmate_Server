const jwt = require("jsonwebtoken");
const User = require("../models/Users");
const dotenv = require("dotenv");

dotenv.config();

// Middleware function to authenticate the user using JWT
const isAuth = async (req, res, next) => {
  try {
    const authHeader = req.get("Authorization");
    if (!authHeader) {
      const error = new Error("Not authenticated.");
      error.statusCode = 401;
      throw error;
    }
    const token = authHeader.split(" ")[1]; // Get the token from the request header

    if (!token) {
      return res
        .status(401)
        .json({ message: "Access denied. No token provided." });
    }
    // Verify the token
    jwt.verify(token, process.env.SECRET_KEY, async (err, decoded) => {
      if (err) {
        return res.status(401).json({ message: "Invalid token." });
      }

      // Check if the user associated with the token exists
      const user = await User.findById(decoded.id);
      if (!user) {
        return res.status(401).json({ message: "Unauthorized User." });
      }

      // Attach the authenticated user to the request object
      req.user = user;

      next();
      console.log("user authorized");
    });
  } catch (error) {
    console.error("Authentication error:", error);
    res.status(401).json({ message: "Not authenticated." });
  }
};


// Middleware function to check if the user is an admin using JWT
const isAdmin = async (req, res, next) => {
    try {
      const authHeader = req.get("Authorization");
      if (!authHeader) {
        const error = new Error("Not authenticated.");
        error.statusCode = 401;
        throw error;
      }
      const token = authHeader.split(" ")[1]; // Get the token from the request header
  
      if (!token) {
        return res
          .status(401)
          .json({ message: "Access denied. No token provided." });
      }
      // Verify the token
      jwt.verify(token, process.env.SECRET_KEY, async (err, decoded) => {
        if (err) {
          return res.status(401).json({ message: "Invalid token." });
        }
  
        // Check if the user associated with the token exists
        const user = await User.findById(decoded.id);
        if (!user) {
          return res.status(401).json({ message: "Unauthorized User" });
        }
        console.log(user.lastLogin);
        // Check if the user is an admin
        if (user.accessType === "0" || user.accessType === "1") {
          req.user = user;
          next(); // If the user is an admin, proceed to the next middleware/controller
        } else {
          return res.status(403).json({ message: "Not admin." });
        }
      });
    } catch (error) {
      console.error("Admin check error:", error);
      res.status(401).json({ message: "Not authenticated." });
    }
  };


module.exports = {isAuth, isAdmin};
