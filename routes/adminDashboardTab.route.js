const {
  getTotalUsers,
  getTotalMaleUsers,
  getTotalFemaleUsers,
  getTotalDeletedUsers,
  getTotalUsersCategoryA,
  getTotalUsersCategoryB,
  getTotalUsersCategoryC,
  getTotalUsersUnCategorised,
  getTotalActiveUsers,
  getBannedUsers,
} = require("../controllers/adminDashboardTabs");
const { isAdmin } = require("../middleware/is_auth");

module.exports = (app) => {
  app.get("/total-users", getTotalUsers);
  app.get("/total-male-users", getTotalMaleUsers);
  app.get("/total-female-users", getTotalFemaleUsers);
  app.get("/total-deleted-users", getTotalDeletedUsers);
  app.get("/total-users-category-a", getTotalUsersCategoryA);
  app.get("/total-users-category-b", getTotalUsersCategoryB);
  app.get("/total-users-category-c", getTotalUsersCategoryC);
  app.get("/total-users-uncategorised", getTotalUsersUnCategorised);
  app.get("/total-active-users", getTotalActiveUsers);
  app.get("/total-successful-marriages", getTotalActiveUsers);
  app.get("/total-banned-users", getBannedUsers);
};
