import * as winston from "winston";

const logger = new winston.Logger({
  level: "info",
  transports: [
    new winston.transports.Console()
    // new winston.transports.File({ filename: "file.log" })
  ]
});
export default logger;
