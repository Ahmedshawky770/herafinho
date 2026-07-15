import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@aws-sdk/client-s3', () => ({
  S3Client: vi.fn(() => ({ send: vi.fn().mockResolvedValue({}) })),
  PutObjectCommand: vi.fn(),
  DeleteObjectCommand: vi.fn(),
}));
vi.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: vi.fn().mockResolvedValue('https://cdn.example/signed'),
}));

import { StorageService } from '@/lib/storage/storage-service';

describe('StorageService', () => {
  beforeEach(() => {
    process.env.AWS_CDN_URL = 'https://cdn.example';
  });

  it('upload returns the CDN url for the stored key', async () => {
    const svc = new StorageService();
    const url = await svc.upload(Buffer.from('file'), 'avatars/1.png', 'image/png');
    expect(url).toBe('https://cdn.example/avatars/1.png');
  });

  it('delete resolves without throwing', async () => {
    const svc = new StorageService();
    await expect(svc.delete('avatars/1.png')).resolves.toBeUndefined();
  });

  it('getUploadUrl returns a signed url', async () => {
    const svc = new StorageService();
    const url = await svc.getUploadUrl('avatars/2.png', 'image/png');
    expect(url).toBe('https://cdn.example/signed');
  });
});
