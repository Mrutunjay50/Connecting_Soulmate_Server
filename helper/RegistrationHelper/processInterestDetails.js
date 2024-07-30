const {
    Interest,
    FunActivity,
    Fitness,
    Other,
  } = require("../../models/masterSchemas");
const { getPublicUrlFromS3 } = require("../../utils/s3Utils");

exports.processUserDetails = async (selfDetails) => {
    // Fetch signed URLs for profile picture and user photos
    const profileUrl = getPublicUrlFromS3(selfDetails?.profilePicture);
    selfDetails.profilePictureUrl = profileUrl || "";
  
    const signedUrlsPromises = selfDetails?.userPhotos.map((item) =>
      getPublicUrlFromS3(item)
    );
    const signedUrls = await Promise.all(signedUrlsPromises);
    selfDetails.userPhotosUrl = signedUrls;
  
    // Function to parse values or return "NA" if the value is "NA"
    const parseValues = (value) => {
      if (value === "NA") return "NA";
      return value.split(",").map((item) => parseInt(item.trim()) || 0);
    };

    // Parse the interests, funActivities, others, and fitness fields
    const interests = parseValues(selfDetails.interests);
    const funActivities = parseValues(selfDetails.fun);
    const others = parseValues(selfDetails.other);
    const fitnesses = parseValues(selfDetails.fitness);

    // if (interests === "NA" && funActivities === "NA" && others === "NA" && fitnesses === "NA") {
    //   return selfDetails;
    // }
  
    // Fetch the corresponding types from the database
    const [interest, funActivity, fitness, other] = await Promise.all([
      interests !== "NA" ? Interest.find({ intrest_id: { $in: interests } }) : [],
      funActivities !== "NA" ? FunActivity.find({ funActivity_id: { $in: funActivities } }) : [],
      fitnesses !== "NA" ? Fitness.find({ fitness_id: { $in: fitnesses } }) : [],
      others !== "NA" ? Other.find({ other_id: { $in: others } }) : [],
    ]);
  
    // Set types to "NA" if the original value was "NA"
    selfDetails.interestsTypes = interests === "NA"
      ? "NA"
      : interest.map((item) => item.intrest_name).join(", ");
    selfDetails.funActivitiesTypes = funActivities === "NA"
      ? "NA"
      : funActivity.map((item) => item.funActivity_name).join(", ");
    selfDetails.fitnessTypes = fitnesses === "NA"
      ? "NA"
      : fitness.map((item) => item.fitness_name).join(", ");
    selfDetails.otherTypes = others === "NA"
      ? "NA"
      : other.map((item) => item.other_name).join(", ");

    return selfDetails;
  };
  