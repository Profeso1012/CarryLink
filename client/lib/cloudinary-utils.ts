import { apiClient } from "./api-client";

export interface CloudinarySignature {
  signature: string;
  timestamp: number;
  folder: string;
  api_key: string;
  cloud_name: string;
}

export interface CloudinaryUploadResponse {
  secure_url: string;
  public_id: string;
  [key: string]: any;
}

export type CloudinaryFolder = "avatar" | "shipment" | "message" | "dispute";

/**
 * Get a signed upload token from the backend
 * This ensures secure uploads to Cloudinary
 */
export const getUploadSignature = async (
  folder: CloudinaryFolder
): Promise<CloudinarySignature> => {
  try {
    const response = await apiClient.get("/uploads/signature", {
      params: { folder },
    });
    return response.data.data;
  } catch (error) {
    console.error("[Cloudinary] Failed to get upload signature:", error);
    throw error;
  }
};

/**
 * Upload a file directly to Cloudinary using a signed request
 * The backend provides the signature to prevent unauthorized uploads
 */
export const uploadToCloudinary = async (
  file: File,
  folder: CloudinaryFolder
): Promise<CloudinaryUploadResponse> => {
  try {
    // Step 1: Get signature from backend
    const signature = await getUploadSignature(folder);

    // Step 2: Prepare FormData for Cloudinary
    const formData = new FormData();
    formData.append("file", file);
    formData.append("api_key", signature.api_key);
    formData.append("timestamp", signature.timestamp.toString());
    formData.append("signature", signature.signature);
    formData.append("folder", signature.folder);

    // Step 3: Upload to Cloudinary
    const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${signature.cloud_name}/image/upload`;
    const response = await fetch(cloudinaryUrl, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      console.error("[Cloudinary] Upload failed:", error);
      throw new Error(error.error?.message || "Upload failed");
    }

    const data: CloudinaryUploadResponse = await response.json();
    console.log("[Cloudinary] Upload successful:", data.secure_url);
    return data;
  } catch (error) {
    console.error("[Cloudinary] Upload error:", error);
    throw error;
  }
};

/**
 * Upload multiple files to Cloudinary
 */
export const uploadMultipleToCloudinary = async (
  files: File[],
  folder: CloudinaryFolder
): Promise<CloudinaryUploadResponse[]> => {
  const uploads = files.map((file) => uploadToCloudinary(file, folder));
  return Promise.all(uploads);
};
