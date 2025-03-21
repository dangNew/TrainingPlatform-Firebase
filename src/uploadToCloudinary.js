import axios from "axios";

const uploadToCloudinary = async (file) => {
  const CLOUD_NAME = "trainingplat-a"; // Your Cloudinary cloud name
  const UPLOAD_PRESET = "training"; // Your preset name

  if (!file) {
    console.error("No file provided for upload.");
    return null;
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", UPLOAD_PRESET); // Required for unsigned uploads
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
    console.log(`Uploading file: ${file.name} to ${uploadUrl}`);

    const response = await axios.post(uploadUrl, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    console.log("Cloudinary Upload Success:", response.data);
    return response.data.secure_url; // Returns the uploaded file URL
  } catch (error) {
    console.error(
      "Cloudinary upload failed:",
      error.response?.data || error.message
    );

    // Log the full response from Cloudinary
    if (error.response?.data) {
      console.error(
        "Cloudinary Error Details:",
        JSON.stringify(error.response.data, null, 2)
      );
    }

    return null;
  }
};

export default uploadToCloudinary;