const express = require("express");
const cors = require("cors");
const adminRoutes = require("./routes/adminRoutes");
const studentRoutes = require("./routes/studentRoutes");
const courseRoutes = require("./routes/courses.routes");
const authRoutes = require("./routes/authRoutes");
const cartRoutes = require("./routes/cartRoutes");
const orderRoutes = require("./routes/orderRoutes");
const subscriptionRoutes = require("./routes/subscriptionRoutes");
const publicRoutes = require("./routes/publicRoutes");
const messageRoutes = require("./routes/messageRoutes");
const coursePlayerRoutes = require("./routes/coursePlayerRoutes");
const uploadRoutes = require("./routes/upload.routes");
const userRoutes = require("./routes/userRoutes");
const categoryRoutes = require("./routes/categoriesRoutes");
const instructorStudentProgress = require("./routes/instructorStudentProgress");
const notificationRoutes = require("./routes/notificationRoutes");
const { stripeWebhook } = require("./controllers/orderController");
const aiAgentRoutes = require("./routes/aiAgent");
const reviewRoutes = require("./routes/reviewRoutes");
const videoNoteRoutes = require("./routes/videoNoteRoutes");

const app = express();

// --- Middlewares ---
const seoMiddleware = require("./middleware/seoMiddleware");

app.post(
  "/api/webhooks/stripe",
  express.raw({ type: "application/json" }),
  stripeWebhook,
);
// app.use(cors());

// Define allowed origins
const allowedOrigins = [
  "http://localhost:5173", // Local Development
  "https://learnlab-f533a8a39a2e.herokuapp.com",
  "https://learnlab-backend-174bc48b923f.herokuapp.com", 
];

app.use(
  cors({
    origin: function (origin, callback) {
      // allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) === -1) {
        const msg =
          "The CORS policy for this site does not allow access from the specified Origin.";
        return callback(new Error(msg), false);
      }
      return callback(null, true);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

app.use(seoMiddleware);

app.use(express.json());

// --- Routes ---
app.use("/api/courses", courseRoutes);
app.use("/api/upload", uploadRoutes);

app.use("/api/public", publicRoutes);

app.use("/api/auth", authRoutes);

app.use("/api/cart", cartRoutes);
app.use("/api/order", orderRoutes);
app.use("/api/subscription", subscriptionRoutes);

app.get("/api", (req, res) => {
  res.json({ message: "Welcome to LearnLab API" });
});

app.use("/api/student", studentRoutes);
app.use("/api/admin", adminRoutes);

app.use("/api/messages", messageRoutes);

app.use("/api/course-player", coursePlayerRoutes);

app.use("/api/users", userRoutes);

app.use("/api/categories", categoryRoutes);

app.use("/api", instructorStudentProgress);

app.use("/api/notifications", notificationRoutes);

app.use("/api/ai", aiAgentRoutes);
app.use("/api", reviewRoutes);

app.use("/api/video-notes", videoNoteRoutes);

module.exports = app;
