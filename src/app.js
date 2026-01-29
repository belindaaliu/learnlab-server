const studentRoutes = require("./routes/studentRoutes"); 
const express = require('express');
const cors = require('cors');
const courseRoutes = require('./routes/courses.routes');
const authRoutes = require('./routes/auth.routes');
const cartRoutes = require('./routes/cartRoutes');

const app = express();

// --- Middlewares ---
app.use(cors()); 
app.use(express.json());

// --- Routes ---
app.use('/api/courses', courseRoutes); 

app.use('/api/auth', authRoutes);

app.use('/cart', cartRoutes)

app.get('/api', (req, res) => {
  res.json({ message: "Welcome to LearnLab API" });
});

app.use("/api/student", studentRoutes);

module.exports = app;
