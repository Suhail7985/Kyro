const cloudinary = require('cloudinary').v2;

const isConfigured = !!(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
);

if (isConfigured) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

function isCloudinaryConfigured() {
  return isConfigured;
}

/**
 * Uploads a buffer to Cloudinary using a write stream.
 * @param {Buffer} fileBuffer
 * @param {string} folder
 * @param {string} resourceType 'raw' | 'image' | 'video' | 'auto'
 * @returns {Promise<object>} Upload result
 */
function uploadStream(fileBuffer, folder = 'hrms', resourceType = 'auto') {
  return new Promise((resolve, reject) => {
    if (!isConfigured) {
      return reject(new Error('Cloudinary is not configured'));
    }

    const uploadOptions = {
      folder,
      resource_type: resourceType,
    };

    // Auto-transcode and optimize videos on ingest
    if (resourceType === 'video') {
      uploadOptions.eager = [
        { format: 'mp4', video_codec: 'h264', quality: 'auto' }
      ];
      uploadOptions.eager_async = false;
    }

    const stream = cloudinary.uploader.upload_stream(
      uploadOptions,
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );

    stream.end(fileBuffer);
  });
}

/**
 * Generates a presigned signature for client-side uploads.
 * @param {string} folder
 * @param {string} resourceType 'raw' | 'image' | 'video' | 'auto'
 * @returns {object} Signature details
 */
function generatePresignedUploadSignature(folder = 'hrms', resourceType = 'auto') {
  if (!isConfigured) {
    throw new Error('Cloudinary is not configured');
  }

  const timestamp = Math.round(new Date().getTime() / 1000);
  
  // Cloudinary signatures require parameters in alphabetical order
  const paramsToSign = {
    folder,
    timestamp,
  };

  const signature = cloudinary.utils.api_sign_request(
    paramsToSign,
    process.env.CLOUDINARY_API_SECRET
  );

  return {
    signature,
    timestamp,
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    folder,
  };
}

/**
 * Uploads a file from a local disk path to Cloudinary.
 * @param {string} filePath
 * @param {string} folder
 * @param {string} resourceType
 * @returns {Promise<object>} Upload result
 */
function uploadLocalFile(filePath, folder = 'hrms', resourceType = 'auto') {
  return new Promise((resolve, reject) => {
    if (!isConfigured) {
      return reject(new Error('Cloudinary is not configured'));
    }

    const uploadOptions = {
      folder,
      resource_type: resourceType,
    };

    if (resourceType === 'video') {
      uploadOptions.eager = [
        { format: 'mp4', video_codec: 'h264', quality: 'auto' }
      ];
      uploadOptions.eager_async = false;
    }

    cloudinary.uploader.upload(filePath, uploadOptions, (error, result) => {
      if (error) return reject(error);
      resolve(result);
    });
  });
}

module.exports = {
  cloudinary,
  isCloudinaryConfigured,
  uploadStream,
  uploadLocalFile,
  generatePresignedUploadSignature,
};
