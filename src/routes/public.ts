
const express = require("express");
const router = express.Router();
import { Request, Response } from "express";

/* GET home page. */

router.get("/ping", (req: Request, res: Response) => {
  res.json({
    status: "ok"
  }).status(200);
});



export = router;
