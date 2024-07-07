const User = require("../models/Users");
const SuccessfulMarriage = require("../models/successFullMarraige");


const getUserDataWithPagination = async (matchCriteria, page, limit) => {
  const pageNumber = parseInt(page);
  const pageSize = parseInt(limit);
  const startIndex = (pageNumber - 1) * pageSize;
  const endIndex = pageNumber * pageSize;

  const totalUsersCount = await User.countDocuments(matchCriteria);
  const users = await User.find(matchCriteria)
    .sort({ createdAt: -1 })
    .select("userId basicDetails.name gender")
    .skip(startIndex)
    .limit(pageSize);

  return {
    users,
    totalUsersCount,
    currentPage: pageNumber,
    hasNextPage: endIndex < totalUsersCount,
    hasPreviousPage: pageNumber > 1,
    nextPage: pageNumber + 1,
    previousPage: pageNumber - 1,
    lastPage: Math.ceil(totalUsersCount / pageSize),
  };
};

exports.getTotalUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const matchCriteria = { accessType: { $nin: ["0", "1"] } };
    const result = await getUserDataWithPagination(matchCriteria, page, limit);
    res.status(200).json(result);
  } catch (error) {
    console.error("Error fetching total users:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.getTotalMaleUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const matchCriteria = { gender: 'M', accessType: { $nin: ["0", "1"] } };
    const result = await getUserDataWithPagination(matchCriteria, page, limit);
    res.status(200).json(result);
  } catch (error) {
    console.error("Error fetching male users:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.getTotalFemaleUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const matchCriteria = { gender: 'F', accessType: { $nin: ["0", "1"] } };
    const result = await getUserDataWithPagination(matchCriteria, page, limit);
    res.status(200).json(result);
  } catch (error) {
    console.error("Error fetching female users:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.getTotalDeletedUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const matchCriteria = { isDeleted: true, accessType: { $nin: ["0", "1"] } };
    const result = await getUserDataWithPagination(matchCriteria, page, limit);
    res.status(200).json(result);
  } catch (error) {
    console.error("Error fetching deleted users:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.getTotalUsersCategoryA = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const matchCriteria = { category: /A/, accessType: { $nin: ["0", "1"] } };
    const result = await getUserDataWithPagination(matchCriteria, page, limit);
    res.status(200).json(result);
  } catch (error) {
    console.error("Error fetching category A users:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.getTotalUsersCategoryB = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const matchCriteria = { category: /B/, accessType: { $nin: ["0", "1"] } };
    const result = await getUserDataWithPagination(matchCriteria, page, limit);
    res.status(200).json(result);
  } catch (error) {
    console.error("Error fetching category B users:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.getTotalUsersCategoryC = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const matchCriteria = { category: /C/, accessType: { $nin: ["0", "1"] } };
    const result = await getUserDataWithPagination(matchCriteria, page, limit);
    res.status(200).json(result);
  } catch (error) {
    console.error("Error fetching category C users:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.getTotalUsersUnCategorised = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const matchCriteria = { category: "", accessType: { $nin: ["0", "1"] } };
    const result = await getUserDataWithPagination(matchCriteria, page, limit);
    res.status(200).json(result);
  } catch (error) {
    console.error("Error fetching uncategorized users:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.getTotalActiveUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const currentDate = new Date();
    const pastDate = new Date();
    pastDate.setDate(currentDate.getDate() - 15);
    const matchCriteria = { lastLogin: { $gte: pastDate }, accessType: { $nin: ["0", "1"] } };
    const result = await getUserDataWithPagination(matchCriteria, page, limit);
    res.status(200).json(result);
  } catch (error) {
    console.error("Error fetching active users:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};


exports.getSuccessfulMarriages = async (req, res) => {
    try {
      const { page = 1, limit = 10 } = req.query;
  
      const pageNumber = parseInt(page, 10);
      const pageSize = parseInt(limit, 10);
  
      const successfulMarriage = await SuccessfulMarriage.findOne();
  
      if (!successfulMarriage) {
        return res.status(404).json({ error: 'No successful marriages found' });
      }
  
      const totalRecords = successfulMarriage.userIds.length;
      const totalPages = Math.ceil(totalRecords / pageSize);
      const startIndex = (pageNumber - 1) * pageSize;
      const endIndex = Math.min(startIndex + pageSize, totalRecords);
  
      const paginatedUserIds = successfulMarriage.userIds.slice(startIndex, endIndex);
  
      const users = await User.find({ _id: { $in: paginatedUserIds } })
        .select('userId name gender');
  
      res.status(200).json({
        users,
        totalRecords,
        totalPages,
        currentPage: pageNumber,
        hasNextPage: endIndex < totalRecords,
        hasPreviousPage: startIndex > 0,
        nextPage: pageNumber + 1,
        previousPage: pageNumber - 1
      });
    } catch (error) {
      console.error('Error fetching successful marriages:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  };