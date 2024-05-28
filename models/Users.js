const mongoose = require("mongoose");

const basicDetailsSchema = mongoose.Schema({
  name: { type: String, required: true },
  gender: { type: String, required: false },
  placeOfBirthCountry: { type: Number, required: false },
  placeOfBirthState: { type: Number, required: false },
  placeOfBirthCity: { type: Number, required: false },
  dateOfBirth: { type: String, required: true },
  timeOfBirth: { type: String, required: false },
  age: { type: String, required: false },
  manglik: { type: String, required: false },
  horoscope: { type: String, required: false, default : "" },
  userId: { type: String, required: true },
});

const additionalDetailsSchema = mongoose.Schema({
  height: { type: Number, default: "", required: false },
  weight: { type: String, default: "", required: false },
  email: { type: String, default: "", required: false },
  contact: { type: String, default: "", required: false },
  personalAppearance: { type: String, default: "", required: false },
  currentlyLivingInCountry: { type: Number, required: false },
  currentlyLivingInState: { type: Number, required: false },
  currentlyLivingInCity: { type: Number, required: false },
  countryCode: { type: String, default: "", required: false  },
  relocationInFuture: { type: String, default: "", required: false },
  diet: { type: Number, default: "", required: false },
  alcohol: { type: String, default: "", required: false },
  smoking: { type: String, default: "", required: false },
  maritalStatus: { type: String, default: "", required: false },
});

const careerDetailsSchema = mongoose.Schema({
  highestEducation: { type: Number, default: "", required: false },
  highestQualification: { type: String, default: "", required: false },
  "school/university": { type: String, default: "", required: false },
  passingYear: { type: String, default: "", required: false },
  profession: { type: Number, default: "", required: false },
  currentDesignation: { type: String, default: "", required: false },
  previousOccupation: { type: String, default: "", required: false },
  annualIncomeUSD : { type: String, default: "", required: false },
  annualIncomeValue: { type: String, default: "", required: false },
  currencyType: { type: String, default: "", required: true },
});

const familyDetailsSchema = mongoose.Schema({
  fatherName: { type: String, default: "", required: false },
  fatherOccupation: { type: String, default: "", required: false },
  motherName: { type: String, default: "", required: false },
  motherOccupation: { type: String, default: "", required: false },
  withFamilyStatus: { type: String, default: "", required: false },
  familyLocationCountry: { type: Number, required: false },
  familyLocationState: { type: Number, required: false },
  familyLocationCity: { type: Number, required: false },
  religion: { type: Number, default: "", required: false },
  caste: { type: String, default: "", required: false },
  community: { type: Number, default: "", required: false },
  familyAnnualIncomeStart: { type: Number, required: false },
  familyAnnualIncomeEnd: { type: Number, required: false },
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
  community: { type: String, default: 0, required: false },
  caste: { type: Number, default: 0, required: false },
  country: { type: String, default: 0, required: false },
  state: { type: String, default: 0, required: false },
  city: { type: String, default: 0, required: false },
  education: { type: String, default: "", required: false },
  profession: { type: String, default: 0, required: false },
  annualIncomeRangeStart: { type: Number, default: 0, required: false },
  annualIncomeRangeEnd: { type: Number, default: 0, required: false },
  dietType: { type: String, default: 0, required: false },
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
    basicDetails: {
      type: [basicDetailsSchema],
      validate: {
        validator: function (v) {
          return v.length > 0;
        },
        message: "basicDetails cannot be empty.",
      },
    },
    userId: {
      type: String,
      unique: true,
      required: function () {
        return this.basicDetails && this.basicDetails.length > 0;
      },
    },
    additionalDetails: [additionalDetailsSchema],
    careerDetails: [careerDetailsSchema],
    familyDetails: [familyDetailsSchema],
    selfDetails: [selfDescriptionSchema],
    partnerPreference: [preferenceSchema],
    gender: { type: String },
    isDeleted : {
      type: String,
      enum: [true, false],
      default : false
    },
    deleteReason : {
      type: String,
      default : ""
    },
    isEmailSubscribed : {
      type: String,
      enum: [true, false],
      default : false
    },
    isBlocked : {
      type: String,
      enum: [true, false],
      default : false
    },
    isShortListed : {
      type: String,
      enum: [true, false],
      default : false
    },
    isInterestRequest : {
      type: String,
      enum: [true, false],
      default : false
    },
    isProfileRequest : {
      type: String,
      enum: [true, false],
      default : false
    },
    registrationPhase: {
      type: String,
      enum: ["registering", "notapproved", "approved", "rejected"],
      default : "registering"
    },
    lastLogin : {
      type: Date,
      default : new Date().toISOString()
    },
    registrationPage: {
      type: String,
      enum: ["", "1", "2", "3", "4", "5", "6"],
      default : ""
    },
    category: {
      type: String,
      enum: ["", "A", "B", "C", "A,B", "A,C", "B,C", "A,B,C"],
      default : ""
    },
    annualIncomeType: { type: String },
    accessType : { type: String, required: false, enum :["0", "1", "2"], default : "2"}
  },
  { timestamps: true }
);


// Define indexes directly in the schema
userSchema.index({ "carrierDetails.annualIncomeValue": 1 });
userSchema.index({ "additionalDetails.maritalStatus": 1 });
userSchema.index({ "familyDetails.community": 1 });
userSchema.index({ "familyDetails.caste": 1 });
userSchema.index({ "carrierDetails.highestEducation": 1 });
userSchema.index({ gender: 1 });
userSchema.index({ "basicDetails.userId": 1 });
userSchema.index({ "basicDetails.dateOfBirth": 1 });
userSchema.index({ "additionalDetails.currentlyLivingInCountry": 1 });
userSchema.index({ "additionalDetails.currentlyLivingInState": 1 });
userSchema.index({ "additionalDetails.currentlyLivingInCity": 1 });
userSchema.index({ "basicDetails.age": 1 });
userSchema.index({ "basicDetails.gender": 1 });
userSchema.index({ "additionalDetails.height": 1 });
userSchema.index({ "careerDetails.profession": 1 });
userSchema.index({ "careerDetails.currentDesignation": 1 });
userSchema.index({ "additionalDetails.diet": 1 });

const User = mongoose.model("User", userSchema);
module.exports = User;
