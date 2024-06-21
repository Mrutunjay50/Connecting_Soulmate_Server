const dotenv = require("dotenv");
const SibApiV3Sdk = require("@getbrevo/brevo");

dotenv.config();

const BREVO_API = process.env.BREVO_API_KEY;
const EMAIL_FROM = process.env.DOMAIN_EMAIL;
const senderName = process.env.SENDER_IDENTITY;

let apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();

let apiKey = apiInstance.authentications["apiKey"];
apiKey.apiKey = BREVO_API;

const sendEmail = async ({ to, subject, htmlContent, restrict }) => {
  try {
    let sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
    sendSmtpEmail.subject = subject;
    sendSmtpEmail.htmlContent = htmlContent;
    sendSmtpEmail.sender = { name: senderName, email: EMAIL_FROM };
    let recieversEmail;
    if(restrict){
        recieversEmail = "gauravsrivastava0451@gmail.com";// Send email to user's email address
    }else{
        recieversEmail = to;
    }

    sendSmtpEmail.to = [{ email: recieversEmail }];
    await apiInstance.sendTransacEmail(sendSmtpEmail);
    // const data = await apiInstance.sendTransacEmail(sendSmtpEmail);
    // console.log("Email sent successfully:", data);
    // return data;
  } catch (error) {
    console.error("Error sending email:", error);
    throw error; // Propagate the error up to the caller
  }
};

module.exports = { sendEmail };
