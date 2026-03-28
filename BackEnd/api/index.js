const app = require('../app');
const connectDB = require('../config/db');
const { ensureDefaultAdmin } = require('../services/authService');

let initPromise = null;

const initializeOnce = async () => {
  if (!initPromise) {
    initPromise = connectDB()
      .then(() => ensureDefaultAdmin().catch((error) => {
        console.error('⚠️ Không thể khởi tạo admin mặc định:', error.message);
      }))
      .catch((error) => {
        initPromise = null;
        throw error;
      });
  }

  return initPromise;
};

module.exports = async (req, res) => {
  await initializeOnce();
  return app(req, res);
};
