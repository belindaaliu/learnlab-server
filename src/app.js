const studentRoutes = require("./routes/studentRoutes"); 
const express = require('express');
const cors = require('cors');
const courseRoutes = require('./routes/courses.routes');

const app = express();

// --- Middlewares ---
app.use(cors()); 
app.use(express.json());

// --- Routes ---
app.use('/api/courses', courseRoutes); 

app.get('/api', (req, res) => {
  res.json({ message: "Welcome to LearnLab API" });
});

app.use("/api/student", studentRoutes);

module.exports = app;