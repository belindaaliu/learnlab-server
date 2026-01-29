require('dotenv').config();

// --- 🛠️ FIX BIGINT ISSUE In DB for ID ---
BigInt.prototype.toJSON = function () {
  return this.toString();
};
// ----------------------------

const app = require('./app');

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});