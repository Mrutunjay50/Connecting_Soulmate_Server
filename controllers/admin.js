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

exports.getAllPendingUsersForAdmin = async (req, res, next) => {
  try {
    const adminId = req.user._id;
    let { page, limit, search } = req.query;
    let query = {
      registrationPhase: "notapproved",
      _id: { $ne: adminId }, // Exclude users with _id matching adminId
      accessType: { $ne: "0" },
      name: { $ne: "" }
    };
    
    // Apply search filter if present
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      query = { ...query, $or: [{ "basicDetails.name": searchRegex },{"userId" : searchRegex}, { category: searchRegex }] };
      // Add more fields to search in if needed, here we're searching in 'basicDetails.name' and 'category'
    }
    
    limit = 10;
    let result;
    let totalUsersCount;
    let endIndex;

    // Pagination logic
    if (page && limit) {
      const pageNumber = parseInt(page);
      const pageSize = parseInt(limit);
      const startIndex = (pageNumber - 1) * pageSize;
      endIndex = pageNumber * pageSize;

      totalUsersCount = await User.countDocuments(query);
      if (endIndex < totalUsersCount) {
        result = {
          nextPage: pageNumber + 1,
          data: await User.find(query)
            .select("_id basicDetails.name createdBy.createdFor category gender userId createdAt")
            .sort({ createdAt: -1 })
            .limit(pageSize)
            .skip(startIndex),
        };
      } else {
        result = {
          data: await User.find(query)
            .select("_id basicDetails.name createdBy.createdFor category gender userId createdAt")
            .sort({ createdAt: -1 })
            .limit(pageSize)
            .skip(startIndex),
        };
      }
    } else {
      result = {
        data: await User.find(query)
          .select("_id basicDetails.name createdBy.createdFor category gender userId createdAt")
          .sort({ createdAt: -1 }),
      };
    }

    res.status(200).json({
      result,
      currentPage: parseInt(page),
      hasLastPage: endIndex < totalUsersCount,
      hasPreviousPage: parseInt(page) > 1,
      nextPage: parseInt(page) + 1,
      previousPage: parseInt(page) - 1,
      lastPage: Math.ceil(totalUsersCount / parseInt(limit)),
      totalUsersCount
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Internal server error" });
  }
};


exports.getAllUsers = async (req, res, next) => {
  try {
    const { page, limit, search } = req.query;
    let query = { 
      registrationPhase: { $in: ["approved", "notapproved", "rejected"] },
      _id: { $ne: adminId }, // Exclude users with _id matching adminId
      accessType: { $ne: "0" },
      name: { $ne: "" } 
    };

    // Apply search filter if present
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      query = { ...query, $or: [{ "basicDetails.name": searchRegex }, { "userId": searchRegex }, { category: searchRegex }] };
      // Add more fields to search in if needed, here we're searching in 'basicDetails.name', 'userId', and 'category'
    }

    let result;
    let totalUsersCount;
    let endIndex;

    // Pagination logic
    if (page && limit) {
      const pageNumber = parseInt(page);
      const pageSize = parseInt(limit);
      const startIndex = (pageNumber - 1) * pageSize;
      endIndex = pageNumber * pageSize;

      totalUsersCount = await User.countDocuments(query);
      if (endIndex < totalUsersCount) {
        result = {
          nextPage: pageNumber + 1,
          data: await User.find(query)
            .select("_id basicDetails.name createdBy.createdFor category gender userId createdAt")
            .sort({ createdAt: -1 })
            .limit(pageSize)
            .skip(startIndex),
        };
      } else {
        result = {
          data: await User.find(query)
            .select("_id basicDetails.name createdBy.createdFor category gender userId createdAt")
            .sort({ createdAt: -1 })
            .limit(pageSize)
            .skip(startIndex),
        };
      }
    } else {
      result = {
        data: await User.find(query)
          .select("_id basicDetails.name createdBy.createdFor category gender userId createdAt")
          .sort({ createdAt: -1 }),
      };
    }

    res.status(200).json({
      result,
      currentPage: parseInt(page),
      hasLastPage: endIndex < totalUsersCount,
      hasPreviousPage: parseInt(page) > 1,
      nextPage: parseInt(page) + 1,
      previousPage: parseInt(page) - 1,
      lastPage: Math.ceil(totalUsersCount / parseInt(limit)),
      totalUsersCount
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Internal server error" });
  }
};
