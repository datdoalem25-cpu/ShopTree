const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const ensureCloudinaryEnv = () => {
  if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    const error = new Error('Thiếu biến môi trường Cloudinary (CLOUDINARY_CLOUD_NAME/API_KEY/API_SECRET).');
    error.statusCode = 500;
    throw error;
  }
};

const uploadBuffer = ({ buffer, folder, publicId, resourceType = 'image' }) => {
  ensureCloudinaryEnv();

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        public_id: publicId,
        resource_type: resourceType,
      },
      (error, result) => {
        if (error) return reject(error);
        return resolve(result);
      }
    );

    stream.end(buffer);
  });
};

const uploadDataUrl = async ({ dataUrl, folder, publicId }) => {
  ensureCloudinaryEnv();
  return cloudinary.uploader.upload(dataUrl, {
    folder,
    public_id: publicId,
    resource_type: 'image',
  });
};

module.exports = {
  uploadBuffer,
  uploadDataUrl,
};
