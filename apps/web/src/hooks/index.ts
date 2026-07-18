'use client';

import { useState, useCallback } from 'react';
import type { UploadFileType } from '@herafino/shared/storage/types';

export interface UseFileUploadOptions {
  fileType: UploadFileType;
  onSuccess?: (url: string) => void;
  onError?: (error: Error) => void;
}

export interface FileUploadState {
  uploading: boolean;
  progress: number;
  url: string | null;
  error: string | null;
}

export function useFileUpload({ fileType, onSuccess, onError }: UseFileUploadOptions): [
  FileUploadState,
  (file: File) => Promise<void>
] {
  const [state, setState] = useState<FileUploadState>({
    uploading: false,
    progress: 0,
    url: null,
    error: null,
  });

  const upload = useCallback(
    async (file: File) => {
      setState({ uploading: true, progress: 0, url: null, error: null });

      try {
        const presignedRes = await fetch('/api/upload/presigned', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fileType, contentType: file.type }),
        });

        if (!presignedRes.ok) {
          const err = await presignedRes.json().catch(() => ({}));
          throw new Error(err.error || `فشل رفع الملف (${presignedRes.status})`);
        }

        const { uploadUrl, fileUrl } = (await presignedRes.json()) as {
          uploadUrl: string;
          fileUrl: string;
        };

        const xhr = new XMLHttpRequest();
        const uploadPromise = new Promise<string>((resolve, reject) => {
          xhr.upload.addEventListener('progress', (event) => {
            if (event.lengthComputable) {
              const progress = Math.round((event.loaded / event.total) * 100);
              setState((prev) => ({ ...prev, progress }));
            }
          });

          xhr.addEventListener('load', () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              resolve(fileUrl);
            } else {
              let errorMessage = `Upload failed with status ${xhr.status}`;
              try {
                const error = JSON.parse(xhr.responseText);
                errorMessage = error.error || errorMessage;
              } catch {
                // ignore
              }
              reject(new Error(errorMessage));
            }
          });

          xhr.addEventListener('error', () => reject(new Error('Network error during upload')));
          xhr.addEventListener('abort', () => reject(new Error('Upload aborted')));

          xhr.open('PUT', uploadUrl);
          xhr.setRequestHeader('Content-Type', file.type);
          xhr.send(file);
        });

        const url = await uploadPromise;
        setState({ uploading: false, progress: 100, url, error: null });
        onSuccess?.(url);
        return;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Upload failed');
        setState({ uploading: false, progress: 0, url: null, error: error.message });
        onError?.(error);
      }
    },
    [fileType, onSuccess, onError]
  );

  return [state, upload];
}
