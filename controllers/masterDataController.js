const { State, Religion, Proffesion, Other, Interest, Fitness, Education, Diet, Country, Community, City, FunActivity} = require("../models/masterSchemas");
const csv = require("csvtojson");
const User = require("../models/Users");

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
//       //state
//       //   masterData.push({
//       //     stateId: response[i]?.state_name ,
//       //     stateName: response[i]?.country_id ,
//       //     stateCode: response[i]?.state_id
//       //   });
//       //city
//       //   masterData.push({
//       //     cityId: response[i]?.city_id,
//       //     cityName: response[i]?.city_name,
//       //     country_id: response[i]?.country_id,
//       //     state_id: response[i]?.state_id
//       //   });
//       //country
//       //   masterData.push({
//       //     countryId: response[i]?.country_id,
//       //     countryName: response[i]?.country_name,
//       //     countryCode: response[i]?.country_code
//       //   });
//       //profession
//       //   masterData.push({
//       //     ProffesionId: response[i]?.profession_id,
//       //     ProffesionName: response[i]?.profession_name,
//       //     ProffesionType: response[i]?.type,
//       //   });
//       //Interest
//       //   masterData.push({
//       //     IntrestId: response[i]?.interest_id,
//       //     IntrestName: response[i]?.interest_name,
//       //   });
//       //funactivity
//       //   masterData.push({
//       //     FunActivityId: response[i]?.fun_id,
//       //     FunActivityName: response[i]?.fun_name,
//       //   });
//       //otherInterest
//       //   masterData.push({
//       //     OtherId: response[i]?.oi_id,
//       //     OtherName: response[i]?.oi_name,
//       //   });
//       // fitnessActivity
//       // masterData.push({
//       //   FitnessId: response[i]?.fa_id,
//       //   FitnessName: response[i]?.fa_name,
//       // });
//       // diet
//       //   masterData.push({
//       //     dietId: response[i]?.diet_id,
//       //     dietName: response[i]?.diet_name,
//       //   });
//       // education
//       //   masterData.push({
//       //     EducationId: response[i]?.education_id,
//       //     EducationName: response[i]?.education_name,
//       //   });
//       // religion
//       //   masterData.push({
//       //     ReligionId: response[i]?.religion_id,
//       //     ReligionName: response[i]?.religion_name,
//       //   });
//       // community
//       //   masterData.push({
//       //     communityId: response[i]?.community_id,
//       //     communityName: response[i]?.community_name,
//       //   });
//     }

//     // await Community.insertMany(masterData);
//     res.status(201).json({ message: "uploaded", masterData });
//   } catch (err) {
//     console.log(err);
//     res.status(500).json({ message: err.message });
//   }
// };

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
      console.log(row["Education Completed"]);
      const newUser = new User({
        basicDetails: {
          name: row["Bride/Groom - First Name"] + " " + row["Bride/Groom - Middle Name"] + " " + row["Bride/Groom - Last Name"],
          gender: row["Bride/Groom Gender"] === 2 ? "F" : "M",
          placeOfBirthCountry: row["Place of Birth - Country"],
          placeOfBirthState: row["Place of Birth - State"],
          placeOfBirthCity: row["Place of Birth - City"],
          dateOfBirth: row["Date of birth"].split(" ")[0],
          timeOfBirth: row["Date of birth"].split(" ")[1] + " " + row["AM/PM"],
          age: row["Age"],
          manglik: row["Manglik Status"],
          horoscope: row[""],
        },
        additionalDetails: {
          height: row["Height (Feet)"],
          weight: row["Weight - Value"] + " " + row["Weight"]  || "60 KGS",
          email: row["Email Address"],
          contact: row["Contact Details"] + " " + row["Add Number"],
          personalAppearance: row["Personal  Appearance"],
          currentlyLivingInCountry: row["Presently Settled In Country"],
          currentlyLivingInState: row["Presently Settled in State"],
          currentlyLivingInCity: row["Presently Settled in City"],
          countryCode: row["Contact Details"],
          relocationInFuture: row["Open to Relocate in Future"],
          diet: row["Diet Type"],
          alcohol: row["Alcohol Consumption Preference"],
          smoking: row["Smoking Preference"],
          maritalStatus: row["Martial Status"],
        },
        careerDetails: {
          highestEducation: row["Education Completed"],
          highestQualification : row["Highest Qualification"],
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
          familyLocationCountry: row["Family Settled - Country"],
          familyLocationState: row["Family Settled - State"],
          familyLocationCity: row["Family Settled - City"],
          religion: row["Religion"],
          caste: row["Caste"],
          community: row["Community"],
          familyAnnualIncome: row["Family Annual Income Range"],
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
          ageRange: row["Age Range"] + "-" + row["To"],
          heightRange: row["Height (Feet) Range"] + "-" + row["To Range"],
          maritalStatus: row["Martial Status"],
          community: row["Community Of"],
          caste: row[""],
          Country: row["Country"],
          State: row["State"],
          City: row["City"],
          education: row["Qualification"],
          workingpreference: row["Working Preference"],
          annualIncomeRange: row["Annual Income Range"],
          dietType: row["Other Details - Diet"],
        },
        // Populate createdBySchema fields
        createdBy: {
          createdFor:  createdForMapping[row["This Profile is for"]],
          name: row["Your First Name"] + " " + row["Your Last Name"],
          phone: row["Contact Number - Mobile Number (Country Code)"] + " " + row["Contact Number - Mobile Number "],
          gender: row["Bride/Groom Gender"] === 2 ? "F" : "M",
        },
        gender: row["Bride/Groom Gender"] === 2 ? "F" : "M",
        regiaterationPhase: row["notApproved"],
        registerationPage: row[""],
        annualIncomeType: row["Approximate Annual Income"],
      });

      await newUser.save();
    }

    res.status(201).json({ message: "Data uploaded successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
};
