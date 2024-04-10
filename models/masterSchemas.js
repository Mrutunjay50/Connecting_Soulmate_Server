const mongoose = require("mongoose");

const CitySchema = mongoose.Schema({
  cityId: {
    type: String,
    required: true,
  },
  cityName: {
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
  communityId: { type: String, require: true },
  communityName: { type: String, require: true },
});

const CountrySchema = mongoose.Schema({
  countryId: {
    type: String,
    require: true,
  },
  countryName: { type: String, require: true },
  countryCode: { type: String, require: true },
});

const DietSchema = mongoose.Schema({
  dietId: { type: String, require: true },
  dietName: { type: String, require: true },
});

const EducationSchema = mongoose.Schema({
  EducationId: { type: String, require: true },
  EducationName: { type: String, require: true },
});

const FitnessSchema = mongoose.Schema({
  FitnessId: { type: String, require: true },
  FitnessName: { type: String, require: true },
});

const FunActivitySchema = mongoose.Schema({
  FunActivityId: { type: String, require: true },
  FunActivityName: { type: String, require: true },
});

const InterestSchema = mongoose.Schema({
  IntrestId: { type: String, require: true },
  IntrestName: { type: String, require: true },
});

const OtherSchema = mongoose.Schema({
  OtherId: { type: String, require: true },
  OtherName: { type: String, require: true },
});

const ProffesionSchema = mongoose.Schema({
  ProffesionId: { type: String, require: true },
  ProffesionName: { type: String, require: true },
  ProffesionType: { type: String, require: true },
});

const ReligionSchema = mongoose.Schema({
  ReligionId: { type: String, require: true },
  ReligionName: { type: String, require: true, default: "Hinduism" },
});

const StateSchema = mongoose.Schema({
  stateId: {
    type: String,
    require: true,
  },
  country_id: {
    type: String,
    required: true,
  },
  stateName: { type: String, require: true }
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
