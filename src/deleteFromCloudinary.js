import axios from "axios";
import sha1 from "js-sha1";

const deleteFromCloudinary = async (publicId) => {
  const CLOUD_NAME = "trainingplat-a"; // Replace with your Cloudinary cloud name
  const API_KEY = "278769468359541"; // Replace with your Cloudinary API Key
  const API_SECRET = "Z2ptU9CX_46W7zvtFV56ulXKXJc"; // Replace with your Cloudinary API Secret

  const timestamp = Math.round(new Date().getTime() / 1000);
  const signature = `public_id=${publicId}&timestamp=${timestamp}${API_SECRET}`;
  const sha1Signature = sha1(signature);

  const url = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/resources/image/destroy`;

  try {
    const response = await axios.post(url, {
      public_id: publicId,
      signature: sha1Signature,
      api_key: API_KEY,
      timestamp: timestamp,
    });

    console.log("Cloudinary Delete Success:", response.data);
    return response.data;
  } catch (error) {
    console.error("Cloudinary delete failed:", error.response?.data || error.message);
    return null;
  }
};

export default deleteFromCloudinary;
