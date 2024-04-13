const mongoose = require("mongoose");

const CitySchema = mongoose.Schema({
  city_id: {
    type: String,
    required: true,
  },
  city_name: {
    type: String,
    required: true,
  },
  country_id: {
    type: String,
    required: true,
  },
  state_id: {
    type: String,
    required: true,
  },
});

const communitySchema = mongoose.Schema({
  community_id: { type: String, require: true },
  community_name: { type: String, require: true },
});

const CountrySchema = mongoose.Schema({
  country_id: {
    type: String,
    require: true,
  },
  country_name: { type: String, require: true },
  country_code: { type: String, require: true },
});

const DietSchema = mongoose.Schema({
  diet_id: { type: String, require: true },
  diet_name: { type: String, require: true },
});

const EducationSchema = mongoose.Schema({
  education_id: { type: String, require: true },
  education_name: { type: String, require: true },
});

const FitnessSchema = mongoose.Schema({
  fitness_id: { type: String, require: true },
  fitness_name: { type: String, require: true },
});

const FunActivitySchema = mongoose.Schema({
  funActivity_id: { type: String, require: true },
  funActivity_name: { type: String, require: true },
});

const InterestSchema = mongoose.Schema({
  intrest_id: { type: String, require: true },
  intrest_name: { type: String, require: true },
});

const OtherSchema = mongoose.Schema({
  other_id: { type: String, require: true },
  other_name: { type: String, require: true },
});

const ProffesionSchema = mongoose.Schema({
  proffesion_id: { type: String, require: true },
  proffesion_name: { type: String, require: true },
  proffesionType: { type: String, require: true },
});

const ReligionSchema = mongoose.Schema({
  religion_id: { type: String, require: true },
  religion_name: { type: String, require: true, default: "Hinduism" },
});

const StateSchema = mongoose.Schema({
  state_id: {
    type: String,
    require: true,
  },
  country_id: {
    type: String,
    required: true,
  },
  state_name: { type: String, require: true }
});

const State = mongoose.model("State", StateSchema);
const Religion = mongoose.model("Religion", ReligionSchema);
const Proffesion = mongoose.model("Proffesion ", ProffesionSchema);
const Other = mongoose.model("Other", OtherSchema);
const Interest = mongoose.model("Interest", InterestSchema);
const FunActivity = mongoose.model("FunActivity", FunActivitySchema);
const Fitness = mongoose.model("Fitness", FitnessSchema);
const Education = mongoose.model("Education ", EducationSchema);
const Diet = mongoose.model("Diet", DietSchema);
const Country = mongoose.model("Country", CountrySchema);
const Community = mongoose.model("community", communitySchema);
const City = mongoose.model("City", CitySchema);

module.exports = {
  City,
  Community,
  Country,
  Diet,
  Education,
  Fitness,
  FunActivity,
  Interest,
  Other,
  Proffesion,
  Religion,
  State,
};
