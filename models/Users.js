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
  userId: { type: String, unique: true, required : true, default : "" },
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
  maritalStatus: { type: String, default: "", required: true },
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
  currencyType: { type: String, default: "", required: false },
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
  familyAnnualIncomeStart: { type: Number, required: false },
  familyAnnualIncomeEnd: { type: Number, required: false },
});

const selfDescriptionSchema = mongoose.Schema({
  interests: { type: String, default : "" },
  fun: { type: String, default : "" },
  fitness: { type: String, default : "" },
  other: { type: String, default : "" },
  profilePicture: { type: String, default : "", required: false },
  userPhotos: [{ type: String, default : "" }],
  userPhotosUrl: [{ type: String, default : "" }],
  profilePictureUrl: { type: String, default : "" },
  aboutYourself: { type: String, default : "" },
});

const preferenceSchema = mongoose.Schema({
  ageRangeStart: { type: Number, default: 0, required: false },
  ageRangeEnd: { type: Number, default: 0, required: false },
  heightRangeStart: { type: Number, default: 0, required: false },
  heightRangeEnd: { type: Number, default: 0, required: false },
  maritalStatus: { type: String, default: "", required: false },
  community: { type: Number, default: 0, required: false },
  caste: { type: Number, default: 0, required: false },
  country: { type: Number, default: 0, required: false },
  state: { type: Number, default: 0, required: false },
  city: { type: Number, default: 0, required: false },
  education: { type: String, default: "", required: false },
  workingpreference: { type: String, default: "", required: false },
  annualIncomeRangeStart: { type: Number, default: 0, required: false },
  annualIncomeRangeEnd: { type: Number, default: 0, required: false },
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
    careerDetails: [careerDetailsSchema],
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

userSchema.pre("save", function (next) {
  // Check if userId exists in basicDetailsSchema
  const userIdExists = this.basicDetails && this.basicDetails[0] && this.basicDetails[0].userId;
  // If userId exists in basicDetailsSchema, include userId field in userSchema
  if (userIdExists) {
    this.userId = { type: String, default: "", required : true, unique : true };
    this.userId = userIdExists;
  }
  next();
});

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
