import { v2 as cloudinary } from 'cloudinary';
import { env } from '../config/env';
import fs from 'fs';
import path from 'path';

const uploadsDir = path.join(process.cwd(), 'uploads');

export function initCloudinary(): void {
  if (env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET) {
    cloudinary.config({
      cloud_name: env.CLOUDINARY_CLOUD_NAME,
      api_key: env.CLOUDINARY_API_KEY,
      api_secret: env.CLOUDINARY_API_SECRET,
    });
  }
}

export async function uploadFile(
  filePath: string,
  folder: string
): Promise<string> {
  if (env.CLOUDINARY_CLOUD_NAME) {
    const result = await cloudinary.uploader.upload(filePath, { folder: `talentsphere/${folder}` });
    return result.secure_url;
  }
  if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
  const dest = path.join(uploadsDir, folder, path.basename(filePath));
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(filePath, dest);
  return `/uploads/${folder}/${path.basename(filePath)}`;
}
