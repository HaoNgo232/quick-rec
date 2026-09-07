export interface ClipRecord {
  id: number;
  filePath: string;
  thumbnailPath: string | null;
  durationMs: number;
  width: number;
  height: number;
  fileSizeBytes: number;
  createdAt: string;
}
