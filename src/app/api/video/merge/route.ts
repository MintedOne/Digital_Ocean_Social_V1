import { NextRequest, NextResponse } from 'next/server';
import { writeFile, unlink, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';
import { spawn } from 'child_process';
import { v4 as uuidv4 } from 'uuid';

const TEMP_DIR = join(process.cwd(), 'temp');
const MAX_FILE_SIZE = 1.5 * 1024 * 1024 * 1024; // 1.5GB

// Format file size for display
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Ensure temp directory exists
async function ensureTempDir() {
  if (!existsSync(TEMP_DIR)) {
    await mkdir(TEMP_DIR, { recursive: true });
  }
}

// Execute FFmpeg command with progress tracking
function executeFFmpeg(
  args: string[], 
  outputPath: string,
  onProgress?: (progress: { percent: number; outputSize: number; estimatedTotal: number }) => void
): Promise<{ success: boolean; error?: string }> {
  return new Promise((resolve) => {
    console.log('🎬 Executing FFmpeg:', 'ffmpeg', args.join(' '));
    
    const ffmpeg = spawn('ffmpeg', args);
    let errorOutput = '';

    ffmpeg.stderr.on('data', (data) => {
      const output = data.toString();
      console.log('FFmpeg output:', output);
      errorOutput += output;

      // Parse FFmpeg progress from stderr output
      if (onProgress && output.includes('frame=')) {
        try {
          // Check current output file size during processing
          if (existsSync(outputPath)) {
            const stats = require('fs').statSync(outputPath);
            const currentSize = stats.size;
            
            // Extract time progress from FFmpeg output
            const timeMatch = output.match(/time=(\d{2}):(\d{2}):(\d{2}\.?\d*)/);
            if (timeMatch) {
              const hours = parseInt(timeMatch[1]);
              const minutes = parseInt(timeMatch[2]);
              const seconds = parseFloat(timeMatch[3]);
              const currentTimeSeconds = hours * 3600 + minutes * 60 + seconds;
              
              // Estimate total duration (rough estimation based on typical video lengths)
              const estimatedTotalSeconds = 120; // Assume ~2 minutes average
              const progressPercent = Math.min(95, (currentTimeSeconds / estimatedTotalSeconds) * 100);
              
              // Estimate final file size based on current progress
              const estimatedTotalSize = currentSize > 0 ? (currentSize / (progressPercent / 100)) : 0;
              
              onProgress({
                percent: Math.round(progressPercent),
                outputSize: currentSize,
                estimatedTotal: Math.round(estimatedTotalSize)
              });
            }
          }
        } catch (error) {
          // Ignore progress parsing errors
        }
      }
    });

    ffmpeg.on('close', (code) => {
      if (code === 0) {
        console.log('✅ FFmpeg completed successfully');
        // Final progress update
        if (onProgress && existsSync(outputPath)) {
          const stats = require('fs').statSync(outputPath);
          onProgress({
            percent: 100,
            outputSize: stats.size,
            estimatedTotal: stats.size
          });
        }
        resolve({ success: true });
      } else {
        console.error('❌ FFmpeg failed with code:', code);
        resolve({ success: false, error: errorOutput });
      }
    });

    ffmpeg.on('error', (err) => {
      console.error('❌ FFmpeg spawn error:', err);
      resolve({ success: false, error: err.message });
    });
  });
}

// Clean up temporary files
async function cleanup(files: string[]) {
  for (const file of files) {
    try {
      await unlink(file);
      console.log('🧹 Cleaned up:', file);
    } catch (error) {
      console.log('⚠️ Cleanup warning:', file, error);
    }
  }
}

export async function POST(request: NextRequest) {
  const tempFiles: string[] = [];
  
  try {
    await ensureTempDir();
    
    console.log('📤 Processing video merge request...');
    
    // Parse the multipart form data
    const formData = await request.formData();
    const mainVideo = formData.get('mainVideo') as File;
    const outroVideo = formData.get('outroVideo') as File;
    
    if (!mainVideo || !outroVideo) {
      return NextResponse.json(
        { error: 'Both main video and outro video are required' },
        { status: 400 }
      );
    }

    // Validate file sizes
    if (mainVideo.size > MAX_FILE_SIZE || outroVideo.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB` },
        { status: 400 }
      );
    }

    console.log('📹 Main video:', { name: mainVideo.name, size: mainVideo.size });
    console.log('📹 Outro video:', { name: outroVideo.name, size: outroVideo.size });

    // Generate unique filenames
    const sessionId = uuidv4();
    const mainPath = join(TEMP_DIR, `main_${sessionId}.mp4`);
    const outroPath = join(TEMP_DIR, `outro_${sessionId}.mp4`);
    const outputPath = join(TEMP_DIR, `merged_${sessionId}.mp4`);
    
    tempFiles.push(mainPath, outroPath, outputPath);

    // Write uploaded files to disk
    console.log('💾 Writing main video to disk...');
    const mainBuffer = Buffer.from(await mainVideo.arrayBuffer());
    await writeFile(mainPath, mainBuffer);

    console.log('💾 Writing outro video to disk...');
    const outroBuffer = Buffer.from(await outroVideo.arrayBuffer());
    await writeFile(outroPath, outroBuffer);

    // Execute FFmpeg merge using concat filter with resolution matching
    console.log('⚡ Starting FFmpeg merge process...');
    
    // First, we need to ensure both videos have the same resolution
    // Scale the outro to match the main video's resolution
    const ffmpegArgs = [
      '-i', mainPath,
      '-i', outroPath,
      '-filter_complex', 
      // Scale second video to match first video's resolution, then concat
      '[1:v]scale2ref=oh*mdar:ih[1v][0v];[0v][0:a][1v][1:a]concat=n=2:v=1:a=1[outv][outa]',
      '-map', '[outv]',
      '-map', '[outa]',
      '-c:v', 'libx264',
      '-c:a', 'aac',
      '-preset', 'fast',
      '-crf', '23',  // Quality setting (lower = better quality, 23 is default)
      '-y', // Overwrite output file
      outputPath
    ];

    const result = await executeFFmpeg(ffmpegArgs, outputPath, (progress) => {
      console.log(`🔄 Merge progress: ${progress.percent}% - Output size: ${formatFileSize(progress.outputSize)} / ${formatFileSize(progress.estimatedTotal)}`);
    });

    if (!result.success) {
      throw new Error(`FFmpeg failed: ${result.error}`);
    }

    // Check if output file exists
    if (!existsSync(outputPath)) {
      throw new Error('Output file was not created');
    }

    console.log('📖 Reading merged video for download...');
    
    // Stream the file back to client
    const { createReadStream, statSync } = await import('fs');
    const stats = statSync(outputPath);
    const stream = createReadStream(outputPath);

    console.log('✅ Sending merged video to client:', stats.size, 'bytes');

    // Clean up input files immediately (keep output until after streaming)
    await cleanup([mainPath, outroPath]);

    // Create response with proper headers for video download
    const response = new NextResponse(stream as any, {
      status: 200,
      headers: {
        'Content-Type': 'video/mp4',
        'Content-Length': stats.size.toString(),
        'Content-Disposition': `attachment; filename="merged_${mainVideo.name}"`,
        'Cache-Control': 'no-cache',
      },
    });

    // Schedule cleanup of output file after a delay
    setTimeout(async () => {
      await cleanup([outputPath]);
    }, 5000); // 5 second delay to ensure download completes

    return response;

  } catch (error) {
    console.error('❌ Video merge error:', error);
    
    // Clean up all temp files on error
    await cleanup(tempFiles);
    
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        details: 'Server-side video processing failed'
      },
      { status: 500 }
    );
  }
}

export const runtime = 'nodejs';
export const maxDuration = 300; // 5 minutes timeout