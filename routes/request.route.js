const {
  sendProfileRequest,
  acceptProfileRequest,
  declineProfileRequest,
  getProfileRequestsAccepted,
  getProfileRequestsDeclined,
  getProfileRequestsSent,
  getProfileRequestsReceived,
  sendInterestRequest,
  acceptInterestRequest,
  declineInterestRequest,
  getInterestRequestsAccepted,
  getInterestRequestsDeclined,
  getInterestRequestsSent,
  getInterestRequestsReceived,
  blockProfileRequest,
  cancelProfileRequest,
  cancelInterestRequest,
  blockedInterestRequest,
} = require("../controllers/requestController");

module.exports = (app) => {
  //profileSection
  app.post("/api/profile-request/send", sendProfileRequest);
  app.put("/api/profile-request/accept/:requestId", acceptProfileRequest);
  app.put("/api/profile-request/decline/:requestId", declineProfileRequest);
  app.put("/api/profile-request/cancel/:requestId", cancelProfileRequest);
  app.get("/api/profile-request/accepted/:userId", getProfileRequestsAccepted);
  app.get("/api/profile-request/declined/:userId", getProfileRequestsDeclined);
  app.get("/api/profile-request/sent/:userId", getProfileRequestsSent);
  app.get("/api/profile-request/recieved/:userId", getProfileRequestsReceived);

  //interestSection
  app.post("/api/interest-request/send", sendInterestRequest);
  app.put("/api/interest-request/accept/:requestId", acceptInterestRequest);
  app.put("/api/interest-request/decline/:requestId", declineInterestRequest);
  app.put("/api/interest-request/cancel/:requestId", cancelInterestRequest);
  app.get(
    "/api/interest-request/accepted/:userId",
    getInterestRequestsAccepted
  );
  app.get(
    "/api/interest-request/declined/:userId",
    getInterestRequestsDeclined
  );
  app.get("/api/interest-request/sent/:userId", getInterestRequestsSent);
  app.get(
    "/api/interest-request/recieved/:userId",
    getInterestRequestsReceived
  );
};
