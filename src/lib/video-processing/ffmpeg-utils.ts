import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

let ffmpeg: FFmpeg | null = null;

export async function initFFmpeg(onProgress?: (progress: number) => void): Promise<FFmpeg> {
  if (ffmpeg) return ffmpeg;
  
  ffmpeg = new FFmpeg();
  
  // Set up progress callback
  if (onProgress) {
    ffmpeg.on('progress', ({ progress }) => {
      onProgress(Math.round(progress * 100));
    });
  }
  
  // Load FFmpeg
  const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';
  
  await ffmpeg.load({
    coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
    wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
  });
  
  return ffmpeg;
}

export async function mergeVideoWithOutro(
  mainVideo: File,
  outroVideo: File,
  onProgress?: (progress: number) => void
): Promise<Blob> {
  const ffmpegInstance = await initFFmpeg(onProgress);
  
  // Write input files
  await ffmpegInstance.writeFile('main.mp4', await fetchFile(mainVideo));
  await ffmpegInstance.writeFile('outro.mp4', await fetchFile(outroVideo));
  
  // Create concat file list
  const concatList = 'file main.mp4\\nfile outro.mp4';
  await ffmpegInstance.writeFile('concat.txt', concatList);
  
  // Execute merge command
  await ffmpegInstance.exec([
    '-f', 'concat',
    '-safe', '0',
    '-i', 'concat.txt',
    '-c', 'copy',
    'merged.mp4'
  ]);
  
  // Read output file
  const mergedData = await ffmpegInstance.readFile('merged.mp4');
  
  // Clean up
  await ffmpegInstance.deleteFile('main.mp4');
  await ffmpegInstance.deleteFile('outro.mp4');
  await ffmpegInstance.deleteFile('concat.txt');
  await ffmpegInstance.deleteFile('merged.mp4');
  
  return new Blob([mergedData], { type: 'video/mp4' });
}

export async function applyVideoMetadata(
  video: File,
  metadata: {
    title: string;
    description: string;
    tags: string[];
  },
  onProgress?: (progress: number) => void
): Promise<Blob> {
  const ffmpegInstance = await initFFmpeg(onProgress);
  
  // Write input file
  await ffmpegInstance.writeFile('input.mp4', await fetchFile(video));
  
  // Prepare metadata arguments
  const metadataArgs = [
    '-i', 'input.mp4',
    '-metadata', `title=${metadata.title}`,
    '-metadata', `description=${metadata.description}`,
    '-metadata', `keywords=${metadata.tags.join(', ')}`,
    '-c', 'copy',
    'output.mp4'
  ];
  
  // Execute metadata application
  await ffmpegInstance.exec(metadataArgs);
  
  // Read output file
  const outputData = await ffmpegInstance.readFile('output.mp4');
  
  // Clean up
  await ffmpegInstance.deleteFile('input.mp4');
  await ffmpegInstance.deleteFile('output.mp4');
  
  return new Blob([outputData], { type: 'video/mp4' });
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function validateVideoFile(file: File): { valid: boolean; error?: string } {
  const validTypes = ['video/mp4', 'video/quicktime', 'video/x-msvideo'];
  const maxSize = 500 * 1024 * 1024; // 500MB
  
  if (!validTypes.includes(file.type)) {
    return { valid: false, error: 'Invalid file type. Please upload MP4, MOV, or AVI files.' };
  }
  
  if (file.size > maxSize) {
    return { valid: false, error: 'File too large. Maximum size is 500MB.' };
  }
  
  return { valid: true };
}