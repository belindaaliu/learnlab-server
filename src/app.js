const express = require('express');
const cors = require('cors');
const adminRoutes = require('./routes/adminRoutes');
const studentRoutes = require("./routes/studentRoutes"); 
const courseRoutes = require('./routes/courses.routes');
const authRoutes = require('./routes/authRoutes');
const cartRoutes = require('./routes/cartRoutes');
const orderRoutes = require('./routes/orderRoutes');
const subscriptionRoutes = require('./routes/subscriptionRoutes');
const publicRoutes = require('./routes/publicRoutes');
const messageRoutes = require('./routes/messageRoutes');
const coursePlayerRoutes = require("./routes/coursePlayerRoutes");
const uploadRoutes = require('./routes/upload.routes');
const userRoutes = require('./routes/userRoutes');
const categoryRoutes = require('./routes/categoriesRoutes');
const instructorStudentProgress = require('./routes/instructorStudentProgress');
const notificationRoutes = require('./routes/notificationRoutes');
const { stripeWebhook } = require('./controllers/orderController');
const aiAgentRoutes = require("./routes/aiAgent");

const app = express();

// --- Middlewares ---
const seoMiddleware = require('./middleware/seoMiddleware');
app.use(cors()); 

app.post(
  "/api/webhooks/stripe",
  express.raw({ type: "application/json" }),
  stripeWebhook,
);

app.use(seoMiddleware);


app.use(express.json());

// --- Routes ---
app.use('/api/courses', courseRoutes); 
app.use('/api/upload', uploadRoutes);

app.use('/api/public', publicRoutes);

app.use('/api/auth', authRoutes);

app.use('/api/cart', cartRoutes)
app.use('/api/order', orderRoutes)
app.use('/api/subscription', subscriptionRoutes)

app.get('/api', (req, res) => {
  res.json({ message: "Welcome to LearnLab API" });
});

app.use("/api/student", studentRoutes);
app.use('/api/admin', adminRoutes);

app.use('/api/messages', messageRoutes);

app.use("/api/course-player", coursePlayerRoutes);

app.use('/api/users', userRoutes);

app.use('/api/categories', categoryRoutes);

app.use('/api', instructorStudentProgress);

app.use('/api/notifications', notificationRoutes);

app.use("/api/ai", aiAgentRoutes);


module.exports = app;
