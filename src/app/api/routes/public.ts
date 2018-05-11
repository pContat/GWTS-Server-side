const express = require("express");
import {Request, Response, Router} from "express";

const router = Router();
/* GET home page. */

router.get("/ping", (req: Request, res: Response) => {
  res.json({
    status: "ok"
  }).status(200);
});


export const PublicController: Router = router;
