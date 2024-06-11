const {
    Interest,
    FunActivity,
    Fitness,
    Other,
  } = require("../../models/masterSchemas");
const { getSignedUrlFromS3 } = require("../../utils/s3Utils");

exports.processUserDetails = async (selfDetails) => {
    // Fetch signed URLs for profile picture and user photos
    const profileUrl = await getSignedUrlFromS3(selfDetails?.profilePicture);
    selfDetails.profilePictureUrl = profileUrl || "";
  
    const signedUrlsPromises = selfDetails?.userPhotos.map((item) =>
      getSignedUrlFromS3(item)
    );
    const signedUrls = await Promise.all(signedUrlsPromises);
    selfDetails.userPhotosUrl = signedUrls;
  
    // Parse the interests, funActivities, others, and fitness fields
    const interests = selfDetails.interests
      .split(",")
      .map((interest) => parseInt(interest.trim()) || 0);
    const funActivities = selfDetails.fun
      .split(",")
      .map((activity) => parseInt(activity.trim()) || 0);
    const others = selfDetails.other
      .split(",")
      .map((other) => parseInt(other.trim()) || 0);
    const fitnesses = selfDetails.fitness
      .split(",")
      .map((fitness) => parseInt(fitness.trim()) || 0);
  
    // Fetch the corresponding types from the database
    const [interest, funActivity, fitness, other] = await Promise.all([
      Interest.find({ intrest_id: { $in: interests } }),
      FunActivity.find({ funActivity_id: { $in: funActivities } }),
      Fitness.find({ fitness_id: { $in: fitnesses } }),
      Other.find({ other_id: { $in: others } }),
    ]);
  
    selfDetails.interestsTypes = interest
      ?.map((item) => item.intrest_name)
      ?.join(", ");
    selfDetails.funActivitiesTypes = funActivity
      ?.map((item) => item.funActivity_name)
      ?.join(", ");
    selfDetails.fitnessTypes = fitness
      ?.map((item) => item.fitness_name)
      ?.join(", ");
    selfDetails.otherTypes = other?.map((item) => item.other_name)?.join(", ");
  
    return selfDetails;
  };
  