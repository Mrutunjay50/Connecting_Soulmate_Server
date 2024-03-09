const {
  State,
  Religion,
  Proffesion,
  Other,
  Interest,
  Fitness,
  Education,
  Diet,
  Country,
  Community,
  City,
  FunActivity,
} = require("../models/masterSchemas");
const csv = require("csvtojson");

exports.uploadcsv = async (req, res) => {
  let masterData = [];
  try {
    const response = await csv().fromFile(req.file.path);

    for (var i = 0; i < response.length; i++) {
      // Check if any of the properties in the response object is an empty string
      if (
        Object.values(response[i]).some(
          (value) => typeof value === "string" && value.trim() === ""
        )
      ) {
        // Skip this iteration if any property has an empty string
        continue;
      }
      //state
      //   masterData.push({
      //     stateId: response[i]?.state_name ,
      //     stateName: response[i]?.country_id ,
      //     stateCode: response[i]?.state_id
      //   });
      //city
      //   masterData.push({
      //     cityId: response[i]?.city_id,
      //     cityName: response[i]?.city_name,
      //     country_id: response[i]?.country_id,
      //     state_id: response[i]?.state_id
      //   });
      //country
      //   masterData.push({
      //     countryId: response[i]?.country_id,
      //     countryName: response[i]?.country_name,
      //     countryCode: response[i]?.country_code
      //   });
      //profession
      //   masterData.push({
      //     ProffesionId: response[i]?.profession_id,
      //     ProffesionName: response[i]?.profession_name,
      //     ProffesionType: response[i]?.type,
      //   });
      //Interest
      //   masterData.push({
      //     IntrestId: response[i]?.interest_id,
      //     IntrestName: response[i]?.interest_name,
      //   });
      //funactivity
      //   masterData.push({
      //     FunActivityId: response[i]?.fun_id,
      //     FunActivityName: response[i]?.fun_name,
      //   });
      //otherInterest
      //   masterData.push({
      //     OtherId: response[i]?.oi_id,
      //     OtherName: response[i]?.oi_name,
      //   });
      // fitnessActivity
      // masterData.push({
      //   FitnessId: response[i]?.fa_id,
      //   FitnessName: response[i]?.fa_name,
      // });
      // diet
      //   masterData.push({
      //     dietId: response[i]?.diet_id,
      //     dietName: response[i]?.diet_name,
      //   });
      // education
      //   masterData.push({
      //     EducationId: response[i]?.education_id,
      //     EducationName: response[i]?.education_name,
      //   });
      // religion
      //   masterData.push({
      //     ReligionId: response[i]?.religion_id,
      //     ReligionName: response[i]?.religion_name,
      //   });
      // community
      //   masterData.push({
      //     communityId: response[i]?.community_id,
      //     communityName: response[i]?.community_name,
      //   });
    }

    // await Community.insertMany(masterData);
    res.status(201).json({ message: "uploaded", masterData });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: err.message });
  }
};

exports.addProffesion = async (req, res) => {
  try {
    const { ProffesionId, ProffesionName } = req.body;

    const newProffesion = new Proffesion({
      ProffesionId,
      ProffesionName,
    });

    const savedProffesion = await newProffesion.save();

    res.status(201).json(savedProffesion);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
