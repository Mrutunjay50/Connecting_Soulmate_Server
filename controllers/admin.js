const {
  getAggregationPipelineForUsers,
} = require("../helper/aggregationPipelineForUsers");
const { generateUserPDFForAdmin } = require("../helper/generatePDF");
const { processUserDetails } = require("../helper/processInterestDetails");
const User = require("../models/Users");


exports.updateRegistrationPhase = async (req, res) => {
  try {
    const { registrationPhase } = req.body;
    console.log(registrationPhase);
    const { userId } = req.params;
    let user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (registrationPhase === "approved") {
      user.registrationPhase = registrationPhase;
      user.registrationPage = "";
    } else {
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

exports.getUserByIdForAdmin = async (req, res, next) => {
  try {
    const userData = await User.findById(req.params.userId);
    if (!userData) {
      const error = new Error("User not found.");
      error.statusCode = 404;
      console.log(error);
      return res.status(404).json({ error: "User not found." });
    }

    const aggregationPipeline = getAggregationPipelineForUsers(
      req.params.userId
    );
    let aggregatedData = await User.aggregate(aggregationPipeline);

    if (aggregatedData.length === 0) {
      return res.status(404).json({ error: "User data not found." });
    }

    let user = aggregatedData[0]; // Get the first element of the aggregated result

    try {
      user.selfDetails = await processUserDetails(user.selfDetails);
    } catch (error) {
      console.error("Error:", error);
    }

    res.status(200).json({ user });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.getUserPDFForAdmin = async (req, res, next) => {
  try {
    const userData = await User.findById(req.params.userId);
    if (!userData) {
      return res.status(404).json({ error: "User not found." });
    }

    const aggregationPipeline = getAggregationPipelineForUsers(req.params.userId);
    let aggregatedData = await User.aggregate(aggregationPipeline);

    if (aggregatedData.length === 0) {
      return res.status(404).json({ error: "User data not found." });
    }

    let user = aggregatedData[0];

    try {
      user.selfDetails = await processUserDetails(user.selfDetails);
    } catch (error) {
      console.error("Error:", error);
    }

    const pdfBuffer = await generateUserPDFForAdmin(user);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=user_${req.params.userId}.pdf`);
    res.send(pdfBuffer);

  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};