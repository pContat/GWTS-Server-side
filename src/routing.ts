import * as publicRoutes from "./routes/public";
const express = require("express");
const router = express.Router();

router.use("/public", publicRoutes);

export = router;
