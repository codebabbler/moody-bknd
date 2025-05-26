// Import modules
import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import dotenv from "dotenv";
import path from "path";

// Load environment variables from .env file
dotenv.config({
  path: path.resolve(process.cwd(), ".env"),
});

// Define interface for Cloudinary response
interface CloudinaryResponse {
  public_id: string;
  url: string;
  secure_url: string;
  resource_type: string;
  format: string;
  width: number;
  height: number;
  bytes: number;
  created_at: string;
  [key: string]: any; // For any additional properties
}

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Debug configuration
console.log("Cloudinary Configuration Status:", {
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME ? "✅ Present" : "❌ Missing",
  api_key: process.env.CLOUDINARY_API_KEY ? "✅ Present" : "❌ Missing",
  api_secret: process.env.CLOUDINARY_API_SECRET ? "✅ Present" : "❌ Missing"
});

const uploadOnCloudinary = async (localFilePath: string) => {
  // Debug log
  console.log("Cloudinary Configuration:", {
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME ? "Present" : "Missing",
    api_key: process.env.CLOUDINARY_API_KEY ? "Present" : "Missing",
    api_secret: process.env.CLOUDINARY_API_SECRET ? "Present" : "Missing"
  });
  try {
    if (!localFilePath) {
      console.error("No file path provided for upload");
      return null;
    }

    // Check if file exists before uploading
    if (!fs.existsSync(localFilePath)) {
      console.error(`File not found at path: ${localFilePath}`);
      return null;
    }

    // Verify Cloudinary configuration
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      console.error("Cloudinary configuration missing:", {
        cloud_name: !!process.env.CLOUDINARY_CLOUD_NAME,
        api_key: !!process.env.CLOUDINARY_API_KEY,
        api_secret: !!process.env.CLOUDINARY_API_SECRET
      });
      return null;
    }

    // Upload the file to cloudinary - using the v2 API as recommended in tutorial
    console.log(`Attempting to upload file: ${localFilePath}`);
    const response = await new Promise<CloudinaryResponse>((resolve, reject) => {
      cloudinary.uploader.upload(
        localFilePath,
        {
          resource_type: "auto",
        },
        (error, result) => {
          if (error) {
            console.error("Upload error details:", error);
            reject(error);
            return;
          }
          resolve(result as CloudinaryResponse);
        }
      );
    });

    // File has been uploaded successfully
    console.log(`File uploaded successfully to Cloudinary: ${response.url}`);

    // Clean up the local file after successful upload
    if (fs.existsSync(localFilePath)) {
      fs.unlinkSync(localFilePath);
      console.log(`Local file deleted: ${localFilePath}`);
    }

    return response;
  } catch (error) {
    // Log detailed error information
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`Cloudinary upload error: ${errorMessage}`);

    // Check if file exists before attempting to delete it
    if (localFilePath && fs.existsSync(localFilePath)) {
      try {
        fs.unlinkSync(localFilePath);
        console.log(`Cleaned up local file after error: ${localFilePath}`);
      } catch (unlinkError) {
        const unlinkErrorMessage =
          unlinkError instanceof Error
            ? unlinkError.message
            : String(unlinkError);
        console.error(`Failed to clean up local file: ${unlinkErrorMessage}`);
      }
    }
    return null;
  }
};

export default uploadOnCloudinary;
