const mongoose = require("mongoose");

const basicDetailsSchema = mongoose.Schema({
  name: { type: String, required: true, default : "" },
  gender: { type: String, required: false, default : "" },
  placeOfBirthCountry: { type: Number, required: false, default : 0 },
  placeOfBirthState: { type: Number, required: false, default : 0 },
  placeOfBirthCity: { type: Number, required: false, default : 0 },
  dateOfBirth: { type: String, required: true, default : "" },
  timeOfBirth: { type: String, required: false, default : "" },
  age: { type: String, required: false, default : "" },
  manglik: { type: String, required: false, default : "" },
  horoscope: { type: String, required: false, default : "" },
  userId: { type: String, required: false, default : "" },
});

const additionalDetailsSchema = mongoose.Schema({
  height: { type: Number, default: "", required: false },
  weight: { type: String, default: "", required: false },
  email: { type: String, default: "", required: false },
  contact: { type: String, default: "", required: false },
  personalAppearance: { type: String, default: "", required: false },
  currentlyLivingInCountry: { type: Number, required: false, default : 0 },
  currentlyLivingInState: { type: Number, required: false, default : 0 },
  currentlyLivingInCity: { type: Number, required: false, default : 0 },
  countryCode: { type: String, default: "", required: false  },
  relocationInFuture: { type: String, default: "", required: false },
  diet: { type: Number, default: "", required: false },
  alcohol: { type: String, default: "", required: false },
  smoking: { type: String, default: "", required: false },
  maritalStatus: { type: String, default: "", required: false },
});

const careerDetailsSchema = mongoose.Schema({
  highestEducation: { type: Number, default: 0, required: false },
  highestQualification: { type: String, default: "", required: false },
  "school/university": { type: String, default: "", required: false },
  passingYear: { type: String, default: "", required: false },
  profession: { type: Number, default: 0, required: false },
  currentDesignation: { type: String, default: "", required: false },
  previousOccupation: { type: String, default: "", required: false },
  annualIncomeUSD : { type: String, default: "0", required: false },
  annualIncomeValue: { type: String, default: "0", required: false },
  currencyType: { type: String, default: "", required: true },
});

const familyDetailsSchema = mongoose.Schema({
  fatherName: { type: String, default: "", required: false },
  fatherOccupation: { type: String, default: "", required: false },
  motherName: { type: String, default: "", required: false },
  motherOccupation: { type: String, default: "", required: false },
  withFamilyStatus: { type: String, default: "", required: false },
  familyLocationCountry: { type: Number, default: 0, required: false },
  familyLocationState: { type: Number, default: 0, required: false },
  familyLocationCity: { type: Number, default: 0, required: false },
  religion: { type: Number, default: 0, required: false },
  caste: { type: String, default: "", required: false },
  community: { type: Number, default: 0, required: false },
  familyAnnualIncomeStart: { type: Number, default: 0, required: false },
  familyAnnualIncomeEnd: { type: Number, default: 0, required: false },
  users: [{
    gender: { type: String, required: false, default : "" },
    option: { type: String, required: false, default : "" }
  }],
});

const selfDescriptionSchema = mongoose.Schema({
  interests: { type: String, default: "", required: false  },
  fun: { type: String, default: "", required: false  },
  fitness: { type: String, default: "", required: false  },
  other: { type: String, default: "", required: false  },
  profilePicture: { type: String, default: "", required: false },
  userPhotos: [{ type: String, default: "", required: false  }],
  userPhotosUrl: [{ type: String, default: "", required: false  }],
  profilePictureUrl: { type: String, default: "", required: false  },
  aboutYourself: { type: String, default: "", required: false  },
});

const preferenceSchema = mongoose.Schema({
  ageRangeStart: { type: Number, default: 0, required: false },
  ageRangeEnd: { type: Number, default: 0, required: false },
  heightRangeStart: { type: Number, default: 0, required: false },
  heightRangeEnd: { type: Number, default: 0, required: false },
  maritalStatus: { type: String, default: "", required: false },
  community: { type: String, default: "", required: false },
  caste: { type: Number, default: 0, required: false },
  country: { type: String, default: "", required: false },
  state: { type: String, default: "", required: false },
  city: { type: String, default: "", required: false },
  education: { type: String, default: "", required: false },
  profession: { type: String, default: "", required: false },
  annualIncomeRangeStart: { type: Number, default: 0, required: false },
  annualIncomeRangeEnd: { type: Number, default: 0, required: false },
  dietType: { type: String, default: "", required: false },
});

const createdBySchema = mongoose.Schema({
  createdFor: {
    type: String,
    required: true,
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
  // countryCode : { type: String, required: false },
  phone: { type: String, required: true, unique: true },
  gender: { type: String, required: true, enum: ["F", "M"] },
});

// Define indexes directly in the schema
const userSchema = mongoose.Schema(
  {
    createdBy: [createdBySchema],
    basicDetails: [basicDetailsSchema],
    userId: {
      type: String,
      required: function () {
        return this.basicDetails && this.basicDetails.length > 0;
      },
    },
    additionalDetails: [additionalDetailsSchema],
    careerDetails: [careerDetailsSchema],
    familyDetails: [familyDetailsSchema],
    selfDetails: [selfDescriptionSchema],
    partnerPreference: [preferenceSchema],
    gender: { type: String, enum:["F", "M"] },
    isDeleted: {
      type: Boolean,
      enum: [true, false],
      default: false,
    },
    deletedStatus : {
      type: String,
      default: "", 
      required: false
    },
    deleteReason: {
      type: String,
      default: "",
    },
    isEmailSubscribed: {
      type: Boolean,
      enum: [true, false],
      default: false,
    },
    isBlocked: {
      type: Boolean,
      enum: [true, false],
      default: false,
    },
    isShortListed: {
      type: Boolean,
      enum: [true, false],
      default: false,
    },
    isInterestRequest: {
      type: Boolean,
      enum: [true, false],
      default: false,
    },
    isProfileRequest: {
      type: Boolean,
      enum: [true, false],
      default: false,
    },
    registrationPhase: {
      type: String,
      enum: ["registering", "notapproved", "approved", "rejected", "deleted"],
      default : "registering"
    },
    lastLogin : {
      type: Date,
      default : new Date().toISOString()
    },
    reviewReason : {
      type: String,
      default: "", 
      required: false
    },
    registrationPage: {
      type: String,
      enum: ["", "1", "2", "3", "4", "5", "6"],
      default : ""
    },
    category: {
      type: String,
      enum: ["", "A", "B", "C", "A,B", "B,A", "A,C", "C,A", "B,C", "C,B", "A,B,C", "A,C,B", "B,A,C", "B,C,A", "C,A,B", "C,B,A"],
      default : ""
    },
    annualIncomeType: { type: String },
    accessType : { type: String, required: false, enum :["0", "1", "2"], default : "2"}
  },
  { timestamps: true }
);


// Define indexes directly in the schema
// userSchema.index({ "userId": 1 });
// userSchema.index({ "carrierDetails.annualIncomeValue": 1 });
// userSchema.index({ "additionalDetails.maritalStatus": 1 });
// userSchema.index({ "familyDetails.community": 1 });
// userSchema.index({ "familyDetails.caste": 1 });
// userSchema.index({ "carrierDetails.highestEducation": 1 });
// userSchema.index({ "gender": 1 });
// userSchema.index({ "basicDetails.dateOfBirth": 1 });
// userSchema.index({ "additionalDetails.currentlyLivingInCountry": 1 });
// userSchema.index({ "additionalDetails.currentlyLivingInState": 1 });
// userSchema.index({ "additionalDetails.currentlyLivingInCity": 1 });
// userSchema.index({ "basicDetails.age": 1 });
// userSchema.index({ "basicDetails.gender": 1 });
// userSchema.index({ "additionalDetails.height": 1 });
// userSchema.index({ "careerDetails.profession": 1 });
// userSchema.index({ "careerDetails.currentDesignation": 1 });
// userSchema.index({ "additionalDetails.diet": 1 });

const User = mongoose.model("User", userSchema);
module.exports = User;
