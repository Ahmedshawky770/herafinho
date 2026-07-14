export type UploadFileType = 'id_card' | 'transport_photo' | 'face_photo' | 'avatar';
export type StorageFile = {
  url: string;
  key: string;
  type: UploadFileType;
};