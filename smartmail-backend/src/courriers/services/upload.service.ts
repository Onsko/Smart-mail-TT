import { Injectable } from '@nestjs/common';
import * as multer from 'multer';
import * as path from 'path';
import * as fs from 'fs';

@Injectable()
export class UploadService {
  private uploadDir: string;
  private uploadBaseUrl: string;

  constructor() {
    this.uploadDir = path.join(process.cwd(), 'uploads', 'documents');
    this.uploadBaseUrl = process.env.UPLOAD_BASE_URL || 'http://localhost:3000';
    fs.mkdirSync(this.uploadDir, { recursive: true });
  }

  getMulterOptions(): multer.Options {
    return {
      storage: multer.diskStorage({
        destination: (_req, _file, cb) => {
          cb(null, this.uploadDir);
        },
        filename: (_req, file, cb) => {
          const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
          const ext = path.extname(file.originalname);
          cb(null, `${unique}${ext}`);
        },
      }),
      fileFilter: (_req, file, cb) => {
        const allowed = /pdf|image\/(png|jpeg|jpg|webp|gif)/;
        if (allowed.test(file.mimetype)) {
          (cb as unknown as (err: null, accept: boolean) => void)(null, true);
        } else {
          (cb as unknown as (err: Error, accept: boolean) => void)(new Error('Type de fichier non autorisé'), false);
        }
      },
      limits: { fileSize: 10 * 1024 * 1024 },
    };
  }

  buildUrl(filename: string): string {
    return `${this.uploadBaseUrl}/uploads/documents/${filename}`;
  }

  getRelativePath(filename: string): string {
    return path.join(this.uploadDir, filename);
  }
}
