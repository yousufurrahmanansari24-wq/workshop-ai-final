const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

/**
 * Upload an image from a base64 string or URL
 * @param {string} source - base64 data URI or https URL
 * @param {string} folder - Cloudinary folder e.g. 'workshopflow/logos'
 * @param {string} publicId - Optional custom public ID
 */
async function uploadImage(source, folder, publicId = null) {
  const options = { folder };
  if (publicId) options.public_id = publicId;

  const result = await cloudinary.uploader.upload(source, options);
  return result.secure_url;
}

/**
 * Delete an image by public ID
 */
async function deleteImage(publicId) {
  await cloudinary.uploader.destroy(publicId);
}

module.exports = { uploadImage, deleteImage };
