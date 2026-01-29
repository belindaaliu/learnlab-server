const express = require("express");
const { getCurrentUser } = require("../controllers/Student/studentController");

const router = express.Router();

router.get("/me/:id", getCurrentUser);

module.exports = router;