import { NextRequest, NextResponse } from 'next/server';
import { unlink } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';

const TEMP_DIR = join(process.cwd(), 'temp');

// Clean up old temporary files (older than 1 hour)
async function cleanupOldTempFiles() {
  const { readdir, stat } = await import('fs/promises');
  
  try {
    if (!existsSync(TEMP_DIR)) {
      console.log('Temp directory does not exist, nothing to clean up');
      return;
    }
    
    const files = await readdir(TEMP_DIR);
    const oneHourAgo = Date.now() - (60 * 60 * 1000); // 1 hour ago
    const cleanupPromises: Promise<void>[] = [];
    let cleanedCount = 0;
    
    for (const file of files) {
      const filePath = join(TEMP_DIR, file);
      
      try {
        const stats = await stat(filePath);
        if (stats.mtime.getTime() < oneHourAgo) {
          cleanupPromises.push(
            unlink(filePath).then(() => {
              cleanedCount++;
              console.log(`🗑️ Deleted old temp file: ${file}`);
            }).catch(err => {
              console.warn(`Failed to delete ${file}:`, err);
            })
          );
        }
      } catch (err) {
        console.warn(`Failed to check file stats for ${file}:`, err);
      }
    }
    
    await Promise.all(cleanupPromises);
    console.log(`✅ Cleaned up ${cleanedCount} old temporary files`);
  } catch (error) {
    console.warn('Failed to clean up temporary files:', error);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('id');
    
    if (!projectId) {
      return NextResponse.json(
        { success: false, error: 'Project ID is required' },
        { status: 400 }
      );
    }
    
    console.log(`🗑️ Project deleted, running cleanup of old temporary files`);
    
    // Clean up old temporary files (opportunistic cleanup)
    await cleanupOldTempFiles();
    
    return NextResponse.json({
      success: true,
      message: 'Project deleted successfully'
    });
    
  } catch (error) {
    console.error('❌ Failed to delete project:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete project' },
      { status: 500 }
    );
  }
}