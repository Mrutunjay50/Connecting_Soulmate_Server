// Email templates
const dotenv = require("dotenv");
const { sendEmail } = require("../../utils/emailUtils");

dotenv.config();

const DOMAIN = process.env.FRONTEND_URL;
const ADMIN_EMAIL = "work.connectingsoulmate@gmail.com";
const LOGO_URL = process.env.LOGO_IMAGE_URL;

// Function to send different types of emails
const sendUserEmail = async ({ to, subject, htmlContent }) => {
    const restrict = false;
    await sendEmail({to, subject, htmlContent, restrict});
  };
  
const getEmailTemplate = (type, issues = []) => {
    let template;
    switch (type) {
      case "approval":
        template = `
          <img src=${LOGO_URL} alt="Connecting Soulmate Logo">
          <p>Hello,</p>
          <p>Thank you for registering with Connecting Soulmate. Your profile has been approved by our admin.</p>
          <p>We will soon keep you posted on when you can start viewing other profiles.</p>
        `;
        break;
      case "approvalRequest":
        template = `
          <img src=${LOGO_URL} alt="Connecting Soulmate Logo">
          <p>Hello,</p>
          <p>Thank you for registering with Connecting Soulmate. We have Sent your profile for approval request.</p>
          <p>We usually take 3 - 5 days for verification. Once verified you will be able to access Your profile.</p>
        `;
        break;
      case "rejection":
        template = `
          <img src=${LOGO_URL} alt="Connecting Soulmate Logo">
          <p>We regret to inform you that your profile was rejected by our Admin.</p>
          <p>If you have any issues please connect with our admin at ${ADMIN_EMAIL}</p>
        `;
        break;
      case "review":
        const issuesList = issues.map((issue, index) => `<p>${index + 1}. ${issue}</p>`).join('');
        template = `
          <img src=${LOGO_URL} alt="Connecting Soulmate Logo">
          <p>Hello,</p>
          <p>Thank you for registering with Connecting Soulmate.</p>
          <p>While reviewing your profiles, we have found some issues enlisted below and hence your profile is kept under review.</p>
          ${issuesList}
          <p>If you face any issues please connect with our admin at ${ADMIN_EMAIL}</p>
        `;
        break;
      default:
        throw new Error("Invalid email type");
    }
    return template;
  };


  exports.sendApprovalEmail = async (userEmail) => {
    const subject = "Regarding Your Approval Request";
    const htmlContent = getEmailTemplate("approvalRequest");
  
    await sendUserEmail({ to: userEmail, subject, htmlContent });
  };


  exports.sendApprovalRequestToAdmin = async (adminEmail) => {
    const subject = "Request For Approval";
    const htmlContent = getEmailTemplate("approval");
  
    await sendUserEmail({ to: adminEmail, subject, htmlContent });
  };
  
  exports.sendRejectionEmail = async (userEmail) => {
    const subject = "Profile Rejection Notification";
    const htmlContent = getEmailTemplate("rejection");
  
    await sendUserEmail({ to: userEmail, subject, htmlContent });
  };
  
  exports.sendReviewEmail = async (userEmail, issues) => {
    const subject = "Profile Review Notification";
    const htmlContent = getEmailTemplate("review", issues);
  
    await sendUserEmail({ to: userEmail, subject, htmlContent });
  };