import { DBBuilder } from "../search/DBBuilder";
const express = require("express");
const router = express.Router();
import { Request, Response } from "express";

/* GET home page. */

router.get("/", (req: Request, res: Response) => {
  res.json({
    test: "hi"
  });
});



export = router;
