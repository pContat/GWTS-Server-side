import * as publicRoutes from "./routes/public";
import {Router} from "express";

const express = require("express");
const router = express.Router();

router.use("/", publicRoutes);

export const RootController: Router = router;
