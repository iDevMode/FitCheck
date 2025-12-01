export interface ImageAsset {
  uri: string;
  base64: string; // Raw base64 data without prefix for API
  mimeType: string;
}

export enum ProcessingStatus {
  IDLE = 'IDLE',
  UPLOADING = 'UPLOADING',
  GENERATING = 'GENERATING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR',
}

export interface GeneratedResult {
  imageUrl: string;
  timestamp: number;
}
