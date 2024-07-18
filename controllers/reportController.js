const Report = require("../models/reports");

exports.reportUser = async (req, res) => {
    try {
      const { reportedBy, reportedOne, description } = req.body;
  
      if (!reportedBy || !reportedOne || !description || reportedBy === "" || reportedOne === "" || description === "") {
        return res.status(400).json({ error: "reportedBy, reportedOne, and description are required" });
      }
  
      // Create a new report entry
      const report = new Report({
        reportedBy,
        reportedOne,
        description
      });
  
      await report.save();
  
      res.status(200).json({ message: "User reported successfully", report });
    } catch (err) {
      console.log(err);
      res.status(500).json({ error: "Internal Server Error", err });
    }
};


exports.getReportedIssues = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const pageNumber = parseInt(page, 10);
    const pageSize = parseInt(limit, 10);

    // Fetch all reported users
    const totalRecords = await Report.countDocuments();
    const totalPages = Math.ceil(totalRecords / pageSize);
    const startIndex = (pageNumber - 1) * pageSize;

    const reports = await Report.find()
      .skip(startIndex)
      .limit(pageSize)
      .populate('reportedBy', 'basicDetails.name userId')
      .populate('reportedOne', 'basicDetails.name userId')

    res.status(200).json({
      reports,
      totalRecords,
      totalPages,
      currentPage: pageNumber,
      hasNextPage: startIndex + pageSize < totalRecords,
      hasPreviousPage: startIndex > 0,
      nextPage: pageNumber + 1,
      previousPage: pageNumber - 1
    });
  } catch (error) {
    console.error('Error fetching reported users:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
