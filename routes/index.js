const path = require("path");
const glob = require("glob");

exports.initializeRoutes = (app) => {
  const directory = path.join(__dirname);
  // console.log(directory);

  const routeFiles = glob.sync(`${directory}/*.route.js`);
  // console.log("routeFiles", routeFiles);

  if (routeFiles.length === 0) {
    console.log("no routes found or no route files are found");
  }
  routeFiles.forEach((files) => {
    // console.log("ROUTE FILE : ", files);
    try {
      const absoluteRouteFilePath = path.resolve(files);
      // console.log("REQUIRED FILE : ", absoluteRouteFilePath);
      const routes = require(absoluteRouteFilePath);
      routes(app);
    } catch (err) {
      console.log(err);
    }
  });
  console.log(`${routeFiles.length} routes initialized`);
};
