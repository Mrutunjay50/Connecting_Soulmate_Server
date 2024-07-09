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

const modelMapping = {
  state: State,
  city: City,
  country: Country,
  profession: Proffesion,
  interest: Interest,
  funactivity: FunActivity,
  other: Other,
  fitness: Fitness,
  diet: Diet,
  education: Education,
  religion: Religion,
  community: Community,
};

exports.masterDataCSV = async (req, res) => {
  try {
    const { type } = req.params;
    const Model = modelMapping[type];

    if (!Model) {
      return res.status(400).json({ message: "Invalid type parameter" });
    }

    const response = await csv().fromFile(req.file.path);
    const masterData = [];

    for (const row of response) {
      if (Object.values(row).some(value => typeof value === "string" && value.trim() === "")) {
        continue; // Skip rows with empty fields
      }

      let data;
      switch (type) {
        case 'state':
          data = {
            state_id: row?.state_id,
            country_id: row?.country_id,
            state_name: row?.state_name,
          };
          break;
        case 'city':
          data = {
            city_id: row?.city_id,
            city_name: row?.city_name,
            country_id: row?.country_id,
            state_id: row?.state_id,
          };
          break;
        case 'country':
          data = {
            country_id: row?.country_id,
            country_name: row?.country_name,
            country_code: row?.country_code,
          };
          break;
        case 'profession':
          data = {
            proffesion_id: parseInt(row?.profession_id),
            proffesion_name: row?.profession_name,
            proffesion_type: row?.type,
          };
          break;
        case 'interest':
          data = {
            intrest_id: row?.interest_id,
            intrest_name: row?.interest_name,
          };
          break;
        case 'funactivity':
          data = {
            funActivity_id: row?.fun_id,
            funActivity_name: row?.fun_name,
          };
          break;
        case 'other':
          data = {
            other_id: row?.oi_id,
            other_name: row?.oi_name,
          };
          break;
        case 'fitness':
          data = {
            fitness_id: row?.fa_id,
            fitness_name: row?.fa_name,
          };
          break;
        case 'diet':
          data = {
            diet_id: row?.diet_id,
            diet_name: row?.diet_name,
          };
          break;
        case 'education':
          data = {
            education_id: row?.education_id,
            education_name: row?.education_name,
          };
          break;
        case 'religion':
          data = {
            religion_id: row?.religion_id,
            religion_name: row?.religion_name,
          };
          break;
        case 'community':
          data = {
            community_id: row?.community_id,
            community_name: row?.community_name,
          };
          break;
        default:
          continue; // Skip if type doesn't match any case
      }

      masterData.push(data);
    }

    await Model.insertMany(masterData);
    res.status(201).json({ message: "Data uploaded successfully", masterData });
  } catch (err) {
    console.error(err);
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

      // Check for existing user by phone number
      const existingUser = await User.findOne({ 'createdBy.phone': row["Contact Number - Mobile Number (Country Code)"].replace("+", "") + row["Contact Number - Registration Number"] });
      if (existingUser) {
        console.log(`User with phone number ${row["Contact Number - Mobile Number (Country Code)"].replace("+", "") + row["Contact Number - Registration Number"]} already exists. Skipping.`);
        continue; // Skip this iteration if the user already exists
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
          ) * exchangeRate) || "0",
          annualIncomeValue:
            parseInt(
              row["Approximate Annual Income value"]?.split("-")[1]?.trim()
            ) || "0",
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
          caste: parseInt(row[""]) || 0,
          annualIncomeRangeStart:
            parseInt(row["Annual Income Range"]?.split("-")[0]?.trim()) || 0,
          annualIncomeRangeEnd:
            parseInt(row["Annual Income Range"]?.split("-")[1]?.trim()) || 0,
          maritalStatus: row["P Martial Status"] === "Open to all" ? "" : (maritalstatus[parseInt(row["P Martial Status"])]) || "single",
          community: row["Community"] === "Open to all" ? "" : (row["Community"]) || "",
          country: row["Country"] === "Open to all" ? "" : (row["Country"]) || "",
          state: row["State"] === "Open to all" ? "" : (row["State"]) || "",
          city: row["City"] === "Open to all" ? "" : (row["City"]) || "",
          education: row["Qualification"] === "Open to all" ? "" : row["Qualification"] || "",
          workingpreference: row["Working Preference"] === "Open to all" ? "" : row["Working Preference"] || "",
          profession: row["P Profession"] === "Open to all" ? "" : (row["P Profession"]) || "",
          dietType: row["Other Details - Diet"] === "Open to all" ? "" : row["Other Details - Diet"] || "",
        },
        // Populate createdBySchema fields
        createdBy: {
          createdFor: createdForMapping[row["This Profile is for"]],
          name: row["Your First Name"] + " " + row["Your Last Name"],
          phone:
            row["Contact Number - Mobile Number (Country Code)"].replace(
              "+",
              ""
            ) + row["Contact Number - Registration Number"],
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


exports.cleanUserPhotos = async (req, res) => {
  try {
    // Find all users
    const users = await User.find();

    for (let user of users) {
      let hasChanges = false;

      // Clean up userPhotos in selfDetails
      user.selfDetails.forEach((selfDetail) => {
        const originalLength = selfDetail.userPhotos.length;
        selfDetail.userPhotos = selfDetail.userPhotos.filter(photo => photo !== "");

        // Check if any changes were made
        if (selfDetail.userPhotos.length !== originalLength) {
          hasChanges = true;
        }
        console.log(selfDetail.userPhotos);
      });

      // Save the user document if there were changes
      if (hasChanges) {
        await user.save();
      }
    }

    res.status(200).json({ message: "User photos cleaned successfully" });
  } catch (error) {
    console.error("Error cleaning user photos:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};