const mongoose = require("mongoose");

const basicDetailsSchema = mongoose.Schema({
  name: { type: String, required: false },
  gender: { type: String, required: false },
  placeOfBirthCountry: { type: Number, required: false },
  placeOfBirthState: { type: Number, required: false },
  placeOfBirthCity: { type: Number, required: false },
  dateOfBirth: { type: String, required: false },
  timeOfBirth: { type: String, required: false },
  age: { type: String, required: false },
  manglik: { type: String, required: false },
  horoscope: { type: String, required: false },
});

basicDetailsSchema.pre("save", function (next) {
  if (this.createdBy && this.createdBy.length > 0) {
    this.gender = this.createdBy[0].gender;
  }
  next();
});

const additionalDetailsSchema = mongoose.Schema({
  height: { type: Number, required: false },
  weight: { type: String, required: false }, // Changed to String type
  email: { type: String, required: false },
  contact: { type: String, required: false }, // Changed to String type
  personalAppearance: { type: String, required: false },
  currentlyLivingInCountry: { type: Number, required: false },
  currentlyLivingInState: { type: Number, required: false },
  currentlyLivingInCity: { type: Number, required: false },
  countryCode: { type: String, default: "" },
  relocationInFuture: { type: String, default: "", required: false },
  diet: { type: String, default: "", required: false },
  alcohol: { type: String, default: "", required: false },
  smoking: { type: String, default: "", required: false },
  maritalStatus: { type: String, default: "", required: false },
});

const careerDetailsSchema = mongoose.Schema({
  highestEducation: { type: String, default: "", required: false },
  highestQualification: { type: String, default: "", required: false },
  "school/university": { type: String, default: "", required: false },
  passingYear: { type: String, default: "", required: false },
  profession: { type: String, default: "", required: false },
  currentDesignation: { type: String, default: "", required: false },
  previousOccupation: { type: String, default: "", required: false },
  annualIncomeValue: { type: String, default: "", required: false },
});

const familyDetailsSchema = mongoose.Schema({
  fatherName: { type: String, default: "", required: false },
  fatherOccupation: { type: String, default: "", required: false },
  motherName: { type: String, default: "", required: false },
  motherOccupation: { type: String, default: "", required: false },
  siblings: { type: String, default: "", required: false },
  withFamilyStatus: { type: String, default: "", required: false },
  familyLocationCountry: { type: Number, required: false },
  familyLocationState: { type: Number, required: false },
  familyLocationCity: { type: Number, required: false },
  religion: { type: String, default: "", required: false },
  caste: { type: String, default: "", required: false },
  community: { type: String, default: "", required: false },
  familyAnnualIncome: { type: String, default: "", required: false },
});

const selfDescriptionSchema = mongoose.Schema({
  interests: { type: String },
  fun: { type: String },
  fitness: { type: String },
  other: { type: String },
  profilePicture: { type: String, required: false },
  userPhotos: [{ type: String }],
  userPhotosUrl: [{ type: String }],
  profilePictureUrl: { type: String },
  aboutYourself: { type: String },
});

const preferenceSchema = mongoose.Schema({
  ageRange: { type: String, default: "", required: false },
  heightRange: { type: String, default: "", required: false },
  maritalStatus: { type: String, default: "", required: false },
  community: { type: String, default: "", required: false },
  caste: { type: String, default: "", required: false },
  Country: { type: String, default: "", required: false },
  State: { type: String, default: "", required: false },
  City: { type: String, default: "", required: false },
  education: { type: String, default: "", required: false },
  workingpreference: { type: String, default: "", required: false },
  annualIncomeRange: { type: String, default: "", required: false },
  dietType: { type: String, default: "", required: false },
});

const createdBySchema = mongoose.Schema({
  createdFor: {
    type: String,
    enum: ["myself", "myson", "mydaughter", "mybrother", "mysister", "myfriend", "myrelative"],
  },
  name: {
    type: String,
    required: function () {
      return this.createdFor !== "myself";
    },
  },
  phone: { type: String, required: false }, // Changed to String type
  gender: { type: String, enum: ["F", "M"] },
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
    gender: { type: String },
    regiaterationPhase: {
      type: String,
      enum: ["registering", "notApproved", "Approved"],
    },
    registerationPage: {
      type: String,
      enum: ["", "1", "2", "3", "4", "5", "6"],
    },
    annualIncomeType: { type: String },
  },
  { timestamps: false }
);

const User = mongoose.model("User", userSchema);
module.exports = User;
