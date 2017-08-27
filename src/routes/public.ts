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

router.get("/crawl", async (req: Request, res: Response) => {
  const builder = new DBBuilder();
  await builder.test();
  res.json({
    test: "hi"
  });
});

export = router;
