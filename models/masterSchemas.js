const mongoose = require("mongoose");

const CitySchema = mongoose.Schema({
  city_id: {
    type: Number,
    required: true,
  },
  city_name: {
    type: String,
    required: true,
  },
  country_id: {
    type: Number,
    required: true,
  },
  state_id: {
    type: Number,
    required: true,
  },
});

const communitySchema = mongoose.Schema({
  community_id: { type: Number, require: true },
  community_name: { type: String, require: true },
});

const CountrySchema = mongoose.Schema({
  country_id: {
    type: Number,
    require: true,
  },
  country_name: { type: String, require: true },
  country_code: { type: String, require: true },
});

const DietSchema = mongoose.Schema({
  diet_id: { type: Number, require: true },
  diet_name: { type: String, require: true },
});

const EducationSchema = mongoose.Schema({
  education_id: { type: Number, require: true },
  education_name: { type: String, require: true },
});

const FitnessSchema = mongoose.Schema({
  fitness_id: { type: Number, require: true },
  fitness_name: { type: String, require: true },
});

const FunActivitySchema = mongoose.Schema({
  funActivity_id: { type: Number, require: true },
  funActivity_name: { type: String, require: true },
});

const InterestSchema = mongoose.Schema({
  intrest_id: { type: Number, require: true },
  intrest_name: { type: String, require: true },
});

const OtherSchema = mongoose.Schema({
  other_id: { type: Number, require: true },
  other_name: { type: String, require: true },
});

const ProffesionSchema = mongoose.Schema({
  proffesion_id: { type: Number, require: true },
  proffesion_name: { type: String, require: true },
  proffesion_type: { type: String, require: true },
});

const ReligionSchema = mongoose.Schema({
  religion_id: { type: Number, require: true },
  religion_name: { type: String, require: true, default: "Hinduism" },
});

const StateSchema = mongoose.Schema({
  state_id: {
    type: Number,
    require: true,
  },
  country_id: {
    type: Number,
    required: true,
  },
  state_name: { type: String, require: true }
});

const Country = mongoose.model("Country", CountrySchema);
const State = mongoose.model("State", StateSchema);
const City = mongoose.model("City", CitySchema);
const Religion = mongoose.model("Religion", ReligionSchema);
const Community = mongoose.model("community", communitySchema);
const Education = mongoose.model("Education", EducationSchema);
const Proffesion = mongoose.model("Proffesion", ProffesionSchema);
const Interest = mongoose.model("Interest", InterestSchema);
const FunActivity = mongoose.model("FunActivity", FunActivitySchema);
const Other = mongoose.model("Other", OtherSchema);
const Fitness = mongoose.model("Fitness", FitnessSchema);
const Diet = mongoose.model("Diet", DietSchema);

module.exports = {
  Country,
  State,
  City,
  Religion,
  Community,
  Education,
  Proffesion,
  Interest,
  FunActivity,
  Other,
  Fitness,
  Diet,
};
