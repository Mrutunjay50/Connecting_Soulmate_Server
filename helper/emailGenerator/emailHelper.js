// Email templates
const dotenv = require("dotenv");
const { sendEmail } = require("../../utils/emailUtils");

dotenv.config();

// const DOMAIN = process.env.FRONTEND_URL;
const ADMIN_EMAIL = "work.connectingsoulmate@gmail.com";
const LOGO_URL = process.env.LOGO_IMAGE_URL;

// Function to send different types of emails
const sendUserEmail = async ({ to, subject, htmlContent }) => {
  const restrict = false;
  await sendEmail({ to, subject, htmlContent, restrict });
};

const getEmailTemplate = (type, issues = [], name, verificationLink, banReason) => {
  let template;
  let userName = name?.replace("undefined", "") || "user";
  const styles = `
    font-family: Arial, sans-serif;
    font-size: 16px;
    line-height: 1.5;
    color: #333;
    background-color: rgba(255, 255, 255, 0.7); /* Transparent with opacity 0.7 */
    margin: 5% 10%;
    padding : 10px 5px;
    text-align: left;
    display: inline-block;
  `;

  switch (type) {
    case "successfullyApproved":
      template = `
            <div style="text-align: center;">
                <div style="${styles}">
                    <img src="${LOGO_URL}" alt="Connecting Soulmate Logo" style="width: 85px; height: 85px; border-radius: 4px;">
                    <p>Dear ${userName},</p>
                    <p>We hope you are having a good day!</p>
                    <p>This is to inform you that your profile has been Verified and Approved by the Admin Team.</p>
                    <p>You can now log in and continue your journey with Connecting Soulmate and we hope that you get your desired life partner on our platform soon.</p>
                    <p>Thank You</p>
                    <p>Team - Connecting Soulmate</p>
                    <hr>
                    <p>You’re receiving this email because you have a Connecting Soulmate account. This email is not a marketing or promotional email. That is why this email does not contain an unsubscribe link.</p>
                    <p>
                        <img src="${LOGO_URL}" alt="Connecting Soulmate Logo" style="vertical-align: middle; width: 55px; height: 55px; border-radius: 4px;"> <p style="margin-left: 20px;">Connecting Soulmate</p>
                        
                    </p>
                    <p>For any queries please reach out to us at work.connectingsoulmate@gmail.com</p>
                </div>
            </div>
        `;
      break;
    case "approvalRequest":
      template = `
          <div style="text-align: center;">
            <div style="${styles}">
                <img src="${LOGO_URL}" alt="Connecting Soulmate Logo" style="width: 85px; height: 85px; border-radius: 4px;">
                <p>Dear ${userName},</p>
                <p>We hope you are having a good day!</p>
                <p>Thank you for registering with Connecting Soulmate. We have received your profile and it is currently under Admin review.</p>
                <p>We usually take 3-5 days for admin approval. Once your profile is approved, you can start your journey with us to find your desired life partner.</p>
                <p>Thank You</p>
                <p>Team - Connecting Soulmate</p>
                <hr>
                <p>You’re receiving this email because you have a Connecting Soulmate account. This email is not a marketing or promotional email. That is why this email does not contain an unsubscribe link.</p>
                <p>
                    <img src="${LOGO_URL}" alt="Connecting Soulmate Logo" style="vertical-align: middle; width: 55px; height: 55px; border-radius: 4px;"> <p style="margin-left: 20px;"></p>
                    Connecting Soulmate
                </p>
                <p>For any queries please reach out to us at work.connectingsoulmate@gmail.com</p>
            </div>
          </div>
        `;
      break;
    case "changeRegisteredNumber":
      template = `
          <div style="text-align: center;">
              <div style="${styles}">
                  <img src="${LOGO_URL}" alt="Connecting Soulmate Logo" style="width: 85px; height: 85px; border-radius: 4px;">
                  <p>Dear ${userName},</p>
                  <p>We hope you are having a good day!</p>
                  <p>You are getting this email as you have requested to change your registered number with Connecting Soulmate.</p>
                  <p>Please click the link below to verify this request change and add the new number to our platform.</p>
                  <p><a href="${verificationLink}" style="color: #007bff;">[CLICK THE LINK HERE]</a></p>
                  <p>Do not click the link if you have not opted to change the registered number.</p>
                  <p>Thank You</p>
                  <p>Team - Connecting Soulmate</p>
                  <hr>
                  <p>You’re receiving this email because you have a Connecting Soulmate account. This email is not a marketing or promotional email. That is why this email does not contain an unsubscribe link.</p>
                  <p>
                      <img src="${LOGO_URL}" alt="Connecting Soulmate Logo" style="vertical-align: middle; width: 55px; height: 55px; border-radius: 4px;"> <p style="margin-left: 20px;"></p>
                      Connecting Soulmate
                  </p>
                  <p>For any queries please reach out to us at work.connectingsoulmate@gmail.com</p>
              </div>
          </div>
        `;
      break;
    case "profileRejected":
      template = `
              <div style="text-align: center;">
                  <div style="${styles}">
                      <img src="${LOGO_URL}" alt="Connecting Soulmate Logo" style="width: 85px; height: 85px; border-radius: 4px;">
                      <p>Dear ${userName},</p>
                      <p>We hope you are having a good day!</p>
                      <p>This is to inform you that your profile has been Rejected by the Admin Team.</p>
                      <p>If this has happened by mistake please connect with the team at work.connectingsoulmate@gmail.com and try creating a profile again after 15 days.</p>
                      <p>Thank You</p>
                      <p>Team - Connecting Soulmate</p>
                      <hr>
                      <p>You’re receiving this email because you have a Connecting Soulmate account. This email is not a marketing or promotional email. That is why this email does not contain an unsubscribe link.</p>
                      <p>
                          <img src="${LOGO_URL}" alt="Connecting Soulmate Logo" style="vertical-align: middle; width: 55px; height: 55px; border-radius: 4px;"> <p style="margin-left: 20px;"></p>
                          Connecting Soulmate
                      </p>
                      <p>For any queries please reach out to us at work.connectingsoulmate@gmail.com</p>
                  </div>
              </div>
          `;
      break;
    case "review":
      const issuesList = issues
        .map((issue, index) => `<p>${index + 1}. ${issue}</p>`)
        .join("");
      template = `
          <div style="text-align: center;">
              <div style="text-align: left; display: inline-block; padding: 10px; ${styles}">
                  <img src=${LOGO_URL} alt="Connecting Soulmate Logo" style="width: 85px; height: 85px; border-radius: 4px;">
                  <p>Hello,</p>
                  <p>Thank you for registering with Connecting Soulmate.</p>
                  <p>While reviewing your profiles, we have found some issues enlisted below and hence your profile is kept under review.</p>
                  ${issuesList}
                  <p>If you face any issues please connect with our admin at ${ADMIN_EMAIL}</p>
              </div>
          </div>
        `;
      break;
    case "deleteProfileByUser":
      template = `
            <div style="text-align: center;">
                <div style="${styles}">
                    <img src="${LOGO_URL}" alt="Connecting Soulmate Logo" style="width: 85px; height: 85px; border-radius: 4px;">
                    <p>Dear ${userName},</p>
                    <p>We hope you are having a good day!</p>
                    <p>You are getting this email as you have decided to delete your profile from the Connecting Soulmate platform.</p>
                    <p>We would like to inform you that all your details will be deleted and will not be visible to anyone.</p>
                    <p>We hope we were able to serve you. If you have any feedback or suggestions for us, please write to us at work.connectingsoulmate@gmail.com</p>
                    <p>Thank You</p>
                    <p>Team - Connecting Soulmate</p>
                    <hr>
                    <p>You’re receiving this email because you have a Connecting Soulmate account. This email is not a marketing or promotional email. That is why this email does not contain an unsubscribe link.</p>
                    <p>
                        <img src="${LOGO_URL}" alt="Connecting Soulmate Logo" style="vertical-align: middle; width: 55px; height: 55px; border-radius: 4px;"> <p style="margin-left: 20px;"></p>
                        Connecting Soulmate
                    </p>
                    <p>For any queries please reach out to us at work.connectingsoulmate@gmail.com</p>
                </div>
            </div>
        `;
      break;
    case "deleteProfileByAdmin":
      template = `
            <div style="text-align: center;">
                <div style="${styles}">
                    <img src="${LOGO_URL}" alt="Connecting Soulmate Logo" style="width: 85px; height: 85px; border-radius: 4px;">
                    <p>Dear ${userName},</p>
                    <p>We hope you are having a good day!</p>
                    <p>You are getting this email as you the Admin has deleted your profile from Connecting Soulmate platform. </p>
                    <p>We would like to inform you that all your details will be deleted and will not be visible to anyone. </p>
                    <p>We hope we were able to serve you. If you have any feedback or suggestions for us, please write to us at work.connectingsoulmate@gmail.com</p>
                    <p>Thank You</p>
                    <p>Team - Connecting Soulmate</p>
                    <hr>
                    <p>You’re receiving this email because you have a Connecting Soulmate account. This email is not a marketing or promotional email. That is why this email does not contain an unsubscribe link.</p>
                    <p>
                        <img src="${LOGO_URL}" alt="Connecting Soulmate Logo" style="vertical-align: middle; width: 55px; height: 55px; border-radius: 4px;"> <p style="margin-left: 20px;"></p>
                        Connecting Soulmate
                    </p>
                    <p>For any queries please reach out to us at work.connectingsoulmate@gmail.com</p>
                </div>
            </div>
        `;
      break;
    case "approvalEmailToAdmin":
      template = `
            <div style="text-align: center;">
                <div style="${styles}">
                    <img src="${LOGO_URL}" alt="Connecting Soulmate Logo" style="width: 85px; height: 85px; border-radius: 4px;">
                    <p>Dear Admin,</p>
                    <p>We hope you are having a good day!</p>
                    <p>You have got a new registration request from ${userName} on Connecting Soulmate. </p>
                    <p>Go on your dashboard and check their detailed profile. </p>
                    <p>Thank You</p>
                    <p>Team - Connecting Soulmate</p>
                    <hr>
                    <p>You’re receiving this email because you have a Connecting Soulmate account. This email is not a marketing or promotional email. That is why this email does not contain an unsubscribe link.</p>
                    <p>
                        <img src="${LOGO_URL}" alt="Connecting Soulmate Logo" style="vertical-align: middle; width: 55px; height: 55px; border-radius: 4px;"> <p style="margin-left: 20px;"></p>
                        Connecting Soulmate
                    </p>
                    <p>For any queries please reach out to us at work.connectingsoulmate@gmail.com</p>
                </div>
            </div>
        `;
      break;
    case "banProfileByAdmin":
      template = `
            <div style="text-align: center;">
                <div style="${styles}">
                    <img src="${LOGO_URL}" alt="Connecting Soulmate Logo" style="width: 85px; height: 85px; border-radius: 4px;">
                    <p>Dear ${userName},</p>
                    <p>We hope you are having a good day!</p>
                    <p>You are getting this email as you the Admin have blocked your profile from the Connecting Soulmate platform. </p>
                    <p>We would like to inform you that all your details will be deleted and will not be visible to anyone. </p>
                    <p>Reason for the ban : </p>
                    <p>${banReason}</p>
                    <p>We hope we were able to serve you. If you have any feedback or suggestions for us, please write to us at work.connectingsoulmate@gmail.com</p>
                    <p>Thank You</p>
                    <p>Team - Connecting Soulmate</p>
                    <hr>
                    <p>You’re receiving this email because you have a Connecting Soulmate account. This email is not a marketing or promotional email. That is why this email does not contain an unsubscribe link.</p>
                    <p>
                        <img src="${LOGO_URL}" alt="Connecting Soulmate Logo" style="vertical-align: middle; width: 55px; height: 55px; border-radius: 4px;"> <p style="margin-left: 20px;"></p>
                        Connecting Soulmate
                    </p>
                    <p>For any queries please reach out to us at work.connectingsoulmate@gmail.com</p>
                </div>
            </div>
        `;
      break;
    default:
      throw new Error("Invalid email type");
  }
  return template;
};

exports.sendApprovalEmail = async (userEmail, name) => {
  const subject = "Registration Completed - Connecting Soulmate";
  const htmlContent = getEmailTemplate("approvalRequest", [], name);

  await sendUserEmail({ to: userEmail, subject, htmlContent });
};

exports.sendSuccessfulRegisterationMessage = async (userEmail, name) => {
  const subject = "Profile Approved - Connecting Soulmate";
  const htmlContent = getEmailTemplate("successfullyApproved", [], name);

  await sendUserEmail({ to: userEmail, subject, htmlContent });
};

exports.sendRejectionEmail = async (userEmail, name) => {
  const subject = "Profile Rejected - Connecting Soulmate";
  const htmlContent = getEmailTemplate("profileRejected", [], name);

  await sendUserEmail({ to: userEmail, subject, htmlContent });
};

exports.sendChangeRegistrationEmail = async (userEmail, name, link) => {
  const subject = "Request for changing registered number - Connecting Soulmate";
  const htmlContent = getEmailTemplate("changeRegisteredNumber", [], name, link);

  await sendUserEmail({ to: userEmail, subject, htmlContent });
};

exports.sendReviewEmail = async (userEmail, issues, name) => {
  const subject = "Profile Review Notification";
  const htmlContent = getEmailTemplate("review", issues, name);

  await sendUserEmail({ to: userEmail, subject, htmlContent });
};

exports.sendDeleteEmail = async (userEmail, name) => {
  const subject = "Delete Profile - Connecting Soulmate";
  const htmlContent = getEmailTemplate("deleteProfileByUser", [], name);

  await sendUserEmail({ to: userEmail, subject, htmlContent });
};

exports.sendDeleteEmailFromAdmin = async (userEmail, name) => {
  const subject = "Profile Deleted by Admin - Connecting Soulmate";
  const htmlContent = getEmailTemplate("deleteProfileByAdmin", [], name);

  await sendUserEmail({ to: userEmail, subject, htmlContent });
};
exports.sendBannedEmailFromAdmin = async (userEmail, name, reason) => {
  const subject = "Profile Blocked by Admin - Connecting Soulmate";
  const htmlContent = getEmailTemplate("banProfileByAdmin", [], name, "", reason);

  await sendUserEmail({ to: userEmail, subject, htmlContent });
};
exports.sendApprovalEmailToAdmin = async (userEmail, name) => {
  const subject = `${name?.replaceAll('undefined', '')} New Registration Approval Request Received`;
  const htmlContent = getEmailTemplate("approvalEmailToAdmin", [], name, "");

  await sendUserEmail({ to: userEmail, subject, htmlContent });
};
