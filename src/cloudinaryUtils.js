// Make sure the import path is correct for where cloudinaryConfig.js is located
import cloudinaryConfig from './cloudinaryConfig';

export const uploadToCloudinary = async (file) => {
  try {
    // Use the cloud name from config
    const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${cloudinaryConfig.cloudName}/upload`;
    
    // Create form data for unsigned upload
    const formData = new FormData();
    formData.append('file', file);
    
    // Add the upload preset for unsigned uploads
    formData.append('upload_preset', cloudinaryConfig.uploadPreset);
    
    // For unsigned uploads, we need to provide the API key
    formData.append('api_key', cloudinaryConfig.apiKey);
    
    // Make the request with error handling
    const response = await fetch(cloudinaryUrl, {
      method: 'POST',
      body: formData,
    });
    
    // Check if the response is ok
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Cloudinary error response:', errorData);
      throw new Error(`Cloudinary responded with status ${response.status}: ${errorData.error?.message || 'Unknown error'}`);
    }
    
    const data = await response.json();
    console.log('Upload successful:', data.secure_url);
    return {
      url: data.secure_url,
      publicId: data.public_id,
      format: data.format,
      type: data.resource_type
    };
  } catch (error) {
    console.error('Error in uploadToCloudinary:', error);
    throw new Error(`Upload failed: ${error.message}`);
  }
};

// Helper function to check if Cloudinary is configured correctly
export const testCloudinaryConnection = async () => {
  try {
    const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudinaryConfig.cloudName}/ping`);
    const data = await response.json();
    console.log('Cloudinary connection test:', data);
    return data.status === 'ok';
  } catch (error) {
    console.error('Cloudinary connection test failed:', error);
    return false;
  }
};