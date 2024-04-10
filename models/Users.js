const mongoose = require("mongoose");
const moment = require('moment');

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
  userId: { type: String, unique: true },
});

basicDetailsSchema.pre("save", function (next) {
  if (this.basicDetails && this.basicDetails.length > 0) {
    this.gender = this.createdBy[0].gender;
    const genderPrefix = this.gender; // Assuming 'M' for Male and 'F' for Female
    const namePrefix = this.basicDetails[0].name?.slice(0, 3).toUpperCase();
    const dob = moment(this.basicDetails[0].dateOfBirth, "YYYY-MM-DD");
    const dobFormatted = dob.format("YYYYMMDD");
    const timeOfBirth = this.basicDetails[0].timeOfBirth.replace(":", "");
    const loginTime = moment().format("HHmmss");

    this.userId = `${genderPrefix}${namePrefix}${dobFormatted}${timeOfBirth}${loginTime}`;
  }
  next();
});

const additionalDetailsSchema = mongoose.Schema({
  height: { type: Number, required: false },
  weight: { type: String, required: false },
  email: { type: String, required: false },
  contact: { type: String, required: false },
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
    enum: [
      "myself",
      "myson",
      "mydaughter",
      "mybrother",
      "mysister",
      "myfriend",
      "myrelative",
    ],
  },
  name: {
    type: String,
    required: function () {
      return this.createdFor !== "myself";
    },
  },
  phone: { type: String, required: false },
  gender: { type: String, enum: ["F", "M"] },
});

// Define indexes directly in the schema
const userSchema = mongoose.Schema(
  {
    userId: { type: String, default: "" },
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

userSchema.pre("save", () => {});

// Define indexes directly in the schema
userSchema.index({ "basicDetails.age": 1 });
userSchema.index({ "additionalDetails.height": 1 });
userSchema.index({ "carrierDetails.annualIncomeValue": 1 });
userSchema.index({ "additionalDetails.maritalStatus": 1 });
userSchema.index({ "familyDetails.community": 1 });
userSchema.index({ "familyDetails.caste": 1 });
userSchema.index({ "additionalDetails.currentlyLivingInCountry": 1 });
userSchema.index({ "additionalDetails.currentlyLivingInState": 1 });
userSchema.index({ "additionalDetails.currentlyLivingInCity": 1 });
userSchema.index({ "carrierDetails.highestEducation": 1 });
userSchema.index({ "carrierDetails.profession": 1 });
userSchema.index({ "additionalDetails.diet": 1 });

const User = mongoose.model("User", userSchema);
module.exports = User;
