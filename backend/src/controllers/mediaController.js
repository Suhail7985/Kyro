const { generatePresignedUploadSignature, isCloudinaryConfigured } = require('../utils/cloudinary');

async function getPresignedUploadSignature(req, res) {
  try {
    const { folder = 'hrms', resourceType = 'auto' } = req.query;

    if (!isCloudinaryConfigured()) {
      return res.json({ 
        configured: false,
        message: 'Cloudinary is not configured. Falling back to local upload.' 
      });
    }

    const signatureData = generatePresignedUploadSignature(folder, resourceType);

    res.json({
      configured: true,
      ...signatureData,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

module.exports = {
  getPresignedUploadSignature,
};
