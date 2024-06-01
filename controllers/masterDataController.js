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

function generateUniqueNumber() {
  const randomNumber = Math.floor(Math.random() * 100);
  const uniqueNumber = `${randomNumber}`;
  return uniqueNumber;
}

exports.masterDataCSV = async (req, res) => {
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
      // state
      // masterData.push({
      //   state_id: response[i]?.state_id,
      //   country_id: response[i]?.country_id,
      //   state_name: response[i]?.state_name,
      // });
      //city
      // masterData.push({
      //     city_id: response[i]?.city_id,
      //     city_name: response[i]?.city_name,
      //     country_id: response[i]?.country_id,
      //     state_id: response[i]?.state_id
      //   });
      //country
        // masterData.push({
        //   country_id: response[i]?.country_id,
        //   country_name: response[i]?.country_name,
        //   country_code: response[i]?.country_code
        // });
      //profession
        masterData.push({
          proffesion_id: parseInt(response[i]?.profession_id),
          proffesion_name: response[i]?.profession_name,
          proffesion_type: response[i]?.type,
        });
      //Interest
        // masterData.push({
        //     intrest_id: response[i]?.interest_id,
        //     intrest_name: response[i]?.interest_name,
        // });
      //funactivity
        // masterData.push({
        //     funActivity_id: response[i]?.fun_id,
        //   funActivity_name: response[i]?.fun_name,
        // });
      //otherInterest
        // masterData.push({
        //   other_id: response[i]?.oi_id,
        //   other_name: response[i]?.oi_name,
        // });
      // fitnessActivity
      // masterData.push({
      //   fitness_id: response[i]?.fa_id,
      //   fitness_name: response[i]?.fa_name,
      // });
      // diet
        // masterData.push({
        //   diet_id: response[i]?.diet_id,
        //   diet_name: response[i]?.diet_name,
        // });
        // education
        // masterData.push({
        //     education_id: response[i]?.education_id,
        //     education_name: response[i]?.education_name,
        // });
      // religion
        // masterData.push({
        //   religion_id: response[i]?.religion_id,
        //   religion_name: response[i]?.religion_name,
        // });
        // community
        // masterData.push({
        //     community_id: response[i]?.community_id,
        //     community_name: response[i]?.community_name,
        //   });
        }
        
        // await State.insertMany(masterData);
        // await City.insertMany(masterData);
        // await Country.insertMany(masterData);
        await Proffesion.insertMany(masterData);
    // await Interest.insertMany(masterData);
    // await FunActivity.insertMany(masterData);
    // await Other.insertMany(masterData);
    // await Fitness.insertMany(masterData);
    // await Diet.insertMany(masterData);
    // await Education.insertMany(masterData);
    // await Religion.insertMany(masterData);
    // await Community.insertMany(masterData);
    res.status(201).json({ message: "uploaded", masterData });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: err.message });
  }
};

function calculateAge(birthDateStr) {
  // Parse the birth date string
  const [datePart, timePart] = birthDateStr.split(" ");
  const [day, month, year] = datePart.split("/");

  // Create a new Date object with the parsed components
  const birthDate = new Date(`${year}-${month}-${day}T${timePart}`);

  // Get today's date
  const today = new Date();

  // Calculate the difference in years
  let age = today.getFullYear() - birthDate.getFullYear();

  // Check if the birthday hasn't occurred yet this year
  const hasBirthdayPassed =
    today.getMonth() > birthDate.getMonth() ||
    (today.getMonth() === birthDate.getMonth() &&
      today.getDate() >= birthDate.getDate());

  // If the birthday hasn't occurred yet this year, subtract 1 from the age
  if (!hasBirthdayPassed) {
    age--;
  }

  return age;
}

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
    const manglik = {
      1: "yes",
      2: "no",
      3: "partial",
      4: "notsure",
    };
    const maritalstatus = {
      1: "single",
      2: "divorcee",
      3: "awaitingdivorce",
      4: "widoworwidower",
    };
    // Parse CSV file into JSON format
    const response = await csv().fromFile(req.file.path);

    for (const row of response) {
      const currencyType = row["Approximate Annual Income"].split("(")[1]?.replace(")", "") || "INR";
      let exchangeRate;
      switch (currencyType) {
        case "INR":
          exchangeRate = 0.015;
          break;
        case "AED":
          exchangeRate = 0.27;
          break;
        case "GBP":
          exchangeRate = 1.38;
          break;
        // Add more cases for other currency types if needed
        default:
          exchangeRate = 1; // Default exchange rate
      }
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
          dateOfBirth: (() => {
            const parts = row["Date of birth"]?.split(" ")[0].split("/");
            if (parts && parts.length === 3) {
              [parts[0], parts[2]] = [parts[2], parts[0]]; // Swap the first and last elements
              return parts.join("-"); // Join the elements with slashes
            }
            return null; // Return null or handle the case where the date is not in the expected format
          })(),
          timeOfBirth: row["Date of birth"]?.split(" ")[1] + " " + row["AM/PM"],
          age: calculateAge(row["Date of birth"]),
          manglik: manglik[parseInt(row["Manglik Status"]) || "yes"],
          horoscope: row["Horoscope Match"],
          userId: "",
        },
        additionalDetails: {
          height: row["Height (Feet)"] || 5,
          weight: row["Weight - Value"] + " " + row["Weight"] || "60 KGS",
          email: row["Email Address"],
          contact: row["Contact Details"].replace("+", "") + row["Add Number"],
          personalAppearance: row["Personal  Appearance"],
          currentlyLivingInCountry:
            parseInt(row["Presently Settled In Country"]) || 0,
          currentlyLivingInState:
            parseInt(row["Presently Settled in State"]) || 0,
          currentlyLivingInCity:
            parseInt(row["Presently Settled in City"]) || 0,
          countryCode: row["Contact Details"],
          relocationInFuture: row["Open to Relocate in Future"],
          diet: parseInt(row["Diet Type"]) || 0,
          alcohol: row["Alcohol Consumption Preference"],
          smoking: row["Smoking Preference"],
          maritalStatus: maritalstatus[parseInt(row["Martial Status"]) || "single"],
        },
        careerDetails: {
          highestEducation: row["Education Completed"],
          highestQualification: row["Highest Qualification"],
          passingYear: row["Passing Year"],
          "school/university": row["School / University"],
          profession: parseInt(row["Profession"]) || 0,
          currentDesignation: row["Current Designation"],
          previousOccupation: row["Previous Occupation"],
          annualIncomeUSD: (parseInt(
            row["Approximate Annual Income value"]?.split("-")[1]?.trim()
          ) * exchangeRate) || 0,
          annualIncomeValue:
            parseInt(
              row["Approximate Annual Income value"]?.split("-")[1]?.trim()
            ) || 0,
          currencyType:currencyType,
        },
        familyDetails: {
          fatherName: row["Father's Name (First Name, Middle Name, Last Name)"],
          fatherOccupation: row["Father's Occupation"],
          motherName: row["Mother's Name (First Name, Middle Name, Last Name)"],
          motherOccupation: row["Mother's Occupation"],
          users: [
            {
              gender: "M", // Assuming this column contains the gender of the sibling
              option: row["Siblings [Brother 1]"] || "Unmarried", // You can set this to a default value or leave it empty
            },
            {
              gender: "F", // Assuming this column contains the gender of the sibling
              option: row["Siblings [Sister 1]"] || "Unmarried", // You can set this to a default value or leave it empty
            },
            {
              gender: "F", // Assuming this column contains the gender of the sibling
              option: row["Siblings [Sister 2]"] || "Unmarried", // You can set this to a default value or leave it empty
            },
            {
              gender: "F", // Assuming this column contains the gender of the sibling
              option: row["Siblings [Sister 3]"] || "Unmarried", // You can set this to a default value or leave it empty
            },
          ],
          withFamilyStatus: row["Bride / Groom Lives with Family"],
          familyLocationCountry: parseInt(row["Family Settled - Country"]) || 0,
          familyLocationState: parseInt(row["Family Settled - State"]) || 0,
          familyLocationCity: parseInt(row["Family Settled - City"]) || 0,
          religion: parseInt(row["Religion"]) || 0,
          caste: row["Caste"],
          community: parseInt(row["F Community"]) || 0,
          familyAnnualIncomeStart:
            parseInt(
              row["Family Annual Income Range"]?.split("-")[0]?.trim()
            ) || 0,
          familyAnnualIncomeEnd:
            parseInt(
              row["Family Annual Income Range"]?.split("-")[1]?.trim()
            ) || 0,
        },
        // Populate selfDescriptionSchema fields
        selfDetails: {
          interests: row["Interests"],
          fun: row["Fun"],
          fitness: row["Fitness"],
          other: row["Other Interests"],
          profilePicture:
            (row["Images"] + ",").split(",").join(".jpeg,").split(",")[0] || "",
          userPhotos: (row["Images"] + ",").split(",").join(".jpeg,").split(",") || [],
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
          maritalStatus: maritalstatus[parseInt(row["P Martial Status"]) || "single"],
          community: parseInt(row["Community"]) || 0,
          caste: parseInt(row[""]) || 0,
          country: parseInt(row["Country"]) || 0,
          state: parseInt(row["State"]) || 0,
          city: parseInt(row["City"]) || 0,
          education: row["Qualification"],
          workingpreference: row["Working Preference"],
          profession: parseInt(row["P Profession"]) || 0,
          annualIncomeRangeStart:
            parseInt(row["Annual Income Range"]?.split("-")[0]?.trim()) || 0,
          annualIncomeRangeEnd:
            parseInt(row["Annual Income Range"]?.split("-")[1]?.trim()) || 0,
          dietType: row["Other Details - Diet"] || "",
        },
        // Populate createdBySchema fields
        createdBy: {
          createdFor: createdForMapping[row["This Profile is for"]],
          name: row["Your First Name"] + " " + row["Your Last Name"],
          phone:
            row["Contact Number - Mobile Number (Country Code)"].replace(
              "+",
              ""
            ) + row["Contact Number - Mobile Number"],
          gender: row["Bride/Groom Gender"] === "2" ? "F" : "M",
        },
        gender: row["Bride/Groom Gender"] === "2" ? "F" : "M",
        registrationPhase: "registering",
        registrationPage: "1",
        annualIncomeType:
          row["Approximate Annual Income"].split("(")[1]?.replace(")", "") ||
          "INR",
        userId: "",
        accessType: "2",
        isDeleted: false,
        isProfileRequest : false,
        isInterestRequest : false,
        isShortListed : false,
        isBlocked : false
      });

      // Generate userId based on the data
      const genderPrefix = generateUniqueNumber();
      const namePrefix = newUser.basicDetails[0].name.slice(0, 2).toUpperCase();
      const dob = moment(newUser.basicDetails[0].dateOfBirth, "YYYY-MM-DD");
      const dobFormatted = dob.format("YYYYMM");
      console.log(dobFormatted);
      // Count all user documents
      const noOfUsers = await User.countDocuments({});

      newUser.basicDetails[0].userId =
        `CS${namePrefix}${genderPrefix}${noOfUsers}${dobFormatted}`
          ?.toUpperCase()
          .replaceAll(" ", "");
      newUser.userId =
        `CS${namePrefix}${genderPrefix}${noOfUsers}${dobFormatted}`
          ?.toUpperCase()
          .replaceAll(" ", "");

      await newUser.save();
    }

    res.status(201).json({ message: "Data uploaded successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
};
