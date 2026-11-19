// server/src/shared/services/fileSecurity.service.ts
import path from 'node:path';
import { Readable } from 'node:stream';
import { fileTypeFromBuffer } from 'file-type';
import sharp from 'sharp';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';
import NodeClam from 'clamscan';
import { config } from '../../config/env.js';

export class FileSecurityValidationError extends Error {
  statusCode: number;
  constructor(message: string, statusCode = 400) {
    super(message);
    this.name = 'FileSecurityValidationError';
    this.statusCode = statusCode;
  }
}

export interface SecurityVerificationOptions {
  declaredFilename: string;
  declaredMimeType?: string;
}

export interface SecurityVerificationResult {
  sanitizedBuffer: Buffer;
  verifiedExt: string;
  verifiedMime: string;
  metadata: {
    originalSize: number;
    sanitizedSize: number;
    width?: number;
    height?: number;
    pages?: number;
    antivirusStatus: 'CLEAN' | 'SKIPPED_UNAVAILABLE';
  };
}

const ALLOWED_MIME_TYPES = new Map<string, string[]>([
  ['application/pdf', ['pdf']],
  ['image/png', ['png']],
  ['image/jpeg', ['jpg', 'jpeg']],
  ['image/webp', ['webp']],
]);

export class FileSecurityService {
  private clamScanner: any = null;
  private clamInitAttempted = false;

  /**
   * Lazily initializes and caches the ClamAV client
   */
  private async getClamScanner(): Promise<any | null> {
    if (this.clamScanner) return this.clamScanner;
    if (this.clamInitAttempted) return null;

    try {
      this.clamInitAttempted = true;
      const clamInstance = await new NodeClam().init({
        clamdscan: {
          host: config.clamav.host,
          port: config.clamav.port,
          timeout: config.clamav.timeout,
        },
        preference: 'clamdscan',
      });
      this.clamScanner = clamInstance;
      console.log(`[FileSecurity] ClamAV connected on ${config.clamav.host}:${config.clamav.port}`);
      return this.clamScanner;
    } catch (err: any) {
      console.warn(
        `[FileSecurity] ClamAV daemon is not reachable at ${config.clamav.host}:${config.clamav.port} (${err.message}). Integrity checks (file-type, sharp, pdfjs) will guard uploads.`
      );
      return null;
    }
  }

  /**
   * Validates file upload through 5 security layers:
   * 1. Multer Memory & Size Bounds
   * 2. Fake Extension Detection (file-type magic byte analysis)
   * 3. Image Integrity & Sanitization (sharp raster verification)
   * 4. PDF Structure & Parsing Integrity (pdfjs-dist)
   * 5. Antivirus & Malware Scanning (ClamAV)
   */
  async verifyFile(
    buffer: Buffer,
    options: SecurityVerificationOptions
  ): Promise<SecurityVerificationResult> {
    // 1. Multer Buffer Size & Empty File Check
    if (!buffer || buffer.length === 0) {
      throw new FileSecurityValidationError(
        'Uploaded file is empty (0 bytes). Please upload a valid document with content.'
      );
    }

    if (buffer.length > 10 * 1024 * 1024) {
      throw new FileSecurityValidationError(
        'File exceeds the 10MB maximum upload limit.'
      );
    }

    // 2. Fake Extension Detection via Magic Byte Inspection (file-type)
    const detected = await fileTypeFromBuffer(buffer);
    if (!detected) {
      throw new FileSecurityValidationError(
        'Unsupported or corrupted file format: File header could not be verified'
      );
    }

    if (!ALLOWED_MIME_TYPES.has(detected.mime)) {
      throw new FileSecurityValidationError(
        `Disallowed file type detected: "${detected.mime}". Only PDF, PNG, JPG, and WEBP documents are permitted.`
      );
    }

    const declaredExt = path.extname(options.declaredFilename).toLowerCase().replace('.', '');
    const allowedExtsForDetected = ALLOWED_MIME_TYPES.get(detected.mime) || [];
    const normalizedDeclared = declaredExt === 'jpeg' ? 'jpg' : declaredExt;
    const normalizedDetected = detected.ext === 'jpeg' ? 'jpg' : detected.ext;

    if (!allowedExtsForDetected.includes(declaredExt) && normalizedDeclared !== normalizedDetected) {
      throw new FileSecurityValidationError(
        `Fake extension detected: File is named with extension ".${declaredExt || 'none'}", but byte inspection proves content is "${detected.mime}" (.${detected.ext}). Spoofed file extensions are blocked.`
      );
    }

    let sanitizedBuffer: Buffer = buffer;
    let width: number | undefined;
    let height: number | undefined;
    let pages: number | undefined;

    // 3. Image Integrity & Sanitization via Sharp
    if (detected.mime.startsWith('image/')) {
      try {
        const image = sharp(buffer);
        const meta = await image.metadata();

        if (!meta.width || !meta.height || meta.width <= 0 || meta.height <= 0) {
          throw new Error('Image dimensions are invalid or corrupted.');
        }

        if (meta.width > 12000 || meta.height > 12000) {
          throw new Error('Image dimensions exceed safe processing limits (12,000 x 12,000 px).');
        }

        width = meta.width;
        height = meta.height;

        // Re-encode image to strip EXIF injection payloads, trailing scripts, or malformed chunks
        if (detected.ext === 'png') {
          sanitizedBuffer = await sharp(buffer).png().toBuffer();
        } else if (detected.ext === 'webp') {
          sanitizedBuffer = await sharp(buffer).webp().toBuffer();
        } else {
          sanitizedBuffer = await sharp(buffer).jpeg({ quality: 92 }).toBuffer();
        }
      } catch (err: any) {
        throw new FileSecurityValidationError(
          `Image integrity check failed: ${err.message || 'Corrupted or unreadable image data.'}`
        );
      }
    }

    // 4. PDF Integrity & Structure Verification via PDF.js
    if (detected.mime === 'application/pdf') {
      try {
        const loadingTask = pdfjsLib.getDocument({
          data: new Uint8Array(buffer),
          useSystemFonts: true,
          disableFontFace: true,
        });
        const pdfDoc = await loadingTask.promise;
        if (!pdfDoc || pdfDoc.numPages < 1) {
          throw new Error('PDF document has zero valid pages.');
        }
        pages = pdfDoc.numPages;
        if (typeof pdfDoc.cleanup === 'function') {
          pdfDoc.cleanup();
        }
      } catch (err: any) {
        throw new FileSecurityValidationError(
          `PDF integrity check failed: ${err.message || 'Corrupted or malformed PDF structure.'}`
        );
      }
    }

    // 5. Malware Scanning via ClamAV
    let antivirusStatus: 'CLEAN' | 'SKIPPED_UNAVAILABLE' = 'SKIPPED_UNAVAILABLE';
    try {
      const clam = await this.getClamScanner();
      if (clam) {
        const stream = Readable.from(sanitizedBuffer);
        const scanResult = await clam.scanStream(stream);
        if (scanResult.isInfected) {
          const virusList = scanResult.viruses?.join(', ') || 'Threat detected';
          throw new FileSecurityValidationError(
            `Malware scan triggered: Malicious signature detected by ClamAV (${virusList}). Upload rejected.`,
            403
          );
        }
        antivirusStatus = 'CLEAN';
      } else if (config.clamav.strict) {
        throw new FileSecurityValidationError(
          'Strict security scanning is required.',
          503
        );
      }
    } catch (err: any) {
      if (err instanceof FileSecurityValidationError) {
        throw err;
      }
      if (config.clamav.strict) {
        throw new FileSecurityValidationError(
          `Antivirus scanner error: ${err.message}`,
          503
        );
      }
      console.warn(`[FileSecurity] ClamAV scan bypassed: ${err.message}`);
    }

    return {
      sanitizedBuffer,
      verifiedExt: detected.ext,
      verifiedMime: detected.mime,
      metadata: {
        originalSize: buffer.length,
        sanitizedSize: sanitizedBuffer.length,
        width,
        height,
        pages,
        antivirusStatus,
      },
    };
  }
}

export const fileSecurityService = new FileSecurityService();
