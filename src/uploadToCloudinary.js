import axios from "axios";

const uploadToCloudinary = async (file) => {
  const CLOUD_NAME = "trainingplat-a"; // Your Cloudinary cloud name
  const UPLOAD_PRESET = "training"; // Your preset name
  const API_KEY = "278769468359541"; // Your Cloudinary API Key

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", UPLOAD_PRESET); // Required for unsigned uploads
  formData.append("api_key", API_KEY); // Required if using a signed preset

  try {
    const response = await axios.post(
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );

    console.log("Cloudinary Upload Success:", response.data);
    return response.data.secure_url; // Returns the uploaded file URL

  } catch (error) {
    console.error("Cloudinary upload failed:", error.response?.data || error.message);
    console.log("Full Error Details:", error.toJSON ? error.toJSON() : error);
    return null;
  }
};

export default uploadToCloudinary;
