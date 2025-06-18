// cloudinaryConfig.js
import { Cloudinary } from 'cloudinary-core';

const cloudinaryConfig = {
  cloudName: 'dddmyju3i',
  apiKey: '199954194886882',
  apiSecret: 'fXouukOgHAPXVbNsTblDN0yvwDo',
  uploadPreset: 'ml_default' // Update this to match your Cloudinary preset name
};

export const cloudinary = new Cloudinary({
  cloud_name: cloudinaryConfig.cloudName,
  secure: true
});

export default cloudinaryConfig;