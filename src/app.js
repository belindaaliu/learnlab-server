const express = require('express');
const cors = require('cors');
const studentRoutes = require("./routes/studentRoutes"); 
const courseRoutes = require('./routes/courses.routes');
const authRoutes = require('./routes/authRoutes');
const cartRoutes = require('./routes/cartRoutes');
const orderRoutes = require('./routes/orderRoutes');

const app = express();

// --- Middlewares ---
app.use(cors()); 

app.use('/api/orders/webhook', express.raw({ type: 'application/json' }));
app.use(express.json());

// --- Routes ---
app.use('/api/courses', courseRoutes); 

app.use('/api/auth', authRoutes);

app.use('/api/cart', cartRoutes)

app.get('/api', (req, res) => {
  res.json({ message: "Welcome to LearnLab API" });
});

app.use("/api/student", studentRoutes);

module.exports = app;
