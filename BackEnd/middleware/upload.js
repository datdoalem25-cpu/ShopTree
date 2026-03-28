const multer = require('multer');

// Lưu file trên RAM để upload trực tiếp lên Cloudinary.
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: {
    fileSize: 8 * 1024 * 1024,
  },
});

module.exports = upload;
