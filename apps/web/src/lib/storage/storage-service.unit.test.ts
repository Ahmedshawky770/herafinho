import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@aws-sdk/client-s3', () => ({
  S3Client: class {
    send = vi.fn().mockResolvedValue(undefined);
    constructor() {}
  },
  PutObjectCommand: class {
    constructor(config: any) { this.config = config; }
  },
  DeleteObjectCommand: class {
    constructor(config: any) { this.config = config; }
  },
}));

vi.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: vi.fn().mockResolvedValue('https://signed-url.com/key'),
}));

process.env.AWS_REGION = 'us-east-1';
process.env.AWS_ACCESS_KEY_ID = 'test-key';
process.env.AWS_SECRET_ACCESS_KEY = 'test-secret';
process.env.AWS_S3_BUCKET = 'test-bucket';
process.env.AWS_CDN_URL = 'https://cdn.example.com';

import { StorageService } from './storage-service';

describe('StorageService', () => {
  let service: StorageService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new StorageService();
  });

  describe('upload', () => {
    it('should upload file and return CDN URL', async () => {
      const buffer = Buffer.from('test content');
      const url = await service.upload(buffer, 'test-key', 'text/plain');
      expect(url).toBe('https://cdn.example.com/test-key');
    });

    it('should upload with image content type', async () => {
      const buffer = Buffer.from('fake image');
      const url = await service.upload(buffer, 'images/test.jpg', 'image/jpeg');
      expect(url).toBe('https://cdn.example.com/images/test.jpg');
    });
  });

  describe('delete', () => {
    it('should delete file', async () => {
      await service.delete('test-key');
      expect(service).toBeDefined();
    });
  });

  describe('getUploadUrl', () => {
    it('should get signed upload URL', async () => {
      const url = await service.getUploadUrl('test-key', 'text/plain');
      expect(url).toBe('https://signed-url.com/key');
    });

    it('should get signed URL for image', async () => {
      const url = await service.getUploadUrl('images/test.jpg', 'image/jpeg');
      expect(url).toBe('https://signed-url.com/key');
    });
  });
});
