const pdf = require('html-pdf');
const fs = require('fs');
const path = require('path');

exports.generateUserPDFForAdmin = async (user) => {
  const templatePath = path.resolve(__dirname, 'userTemplate.html');
  let html = fs.readFileSync(templatePath, 'utf8');

  
  // Replace placeholders with actual user data
  html = html.replace('{{name}}', user.basicDetails.name || 'N/A')
             .replace('{{name1}}', user.basicDetails.name || 'N/A')
             .replace('{{gender}}', user.basicDetails.gender || 'N/A')
             .replace('{{userId}}', user.userId || 'N/A')
             .replace('{{dateofBirth0}}', user.basicDetails.dateofBirth || 'N/A')
             .replace('{{dateofBirth}}', user.basicDetails.dateofBirth || 'N/A')
             .replace('{{timeofBirth0}}', user.basicDetails.timeofBirth || 'N/A')
             .replace('{{timeofBirth}}', user.basicDetails.timeofBirth || 'N/A')
             .replace('{{age0}}', user.basicDetails.age || 'N/A')
             .replace('{{age}}', user.basicDetails.age || 'N/A')
             .replace('{{palceofBirthCity}}', user.basicDetails.citybtype || 'N/A')
             .replace('{{palceofBirthState}}', user.basicDetails.statebtype || 'N/A')
             .replace('{{palceofBirthCountry}}', user.basicDetails.countrybtype || 'N/A')
             .replace('{{height0}}', user.additionalDetails.height || 'N/A')
             .replace('{{height}}', user.additionalDetails.height || 'N/A')
             .replace('{{weight}}', user.additionalDetails.weight || 'N/A')
             .replace('{{email}}', user.additionalDetails.email || 'N/A')
             .replace('{{contact}}', user.additionalDetails.contact || 'N/A')
             .replace('{{personalAppearance}}', user.additionalDetails.personalAppearance || 'N/A')
             .replace('{{currentlyLivingInCountry}}', user.additionalDetails.countryatype || 'N/A')
             .replace('{{currentlyLivingInState}}', user.additionalDetails.stateatype || 'N/A')
             .replace('{{currentlyLivingInCity}}', user.additionalDetails.cityatype || 'N/A')
             .replace('{{currentlyLivingInState1}}', user.additionalDetails.stateatype || 'N/A')
             .replace('{{currentlyLivingInCity1}}', user.additionalDetails.cityatype || 'N/A')
             .replace('{{countryCode}}', user.additionalDetails.countryCode || 'N/A')
             .replace('{{relocationInFuture}}', user.additionalDetails.relocationInFuture || 'N/A')
             .replace('{{diet0}}', user.additionalDetails.dietatype || 'N/A')
             .replace('{{diet}}', user.additionalDetails.dietatype || 'N/A')
             .replace('{{alcohol}}', user.additionalDetails.alcohol || 'N/A')
             .replace('{{smoking}}', user.additionalDetails.smoking || 'N/A')
             .replace('{{maritalStatus0}}', user.additionalDetails.maritalStatus || 'N/A')
             .replace('{{maritalStatus}}', user.additionalDetails.maritalStatus || 'N/A')
             .replace('{{educationName}}', user.careerDetails.educationctype || 'N/A')
             .replace('{{highestQualification}}', user.careerDetails.highestQualification || 'N/A')
             .replace('{{profession0}}', user.careerDetails.professionctype || 'N/A')
             .replace('{{profession}}', user.careerDetails.professionctype || 'N/A')
             .replace('{{currentDesignation}}', user.careerDetails.currentDesignation || 'N/A')
             .replace('{{previousOccupation}}', user.careerDetails.previousOccupation || 'N/A')
             .replace('{{university}}', user.careerDetails["school/university"] || 'N/A')
             .replace('{{annualIncomeValue}}', user.careerDetails.annualIncomeUSD || 'N/A')
             .replace('{{fatherName}}', user.familyDetails.fatherName || 'N/A')
             .replace('{{fatherOccupation}}', user.familyDetails.fatherOccupation || 'N/A')
             .replace('{{motherName}}', user.familyDetails.motherName || 'N/A')
             .replace('{{motherOccupation}}', user.familyDetails.motherOccupation || 'N/A')
             .replace('{{withFamilyStatus}}', user.familyDetails.withFamilyStatus || 'N/A')
             .replace('{{familyLocationCountry}}', user.familyDetails.countryftype || 'N/A')
             .replace('{{familyLocationState}}', user.familyDetails.stateftype || 'N/A')
             .replace('{{familyLocationCity}}', user.familyDetails.cityftype || 'N/A')
             .replace('{{religion}}', "Hinduism")
             .replace('{{community0}}', user.familyDetails.communityftype || 'N/A')
             .replace('{{community}}', user.familyDetails.communityftype || 'N/A')
             .replace('{{familyAnnualIncomeStart}}', user.familyDetails.familyAnnualIncomeStart || 'N/A')
             .replace('{{profilePictureUrl0}}', user.selfDetails.profilePictureUrl || '')
             .replace('{{aboutYourself}}', user.selfDetails.aboutYourself || '')
             .replace('{{interestsTypes}}', user.selfDetails.interestsTypes || 'N/A')
             .replace('{{funActivitiesTypes}}', user.selfDetails.funActivitiesTypes || 'N/A')
             .replace('{{fitnessTypes}}', user.selfDetails.fitnessTypes || 'N/A')
             .replace('{{otherTypes}}', user.selfDetails.otherTypes || 'N/A');
  // Dynamically generate the photo HTML
  let photoHtml = '';
  let siblingHtml = "";
  user.selfDetails.userPhotosUrl.forEach((url, index) => {
    if(url !== null){
        photoHtml += `<img src="${url}" alt="Photo ${index + 1}" class="profile-pic">`;
    }
  });
  user.familyDetails.users.forEach((data, index) => {
    siblingHtml += `<p>${data.gender} ${data.option}</p>`;
  });
  html = html.replace('{{photoGrid}}', photoHtml);
  html = html.replace('{{siblingGrid}}', siblingHtml);
  return new Promise((resolve, reject) => {
    pdf.create(html, {}).toBuffer((err, buffer) => {
      if (err) {
        reject(err);
      } else {
        resolve(buffer);
      }
    });
  });
};
