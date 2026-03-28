require('dotenv').config();
const app = require('./app');
const connectDB = require('./config/db');
const { ensureDefaultAdmin } = require('./services/authService');

const PORT = process.env.PORT || 5000;

// Kết nối Database rồi khởi động Server
connectDB().then(() => {
  ensureDefaultAdmin()
    .then(() => console.log('✅ Admin mặc định đã sẵn sàng: admin@gmail.com'))
    .catch((error) => console.error('⚠️ Không thể khởi tạo admin mặc định:', error.message));

  app.listen(PORT, () => console.log(`🚀 Server chạy tại cổng ${PORT}`));
});
