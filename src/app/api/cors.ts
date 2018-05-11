import {NextFunction, Request, Response} from "express";


export function setCors(req: Request, res: Response, next: NextFunction) {
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
}
