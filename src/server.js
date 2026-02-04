require('dotenv').config();

// --- 🛠️ FIX BIGINT ISSUE In DB for ID ---
BigInt.prototype.toJSON = function () {
  return this.toString();
};
// ----------------------------

const app = require('./app');

const PORT = process.env.PORT || 5000;

// app.listen(PORT, () => {
//   console.log(`Server running on port ${PORT}`);
// });
const server = app.listen(PORT, () => {
  console.log(`🚀 Server finally staying alive on port ${PORT}`);
}).on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use! Try a different port.`);
  } else {
    console.error('❌ Server startup error:', err);
  }
});

// Prevent immediate exit
process.on('unhandledRejection', (err) => {
  console.log('UNHANDLED REJECTION! 💥 Shutting down...');
  console.log(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});

process.on('SIGTERM', () => {
  console.log('👋 SIGTERM RECEIVED. Shutting down gracefully');
  server.close(() => {
    console.log('💥 Process terminated!');
  });
});