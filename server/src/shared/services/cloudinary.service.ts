// server/src/shared/services/cloudinary.service.ts
import { v2 as cloudinary, type UploadApiResponse, type UploadApiErrorResponse } from 'cloudinary';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { config } from '../../config/env.js';

export interface UploadResult {
  url: string;
  name: string;
  format: string;
  size: number;
}

class CloudinaryService {
  private isConfigured: boolean;

  constructor() {
    this.isConfigured = Boolean(
      config.cloudinary.cloudName &&
      config.cloudinary.apiKey &&
      config.cloudinary.apiSecret
    );

    if (this.isConfigured) {
      cloudinary.config({
        cloud_name: config.cloudinary.cloudName,
        api_key: config.cloudinary.apiKey,
        api_secret: config.cloudinary.apiSecret,
        secure: true,
      });
      console.log('Cloudinary initialized successfully for cloud:', config.cloudinary.cloudName);
    } else {
      console.warn('Cloudinary credentials missing in environment; using local uploads fallback.');
    }
  }

  /**
   * Upload an in-memory buffer to Cloudinary with automatic fallback to local disk
   */
  async uploadBuffer(
    buffer: Buffer,
    originalName: string,
    mimeType: string
  ): Promise<UploadResult> {
    const ext = path.extname(originalName).replace('.', '').toLowerCase() || 'bin';

    if (this.isConfigured) {
      try {
        return await new Promise<UploadResult>((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            {
              folder: 'tripflow/proofs',
              resource_type: 'auto',
              public_id: `${Date.now()}-${crypto.randomBytes(4).toString('hex')}`,
            },
            (error: UploadApiErrorResponse | undefined, result: UploadApiResponse | undefined) => {
              if (error || !result) {
                return reject(error || new Error('Upload to Cloudinary returned empty response'));
              }
              resolve({
                url: result.secure_url,
                name: originalName,
                format: result.format || ext,
                size: result.bytes || buffer.length,
              });
            }
          );

          uploadStream.end(buffer);
        });
      } catch (err) {
        console.error('Cloudinary upload failed, falling back to local storage:', (err as Error).message);
      }
    }

    // Local Disk Fallback
    return this.saveToLocalStorage(buffer, originalName, ext);
  }

  private async saveToLocalStorage(
    buffer: Buffer,
    originalName: string,
    ext: string
  ): Promise<UploadResult> {
    const uploadsDir = path.resolve(process.cwd(), 'uploads/proofs');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const uniqueName = `${Date.now()}-${crypto.randomBytes(4).toString('hex')}.${ext}`;
    const filePath = path.join(uploadsDir, uniqueName);
    fs.writeFileSync(filePath, buffer);

    return {
      url: `/uploads/proofs/${uniqueName}`,
      name: originalName,
      format: ext,
      size: buffer.length,
    };
  }
}

export const cloudinaryService = new CloudinaryService();
