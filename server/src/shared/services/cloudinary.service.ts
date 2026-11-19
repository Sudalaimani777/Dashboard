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
  previewUrl?: string;
  downloadUrl?: string;
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
    if (!buffer || buffer.length === 0) {
      throw new Error('Cannot upload an empty file (0 bytes).');
    }

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
              const format = (result.format || ext).toLowerCase();
              const isPdf = format === 'pdf';
              const previewUrl = isPdf
                ? result.secure_url.replace(/\.pdf($|\?)/i, '.jpg$1')
                : result.secure_url;
              const downloadUrl = isPdf
                ? this.getPrivateDownloadUrl(result.public_id, 'pdf')
                : result.secure_url;

              resolve({
                url: result.secure_url,
                name: originalName,
                format,
                size: result.bytes || buffer.length,
                previewUrl,
                downloadUrl,
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

    const serverOrigin = process.env.SERVER_URL || `http://localhost:${config.port || 5000}`;
    const fileUrl = `${serverOrigin}/uploads/proofs/${uniqueName}`;
    return {
      url: fileUrl,
      name: originalName,
      format: ext,
      size: buffer.length,
      previewUrl: fileUrl,
      downloadUrl: fileUrl,
    };
  }

  /**
   * Generates a signed private download URL for Cloudinary assets (bypassing raw file ACL restrictions)
   */
  getPrivateDownloadUrl(publicId: string, format = 'pdf'): string {
    if (!this.isConfigured) return '';
    try {
      return cloudinary.utils.private_download_url(publicId, format, {
        resource_type: 'image',
        type: 'upload',
        attachment: true,
      });
    } catch (err) {
      console.error('Failed to generate private download URL:', err);
      return '';
    }
  }

  /**
   * Parses public_id and format from a Cloudinary secure delivery URL
   */
  parseCloudinaryUrl(url: string): { publicId: string; format: string } | null {
    if (!url || !url.includes('res.cloudinary.com')) return null;
    const match = url.match(/\/upload\/(?:v\d+\/)?(?:[a-zA-Z0-9_-]+:[a-zA-Z0-9_-]+\/)?(.+?)\.([a-zA-Z0-9]+)(?:\?|$)/);
    if (!match) return null;
    return {
      publicId: match[1],
      format: match[2],
    };
  }
}

export const cloudinaryService = new CloudinaryService();
