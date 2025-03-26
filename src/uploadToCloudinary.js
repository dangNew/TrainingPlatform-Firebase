import axios from "axios";

const uploadToCloudinary = async (file) => {
  const CLOUD_NAME = "trainingplat-a"; // Replace with your Cloudinary cloud name
  const UPLOAD_PRESET = "training"; // Replace with your Cloudinary upload preset

  if (!file) {
    console.error("No file provided for upload.");
    return null;
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", UPLOAD_PRESET);
  formData.append("folder", "modules"); // Organize files in a Cloudinary folder
  formData.append("public_id", `module_file_${Date.now()}_${file.name}`); // Unique public ID

  let uploadUrl;
  if (file.type?.startsWith("image")) {
    uploadUrl = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`;
  } else if (file.type?.startsWith("video")) {
    uploadUrl = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/video/upload`;
  } else {
    uploadUrl = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/raw/upload`; // For PDFs and slides
  }

  try {
    const response = await axios.post(uploadUrl, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    return {
      url: response.data.secure_url,
      publicId: response.data.public_id,
    };
  } catch (error) {
    console.error("Cloudinary upload failed:", error.response?.data || error.message);
    return null;
  }
};

export default uploadToCloudinary;
