const { getAggregationPipelineForUsers } = require("../helper/aggregationPipelineForUsers");
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
      const userData = await User.findById(req.params.userId);
      if (!userData) {
        const error = new Error("User not found.");
        error.statusCode = 404;
        console.log(error);
        return res.status(404).json({ error: "User not found." });
      }
      const aggregationPipeline = getAggregationPipelineForUsers(req.params.userId);
      let aggregatedData = await User.aggregate(aggregationPipeline);
      
      if (aggregatedData.length === 0) {
        return res.status(404).json({ error: "User data not found." });
      }
      
      let user = aggregatedData[0]; // Get the first element of the aggregated result
      
      const profileUrl = await getSignedUrlFromS3(
        user.selfDetails?.profilePicture
      );
      user.selfDetails.profilePictureUrl = profileUrl || "";
      const signedUrlsPromises = user.selfDetails?.userPhotos.map((item) =>
        getSignedUrlFromS3(item)
      );
      try {
        const signedUrls = await Promise.all(signedUrlsPromises);
        user.selfDetails.userPhotosUrl = signedUrls;
      } catch (error) {
        console.error("Error:", error);
      }
      res.status(200).json({ user });
    } catch (err) {
      console.log(err);
      res.status(500).json({ error: "Internal Server Error" });
    }
  };
  