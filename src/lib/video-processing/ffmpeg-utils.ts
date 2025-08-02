import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

let ffmpeg: FFmpeg | null = null;

export async function initFFmpeg(onProgress?: (progress: number) => void): Promise<FFmpeg> {
  try {
    console.log('🎬 Initializing FFmpeg...');
    
    if (ffmpeg) {
      console.log('✅ FFmpeg already initialized');
      return ffmpeg;
    }
    
    ffmpeg = new FFmpeg();
    console.log('📦 FFmpeg instance created');
    
    // Set up progress callback
    if (onProgress) {
      ffmpeg.on('progress', ({ progress }) => {
        const percent = Math.round(progress * 100);
        console.log(`🔄 FFmpeg progress: ${percent}%`);
        onProgress(percent);
      });
    }
    
    // Load FFmpeg
    const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';
    console.log(`🌐 Loading FFmpeg from: ${baseURL}`);
    
    const coreURL = await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript');
    const wasmURL = await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm');
    
    console.log('📂 Loading FFmpeg core and WASM files...');
    await ffmpeg.load({
      coreURL,
      wasmURL,
    });
    
    console.log('✅ FFmpeg loaded successfully!');
    return ffmpeg;
  } catch (error) {
    console.error('❌ FFmpeg initialization failed:', error);
    throw new Error(`FFmpeg initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function mergeVideoWithOutro(
  mainVideo: File,
  outroVideo: File,
  onProgress?: (progress: number) => void
): Promise<Blob> {
  try {
    console.log('🎬 Starting video merge process...');
    console.log('📹 Main video:', { name: mainVideo.name, size: mainVideo.size, type: mainVideo.type });
    console.log('📹 Outro video:', { name: outroVideo.name, size: outroVideo.size, type: outroVideo.type });
    
    const ffmpegInstance = await initFFmpeg(onProgress);
    
    // Write input files
    console.log('📝 Writing main video to FFmpeg filesystem...');
    await ffmpegInstance.writeFile('main.mp4', await fetchFile(mainVideo));
    
    console.log('📝 Writing outro video to FFmpeg filesystem...');
    await ffmpegInstance.writeFile('outro.mp4', await fetchFile(outroVideo));
    
    // Use concat filter for reliable video+audio merging
    console.log('⚡ Using concat filter for proper video+audio merge...');
    
    // Method 1: Try concat filter with copy codecs (fastest reliable method)
    try {
      await ffmpegInstance.exec([
        '-i', 'main.mp4',
        '-i', 'outro.mp4',
        '-filter_complex', '[0:v][0:a][1:v][1:a]concat=n=2:v=1:a=1[outv][outa]',
        '-map', '[outv]',
        '-map', '[outa]',
        '-c:v', 'copy',
        '-c:a', 'copy',
        'merged.mp4'
      ]);
      
      console.log('✅ Concat filter with copy codecs successful!');
    } catch (error) {
      console.log('⚠️ Copy codecs failed, using compatible re-encoding...');
      
      // Clean up failed attempt
      try {
        await ffmpegInstance.deleteFile('merged.mp4');
      } catch {}
      
      // Method 2: Re-encode with compatible settings (slower but reliable)
      await ffmpegInstance.exec([
        '-i', 'main.mp4',
        '-i', 'outro.mp4',
        '-filter_complex', '[0:v][0:a][1:v][1:a]concat=n=2:v=1:a=1[outv][outa]',
        '-map', '[outv]',
        '-map', '[outa]',
        '-c:v', 'libx264',
        '-c:a', 'aac',
        '-preset', 'ultrafast',
        '-crf', '23',
        'merged.mp4'
      ]);
      
      console.log('✅ Re-encoding merge successful!');
    }
    
    console.log('📖 Reading merged video output...');
    
    // Check if the file exists and get its info
    try {
      const fileList = await ffmpegInstance.listDir('/');
      console.log('📁 FFmpeg filesystem contents:', fileList.length, 'files');
      console.log('📋 File names:', fileList.map(f => f.name));
      
      // Find the merged file info
      const mergedFileInfo = fileList.find(file => file.name === 'merged.mp4');
      if (!mergedFileInfo) {
        console.error('❌ merged.mp4 not found. Available files:', fileList.map(f => f.name));
        throw new Error('Merged video file not found in filesystem');
      }
      
      console.log('📊 Merged video info:', { 
        name: mergedFileInfo.name
      });
      
      // For very large files, we need to try a different approach
      const estimatedSize = (mainVideo.size + outroVideo.size) * 1.1; // Estimate with 10% overhead
      
      if (estimatedSize > 300 * 1024 * 1024) { // > 300MB
        console.log('⚠️ File too large for browser memory, trying alternative approach...');
        
        // Try to create a smaller test file to verify the process worked
        await ffmpegInstance.exec([
          '-i', 'merged.mp4',
          '-t', '5', // Just first 5 seconds
          '-c', 'copy',
          'test_output.mp4'
        ]);
        
        console.log('✅ Video merge verification successful!');
        
        // Clean up
        console.log('🧹 Cleaning up temporary files...');
        await ffmpegInstance.deleteFile('main.mp4');
        await ffmpegInstance.deleteFile('outro.mp4');
        await ffmpegInstance.deleteFile('test_output.mp4');
        
        // For large files, we provide a clear error message
        throw new Error(`File too large for browser processing (${formatFileSize(estimatedSize)}). Please use smaller video files (under 300MB combined).`);
        
      } else {
        // Try to read the file normally for smaller files
        const mergedData = await ffmpegInstance.readFile('merged.mp4');
        console.log('📊 Successfully read merged video:', mergedData.length, 'bytes');
        
        // Clean up
        console.log('🧹 Cleaning up temporary files...');
        await ffmpegInstance.deleteFile('main.mp4');
        await ffmpegInstance.deleteFile('outro.mp4');
        await ffmpegInstance.deleteFile('merged.mp4');
        
        console.log('✅ Video merge completed successfully!');
        return new Blob([mergedData], { type: 'video/mp4' });
      }
      
    } catch (readError) {
      console.error('❌ Failed to read merged video file:', readError);
      
      // Clean up files even if read failed
      try {
        console.log('🧹 Cleaning up temporary files after error...');
        await ffmpegInstance.deleteFile('main.mp4');
        await ffmpegInstance.deleteFile('outro.mp4');
        await ffmpegInstance.deleteFile('merged.mp4');
      } catch (cleanupError) {
        console.log('⚠️ Cleanup error (non-critical):', cleanupError);
      }
      
      throw new Error(`Cannot process video: File too large for browser memory (${formatFileSize((mainVideo.size + outroVideo.size))}). Please use smaller video files.`);
    }
  } catch (error) {
    console.error('❌ Video merge failed:', error);
    throw new Error(`Video merge failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
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