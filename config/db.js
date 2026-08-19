const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log(`[DB] MongoDB ket noi thanh cong: ${conn.connection.host}`);
  } catch (err) {
    console.error(`[DB] Loi ket noi MongoDB: ${err.message}`);
    console.error('[DB] Dam bao MongoDB dang chay tren may hoac kiem tra MONGODB_URI trong .env');
    process.exit(1);
  }
};

module.exports = connectDB;
