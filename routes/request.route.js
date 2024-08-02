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
  cancelProfileRequest,
  cancelInterestRequest,
} = require("../controllers/requestController");
const { isAuth } = require("../middleware/is_auth");

module.exports = (app) => {
  //profileSection
  app.post("/api/profile-request/send", isAuth, sendProfileRequest);
  app.put("/api/profile-request/accept/:requestId", isAuth, acceptProfileRequest);
  app.put("/api/profile-request/decline/:requestId", isAuth, declineProfileRequest);
  app.put("/api/profile-request/cancel/:requestId", isAuth, cancelProfileRequest);
  app.get("/api/profile-request/accepted/:userId", isAuth, getProfileRequestsAccepted);
  app.get("/api/profile-request/declined/:userId", isAuth, getProfileRequestsDeclined);
  app.get("/api/profile-request/sent/:userId", isAuth, getProfileRequestsSent);
  app.get("/api/profile-request/recieved/:userId", isAuth, getProfileRequestsReceived);

  //interestSection
  app.post("/api/interest-request/send", isAuth, sendInterestRequest);
  app.put("/api/interest-request/accept/:requestId", isAuth, acceptInterestRequest);
  app.put("/api/interest-request/decline/:requestId", isAuth, declineInterestRequest);
  app.put("/api/interest-request/cancel/:requestId", isAuth, cancelInterestRequest);
  app.get(
    "/api/interest-request/accepted/:userId", isAuth,
    getInterestRequestsAccepted
  );
  app.get(
    "/api/interest-request/declined/:userId", isAuth,
    getInterestRequestsDeclined
  );
  app.get("/api/interest-request/sent/:userId", isAuth, getInterestRequestsSent);
  app.get(
    "/api/interest-request/recieved/:userId", isAuth,
    getInterestRequestsReceived
  );
};
