const pdf = require('html-pdf');
const fs = require('fs');
const path = require('path');

exports.generateUserPDFForAdmin = async (user) => {
  const templatePath = path.resolve(__dirname, 'userTemplate.html');
  let html = fs.readFileSync(templatePath, 'utf8');

  // Replace placeholders with actual user data
  html = html.replace('{{name}}', user.basicDetails.name || 'N/A')
             .replace('{{email}}', user.basicDetails.email || 'N/A')
             .replace('{{profilePictureUrl}}', user.selfDetails.profilePictureUrl || '')
             .replace('{{interestsTypes}}', user.selfDetails.interestsTypes || 'N/A')
             .replace('{{funActivitiesTypes}}', user.selfDetails.funActivitiesTypes || 'N/A')
             .replace('{{fitnessTypes}}', user.selfDetails.fitnessTypes || 'N/A')
             .replace('{{otherTypes}}', user.selfDetails.otherTypes || 'N/A');

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
