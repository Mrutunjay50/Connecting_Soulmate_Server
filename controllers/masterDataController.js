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
const User = require("../models/Users");
const moment = require("moment");

// exports.masterDataCSV = async (req, res) => {
//   let masterData = [];
//   try {
//     const response = await csv().fromFile(req.file.path);

//     for (var i = 0; i < response.length; i++) {
//       // Check if any of the properties in the response object is an empty string
//       if (
//         Object.values(response[i]).some(
//           (value) => typeof value === "string" && value.trim() === ""
//         )
//       ) {
//         // Skip this iteration if any property has an empty string
//         continue;
//       }
//       // state
//         // masterData.push({
//         //   stateId: response[i]?.state_id ,
//         //   country_id: response[i]?.country_id ,
//         //   state_name: response[i]?.state_name ,
//         // });
//       //city
//       //   masterData.push({
//       //     city_id: response[i]?.city_id,
//       //     city_name: response[i]?.city_name,
//       //     country_id: response[i]?.country_id,
//       //     state_id: response[i]?.state_id
//       //   });
//       //country
//       //   masterData.push({
//       //     countryId: response[i]?.country_id,
//       //     country_name: response[i]?.country_name,
//       //     countryCode: response[i]?.country_code
//       //   });
//       //profession
//       //   masterData.push({
//       //     ProffesionId: response[i]?.profession_id,
//       //     Proffesion_name: response[i]?.profession_name,
//       //     ProffesionType: response[i]?.type,
//       //   });
//       //Interest
//       //   masterData.push({
//       //     IntrestId: response[i]?.interest_id,
//       //     Intrest_name: response[i]?.interest_name,
//       //   });
//       //funactivity
//       //   masterData.push({
//       //     FunActivityId: response[i]?.fun_id,
//       //     FunActivity_name: response[i]?.fun_name,
//       //   });
//       //otherInterest
//       //   masterData.push({
//       //     OtherId: response[i]?.oi_id,
//       //     Other_name: response[i]?.oi_name,
//       //   });
//       // fitnessActivity
//       // masterData.push({
//       //   FitnessId: response[i]?.fa_id,
//       //   Fitness_name: response[i]?.fa_name,
//       // });
//       // diet
//       //   masterData.push({
//       //     dietId: response[i]?.diet_id,
//       //     diet_name: response[i]?.diet_name,
//       //   });
//       // education
//       //   masterData.push({
//       //     EducationId: response[i]?.education_id,
//       //     Education_name: response[i]?.education_name,
//       //   });
//       // religion
//       //   masterData.push({
//       //     ReligionId: response[i]?.religion_id,
//       //     Religion_name: response[i]?.religion_name,
//       //   });
//       // community
//       //   masterData.push({
//       //     communityId: response[i]?.community_id,
//       //     community_name: response[i]?.community_name,
//       //   });
//     }

//     await State.insertMany(masterData);
//     res.status(201).json({ message: "uploaded", masterData });
//   } catch (err) {
//     console.log(err);
//     res.status(500).json({ message: err.message });
//   }
// };

exports.addProffesion = async (req, res) => {
  try {
    const { proffesion_id, proffesion_name } = req.body;

    const newProffesion = new Proffesion({
      proffesion_id,
      proffesion_name,
    });

    const savedProffesion = await newProffesion.save();

    res.status(201).json(savedProffesion);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

exports.uploadcsv = async (req, res) => {
  try {
    // Mapping object for numerical values to createdFor options
    const createdForMapping = {
      1: "myself",
      2: "myson",
      3: "mydaughter",
      4: "mybrother",
      5: "mysister",
      6: "myfriend",
      7: "myrelative",
    };
    // Parse CSV file into JSON format
    const response = await csv().fromFile(req.file.path);

    for (const row of response) {
      const newUser = new User({
        basicDetails: {
          name:
            row["Bride/Groom - First Name"] +
            " " +
            row["Bride/Groom - Middle Name"] +
            " " +
            row["Bride/Groom - Last Name"],
          gender: row["Bride/Groom Gender"] === "2" ? "F" : "M",
          placeOfBirthCountry: parseInt(row["Place of Birth - Country"]) || 0,
          placeOfBirthState: parseInt(row["Place of Birth - State"]) || 0,
          placeOfBirthCity: parseInt(row["Place of Birth - City"]) || 0,
          dateOfBirth: row["Date of birth"]?.split(" ")[0],
          timeOfBirth: row["Date of birth"]?.split(" ")[1] + " " + row["AM/PM"],
          age: parseInt(row["Age"]) || 0,
          manglik: row["Manglik Status"],
          horoscope: row[""],
          userId: "",
        },
        additionalDetails: {
          height: parseInt(row["Height (Feet)"]) || 0,
          weight: row["Weight - Value"] + " " + row["Weight"] || "60 KGS",
          email: row["Email Address"],
          contact: row["Contact Details"] + " " + row["Add Number"],
          personalAppearance: row["Personal  Appearance"],
          currentlyLivingInCountry: parseInt(row["Presently Settled In Country"]) || 0,
          currentlyLivingInState: parseInt(row["Presently Settled in State"]) || 0,
          currentlyLivingInCity: parseInt(row["Presently Settled in City"]) || 0,
          countryCode: row["Contact Details"],
          relocationInFuture: row["Open to Relocate in Future"],
          diet: row["Diet Type"],
          alcohol: row["Alcohol Consumption Preference"],
          smoking: row["Smoking Preference"],
          maritalStatus: row["Martial Status"],
        },
        careerDetails: {
          highestEducation: row["Education Completed"],
          highestQualification: row["Highest Qualification"],
          passingYear: row["Passing Year"],
          "school/university": row["School / University"],
          profession: row["Profession"],
          currentDesignation: row["Current Designation"],
          previousOccupation: row["Previous Occupation"],
          annualIncomeValue: row["Approximate Annual Income value"],
        },
        familyDetails: {
          fatherName: row["Father's Name (First Name, Middle Name, Last Name)"],
          fatherOccupation: row["Father's Occupation"],
          motherName: row["Mother's Name (First Name, Middle Name, Last Name)"],
          motherOccupation: row["Mother's Occupation"],
          siblings: row["Siblings [Brother 1]"],
          withFamilyStatus: row["Bride / Groom Lives with Family"],
          familyLocationCountry: parseInt(row["Family Settled - Country"]) || 0,
          familyLocationState: parseInt(row["Family Settled - State"]) || 0,
          familyLocationCity: parseInt(row["Family Settled - City"]) || 0,
          religion: row["Religion"],
          caste: row["Caste"],
          community: row["Community"],
          familyAnnualIncomeStart: parseInt(row["Family Annual Income Range"]?.split("-")[0]?.trim()) || 0,
          familyAnnualIncomeEnd: parseInt(row["Family Annual Income Range"]?.split("-")[1]?.trim()) || 0,
        },
        // Populate selfDescriptionSchema fields
        selfDetails: {
          interests: row["Interests"],
          fun: row["Fun"],
          fitness: row["Fitness"],
          other: row["Other Interests"],
          profilePicture: row[""],
          userPhotos: row[""],
          userPhotosUrl: row[""],
          profilePictureUrl: row[""],
          aboutYourself: row["About Yourself"],
        },
        // Populate preferenceSchema fields
        partnerPreference: {
          ageRangeStart: parseInt(row["Age Range"]) || 0,
          ageRangeEnd: parseInt(row["To"]) || 0,
          heightRangeStart: parseInt(row["Height (Feet) Range"]) || 0,
          heightRangeEnd: parseInt(row["To Range"]) || 0,
          maritalStatus: row["Martial Status"],
          community: parseInt(row["Community Of"]) || 0,
          caste: parseInt(row[""]) || 0,
          country: parseInt(row["Country"]) || 0,
          state: parseInt(row["State"]) || 0,
          city: parseInt(row["City"]) || 0,
          education: row["Qualification"],
          workingpreference: row["Working Preference"],
          annualIncomeRangeStart: parseInt(row["Annual Income Range"]?.split("-")[0]?.trim()) || 0,
          annualIncomeRangeEnd: parseInt(row["Annual Income Range"]?.split("-")[1]?.trim()) || 0,
          dietType: row["Other Details - Diet"],
        },
        // Populate createdBySchema fields
        createdBy: {
          createdFor: createdForMapping[row["This Profile is for"]],
          name: row["Your First Name"] + " " + row["Your Last Name"],
          phone:
            row["Contact Number - Mobile Number (Country Code)"] +
            " " +
            row["Contact Number - Mobile Number "],
          gender: row["Bride/Groom Gender"] === "2" ? "F" : "M",
        },
        gender: row["Bride/Groom Gender"] === "2" ? "F" : "M",
        regiaterationPhase: row["notApproved"],
        registerationPage: row[""],
        annualIncomeType: row["Approximate Annual Income"],
        userId: "",
      });

      // Generate userId based on the data
      const genderPrefix = newUser.basicDetails[0].gender;
      const namePrefix = newUser.basicDetails[0].name.slice(0, 3).toUpperCase();
      const dob = moment(newUser.basicDetails[0].dateOfBirth, "YYYY-MM-DD");
      const dobFormatted = dob.format("YYYYMMDD");
      const timeOfBirth = newUser.basicDetails[0].timeOfBirth.replace(":", "");
      const loginTime = moment().format("HHmmss");

      newUser.basicDetails[0].userId =
        `${genderPrefix}${namePrefix}${dobFormatted}${timeOfBirth}${loginTime}`
          .toUpperCase()
          .replaceAll(" ", "");
      newUser.userId =
        `${genderPrefix}${namePrefix}${dobFormatted}${timeOfBirth}${loginTime}`
          .toUpperCase()
          .replaceAll(" ", "")

      await newUser.save();
    }

    res.status(201).json({ message: "Data uploaded successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
};
