export type PresignedUrl = {
  url: string;
  method: 'PUT' | 'GET';
  expiresInSeconds: number;
  headers?: Record<string, string>;
};

export interface ObjectStoragePort {
  createUploadUrl(input: {
    objectKey: string;
    contentType: string;
    expiresInSeconds: number;
  }): Promise<PresignedUrl>;
  createDownloadUrl(input: {
    objectKey: string;
    expiresInSeconds: number;
  }): Promise<PresignedUrl>;
  readTextObject(objectKey: string): Promise<string>;
}
