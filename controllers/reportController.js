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