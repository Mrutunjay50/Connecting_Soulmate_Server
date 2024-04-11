const User = require("../models/Users");

exports.searchById = async (req, res) => {};

exports.advanceSearch = async (req, res) => {
  try {
    const searchParams = req.body; // Get search parameters from request body

    // console.log(req.body);
    // const user = await User.find();
    // console.log(user.map(item => item?.careerDetails[0]?.annualIncomeValue ));

    // Construct MongoDB query based on search parameters
    const query = {};
    if (searchParams.marital && searchParams.marital !== "all") {
      query["additionalDetails.maritalStatus"] = searchParams.marital;
    }
    if (searchParams.country) {
      query["basicDetails.placeOfBirthCountry"] = searchParams.country;
    }
    if (searchParams.state) {
      query["basicDetails.placeOfBirthState"] = searchParams.state;
    }
    if (searchParams.city) {
      query["basicDetails.placeOfBirthCity"] = searchParams.city;
    }
    if (searchParams.workingPref) {
      query["careerDetails.profession"] = searchParams.workingPref;
    }
    if (searchParams.education && searchParams.education.length > 0) {
      query["careerDetails.highestEducation"] = { $in: searchParams.education };
    }
    if (searchParams.manglik) {
      query["basicDetails.manglik"] = searchParams.manglik;
    }
    if (searchParams.agerange) {
      query["basicDetails.age"] = {
        $gte: searchParams.agerange.start,
        $lte: searchParams.agerange.end,
      };
    }
    if (searchParams.heightrange) {
      query["additionalDetails.height"] = {
        $gte: searchParams.heightrange.start,
        $lte: searchParams.heightrange.end,
      };
    }
    if (searchParams.annualincome) {
      query["careerDetails.annualIncomeValue"] = {
        $gte: searchParams.annualincome.start,
        $lte: searchParams.annualincome.end,
      };
    }

    // Execute query and retrieve matching users
    const users = await User.find(query);

    return res.status(200).json(users);
  } catch (error) {
    console.error("Error searching users:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};
