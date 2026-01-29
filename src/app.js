import studentRoutes from "./src/routes/studentRoutes.js";
const cartRoutes = require('./routes/cartRoutes');
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('LMS API running');
});


app.use("/api/student", studentRoutes);
app.use('/cart', cartRoutes)


module.exports = app;


