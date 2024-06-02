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




// const puppeteer = require('puppeteer');
// const ejs = require('ejs');
// const path = require('path');
// const { promisify } = require('util');

// const fs = require('fs');
// // const pdfMake = require('pdfmake');
// const PDFDocument = require('pdfkit');

// async function generatePdfFromHtml(htmlContent) {
//   try {
//     const fonts = {
//       Roboto: {
//         normal: path.join(__dirname, '..', 'templates', 'fonts', 'Roboto-Regular.ttf'),
//         bold: path.join(__dirname, '..', 'templates', 'fonts', 'Roboto-Bold.ttf'),
//         italics: path.join(__dirname, '..', 'templates', 'fonts', 'Roboto-Italic.ttf'),
//         bolditalics: path.join(__dirname, '..', 'templates', 'fonts', 'Roboto-BoldItalic.ttf')
//       }
//     };

//     const printer = new pdfMake(fonts);

//     const docDefinition = {
//       content: [
//         { text: 'Dynamic HTML to PDF', style: 'header' },
//         { text: htmlContent, style: 'body' }
//       ],
//       styles: {
//         header: { fontSize: 18, bold: true },
//         body: { fontSize: 12 }
//       }
//     };

//     const pdfDoc = printer.createPdfKitDocument(docDefinition);

//     const buffers = [];
//     pdfDoc.on('data', buffer => buffers.push(buffer));
//     pdfDoc.on('end', () => {
//       const pdfBuffer = Buffer.concat(buffers);
//       fs.writeFileSync('output.pdf', pdfBuffer);
//     });

//     pdfDoc.end();
//   } catch (error) {
//     console.error('Error generating PDF:', error);
//     throw new Error('Error generating PDF');
//   }
// }
// async function generatePdfFromHtml(htmlContent) {
//   try {
//     const pdfDoc = new PDFDocument();
//     const buffers = [];

//     pdfDoc.on('data', buffer => buffers.push(buffer));
//     pdfDoc.on('end', () => {
//       const pdfBuffer = Buffer.concat(buffers);
//       // Optionally, you can write the PDF to a file
//       fs.writeFileSync('output.pdf', pdfBuffer);
//     });

//     // Pipe the HTML content to the PDF document
//     pdfDoc.text(htmlContent);
//     pdfDoc.end();

//     return new Promise((resolve, reject) => {
//       pdfDoc.on('end', () => {
//         const pdfBuffer = Buffer.concat(buffers);
//         resolve(pdfBuffer);
//       });
//       pdfDoc.on('error', (err) => {
//         reject(err);
//       });
//     });
//   } catch (error) {
//     console.error('Error generating PDF:', error);
//     throw new Error('Error generating PDF');
//   }
// }
// exports.generateUserPDFForAdmin = async (user) => {
//   try {

//     let userData = mapSchemaToUserData(user);
//     console.log(userData);
//     const htmlContent = await promisify(ejs.renderFile)(
//       path.join(__dirname, '..','templates', 'userTemplate.ejs'),
//       userData
//     );
//     const pdfBuffer = await generatePdfFromHtml(htmlContent);

//     // console.log("gotOut1", htmlContent);

//     // const browser = await puppeteer.launch({
//     //   timeout: 0 // Setting timeout to 0 means no timeout
//     // });
//     // console.log("gotOut2", browser);
//     // const page = await browser.newPage();
//     // console.log("gotOut3");
//     // await page.setContent(htmlContent, { waitUntil: 'domcontentloaded' });
//     // console.log("gotOut4", page);
//     // const pdfBuffer = await page.pdf({path : 'output.pdf', format : 'A4'});
//     // console.log("gotOut5");
    
//     // console.log(pdfBuffer);
//     // console.log("gotOut6");
//     // await browser.close();
//     // console.log("gotOut7");
//     return pdfBuffer;

//   } catch (error) {
//     console.error('Error generating PDF:', error);
//     throw new Error('Error generating PDF');
//   }
// };


const mapSchemaToUserData = (schemaData) => {
  const basicDetails = schemaData.basicDetails || {};
  const additionalDetails = schemaData.additionalDetails || {};
  const careerDetails = schemaData.careerDetails || {};
  const familyDetails = schemaData.familyDetails || {};
  const selfDetails = schemaData.selfDetails || {};

  const userData = {
    name: basicDetails.name || "",
    userId: schemaData.userId || "",
    profilePictureUrl: selfDetails.profilePictureUrl || "",
    age0: basicDetails.age || "",
    height0: additionalDetails.height ? additionalDetails.height.toString() : "",
    dateofBirth0: basicDetails.dateOfBirth || "",
    maritalStatus0: additionalDetails.maritalStatus || "",
    profession0: careerDetails.profession || "",
    currentlyLivingInCity: additionalDetails.currentlyLivingInCity || "",
    currentlyLivingInState: additionalDetails.currentlyLivingInState || "",
    religion: familyDetails.religion || "",
    timeofBirth0: basicDetails.timeOfBirth || "",
    diet0: additionalDetails.diet || "",
    community0: familyDetails.community || "",
    photoGrid: "", // Assuming this data is stored elsewhere or constructed dynamically
    aboutYourself: selfDetails.aboutYourself || "",
    personalAppearance: additionalDetails.personalAppearance || "",
    name1: basicDetails.name || "",
    gender: basicDetails.gender || "",
    dateofBirth: basicDetails.dateOfBirth || "",
    timeofBirth: basicDetails.timeOfBirth || "",
    age: basicDetails.age || "",
    palceofBirthCity: basicDetails.placeOfBirthCity || "",
    palceofBirthState: basicDetails.placeOfBirthState || "",
    palceofBirthCountry: basicDetails.placeOfBirthCountry || "",
    height: additionalDetails.height ? additionalDetails.height.toString() : "",
    weight: additionalDetails.weight || "",
    currentlyLivingInCountry: additionalDetails.currentlyLivingInCountry || "",
    currentlyLivingInState1: additionalDetails.currentlyLivingInState || "",
    currentlyLivingInCity1: additionalDetails.currentlyLivingInCity || "",
    relocationInFuture: additionalDetails.relocationInFuture || "",
    diet: additionalDetails.diet || "",
    alcohol: additionalDetails.alcohol || "",
    smoking: additionalDetails.smoking || "",
    maritalStatus: additionalDetails.maritalStatus || "",
    contact: additionalDetails.contact || "",
    email: additionalDetails.email || "",
    educationName: careerDetails.highestQualification || "",
    university: careerDetails["school/university"] || "",
    highestQualification: careerDetails.highestQualification || "",
    profession: careerDetails.profession || "",
    currentDesignation: careerDetails.currentDesignation || "",
    previousOccupation: careerDetails.previousOccupation || "",
    annualIncomeValue: careerDetails.annualIncomeValue || "",
    userPhotos : selfDetails.userPhotosUrl.filter(photoUrl => photoUrl !== null) || [],
    interestsTypes: selfDetails.interests || "",
    funActivitiesTypes: selfDetails.fun || "",
    fitnessTypes: selfDetails.fitness || "",
    otherTypes: selfDetails.other || "",
    fatherName: familyDetails.fatherName || "",
    fatherOccupation: familyDetails.fatherOccupation || "",
    motherName: familyDetails.motherName || "",
    motherOccupation: familyDetails.motherOccupation || "",
    siblingGrid: "", // Assuming this data is stored elsewhere or constructed dynamically
    withFamilyStatus: familyDetails.withFamilyStatus || "",
    familyLocationCountry: familyDetails.familyLocationCountry || "",
    familyLocationState: familyDetails.familyLocationState || "",
    familyLocationCity: familyDetails.familyLocationCity || "",
    community: familyDetails.community || "",
    familyAnnualIncomeStart: familyDetails.familyAnnualIncomeStart || ""
  };

  return userData;
};