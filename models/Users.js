const mongoose = require("mongoose");

const basicDetailsSchema = mongoose.Schema({
  name: { type: String, required: true },
  gender: { type: String, required: true },
  placeOfBirthCountry: { type: Number, required: true },
  placeOfBirthState: { type: Number, required: true },
  placeOfBirthCity: { type: Number, required: true },
  dateOfBirth: { type: String, required: true },
  manglik: { type: String, required: true },
});

const additionalDetailsSchema = mongoose.Schema({
  height: { type: Number, required: true },
  weight: { type: Number, required: true },
  email: { type: String, required: true },
  contact: { type: Number, required: true },
  personalAppearance: { type: String, required: false },
  currentlyLivingInCountry: {type: Number, required: true},
  currentlyLivingInState: {type: Number, required: true},
  currentlyLivingInCity: {type: Number, required: true},
  countryCode: {},
  relocationInFuture: {},
  diet: {},
  alcohol: {},
  smoking: {},
  maritalStatus: {},
});

const careerDetailsSchema = mongoose.Schema({
  highestEducation: {},
  "school/university": {},
  passingYear: {},
  profession: {},
  currentDesignation: {},
  previousOccupation: {},
  annualIncomeValue: {},
});

const familyDetailsSchema = mongoose.Schema({
  fatherName: {},
  fatherOccupation: {},
  motherName: {},
  motherOccupation: {},
  siblings: {},
  withFamilyStatus: {},
  familyLocationCountry: { type: Number, required: true },
  familyLocationState: { type: Number, required: true },
  familyLocationCity: { type: Number, required: true },
  religion: {},
  caste: {},
  familyAnnualIncome: {},
});

const selfDescriptionSchema = mongoose.Schema({
  interests: {},
  profilePicture: { type: String, required: true },
  userPhotos: [],
  userPhotosUrl : [],
  aboutYourself: {},
});

const preferenceSchema = mongoose.Schema({
  ageRange: {},
  heightRange: {},
  maritalStatus: {},
  community: {},
  caste: {},
  Country: {},
  State: {},
  City: {},
  education: {},
  workingpreference: {},
  annualIncomeRange: {},
  dietType: {},
});

const createdBySchema = mongoose.Schema({
  createdFor: {
    type: String,
    enum: ["myself", "mydaughter", "myson", "myrelative", "myfriend"],
  },
  name: {
    type: String,
    required: function () {
      return this.createdFor !== "myself";
    },
  },
  phone: { type: String, required: true },
  gender: {enum : ["F", "M"]},
});

const userSchema = mongoose.Schema(
  {
    createdBy: [createdBySchema],
    basicDetails: [basicDetailsSchema],
    additionalDetails: [additionalDetailsSchema],
    carrierDetails: [careerDetailsSchema],
    familyDetails: [familyDetailsSchema],
    selfDetails: [selfDescriptionSchema],
    partnerPreference: [preferenceSchema],
    gender : {}
  },
  { timestamps: true }
);

// Pre-save middleware to update userSchema's gender when createdBy's gender is added
createdBySchema.pre("save", function (next) {
  if (this.gender && this.gender !== this.parent().gender) {
    this.parent().gender = this.gender;
  }
  next();
});

const User = mongoose.model("User", userSchema);
module.exports = User;