import "express";
import * as bodyParser from "body-parser";
import {Application, default as express} from "express"
import morgan from "morgan";
import compression from "compression";
import errorHandler from "errorhandler";
import dotenv from "dotenv";
import {RootController} from "./routing";
import {setCors} from "./cors";
import {mongoSingleConnect} from "../../helper";

//Database connexion

/**
 * Load environment variables from .env file, where API keys and passwords are configured.
 */
dotenv.config({path: ".env.dev"});
mongoSingleConnect();

const app: Application = express();


/**
 * Express configuration.
 */
app.set("port", 3000 || process.env.PORT);
app.use(morgan("dev"));
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());
app.use(
  bodyParser.urlencoded({
    extended: true
  })
);
app.use(compression());


//Set CORS headers
app.all("/*", setCors);


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
app.use("/api", RootController);

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
