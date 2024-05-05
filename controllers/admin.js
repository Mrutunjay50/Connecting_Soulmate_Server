const User = require("../models/Users");

exports.updateRegistrationPhase = async (req, res) => {
    try {
      const { registrationPhase } = req.body;
      console.log(registrationPhase);
      const {userId} = req.params;
      let user = await User.findById(userId);
  
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
  
      if (registrationPhase === "approved") {
        user.registrationPhase = registrationPhase;
        user.registrationPage = "";
      }else {
        user.registrationPhase = "notapproved";
        user.registrationPage = "6";
      }
  
      user = await user.save();
  
      res.status(200).json({
        message: `registration phase ${user.registrationPhase} updated successfully`,
        user,
      });
    } catch (error) {
      console.error("Error updating category and registration phase:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  };


  const getUserById = async (req, res, next) => {
    try {
      const user = await User.findById(id)
  
      if (!user) {
        const error = new Error("user not found.");
        error.statusCode = 404;
        console.log(error);
      }
      res.status(200).json({ user });
    } catch (err) {
      console.log(err);
    }
  };
  