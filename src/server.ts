import * as express from "express";
import * as bodyParser from "body-parser";
import * as logger from "morgan";
import * as compression from "compression";
import * as errorHandler from "errorhandler";
import * as dotenv from "dotenv";
//Database connexion
import { connection } from "./helper/mongoConnexion";
const checkConnexion = connection;

/**
 * Load environment variables from .env file, where API keys and passwords are configured.
 */
dotenv.config({ path: ".env.dev" });

const app = express();

/**
 * Express configuration.
 */
app.set("port", process.env.PORT || 3000);
app.use(logger("dev"));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(
  bodyParser.urlencoded({
    extended: true
  })
);
app.use(compression());

//Set CORS headers
app.all("/*", (req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*"); // restrict it to the required domain
  res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,OPTIONS");
  // Set custom headers for CORS
  res.header(
    "Access-Control-Allow-Headers",
    "Content-type,Accept,Authorization"
  );
  // When performing a cross domain request, you will recieve
  // a preflighted request first. This is to check if our the app is safe.
  if (req.method == "OPTIONS") {
    res.status(200).end();
  } else {
    next();
  }
});

// catch 404 and forward to error handler
app.use(
  (
    err: any,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    err.status = 404;
    next(err);
  }
);

if (app.get("env") === "development") {
  app.use(errorHandler());
}

//Routing handling
// app.use("/api", require("./routing"));

//Will create the database

// const DBBuilder = require("./search/DBBuilder");
// const DBB = new DBBuilder();
// DBB.crawl();

/**
 * Start Express server.
 */
app.listen(app.get("port"), () => {
  console.log(
    "  App is running at http://localhost:%d in %s mode",
    app.get("port"),
    app.get("env")
  );
  console.log("  Press CTRL-C to stop\n");
});

module.exports = app;
