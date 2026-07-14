export interface IStorageService {
  upload(file: Buffer, key: string, contentType: string): Promise<string>;
  delete(key: string): Promise<void>;
  getUploadUrl(key: string, contentType: string): Promise<string>;
}