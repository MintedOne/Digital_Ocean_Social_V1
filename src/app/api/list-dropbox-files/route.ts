import { NextRequest, NextResponse } from 'next/server';
import { createDropboxIntegration } from '@/lib/dropbox/integration';

export async function GET(request: NextRequest) {
  try {
    console.log('📁 Listing files in Dropbox processed-videos folder...');
    
    // Create Dropbox integration instance
    const dropbox = createDropboxIntegration();
    
    // Test connection first
    const connectionResult = await dropbox.testConnection();
    if (!connectionResult.success) {
      throw new Error('Dropbox connection failed: ' + connectionResult.error);
    }
    
    // Use Dropbox API to list files in the processed-videos folder
    const dropboxApi = (dropbox as any).dbx; // Access the internal Dropbox instance
    
    try {
      const folderPath = '/AI Avatar/Digital_Ocean_Try/Digital_Ocean_Social_V1/processed-videos';
      const response = await dropboxApi.filesListFolder({
        path: folderPath,
        include_media_info: true
      });
      
      const files = response.result.entries.map((entry: any) => ({
        name: entry.name,
        size: entry.size ? `${(entry.size / 1024 / 1024).toFixed(1)} MB` : 'Unknown',
        path: entry.path_lower,
        modified: entry.server_modified
      }));
      
      console.log(`✅ Found ${files.length} files in Dropbox processed-videos folder`);
      
      return NextResponse.json({
        success: true,
        message: `Found ${files.length} files in Dropbox`,
        account: connectionResult.accountInfo?.name?.display_name,
        folder: folderPath,
        files: files,
        instructions: {
          location: 'These files are in your Dropbox at: ' + folderPath,
          sync: 'Files sync automatically when saved to server processed-videos directory',
          access: 'You can access these files through your Dropbox app or web interface'
        }
      });
      
    } catch (listError: any) {
      if (listError.error?.error?.['.tag'] === 'path_not_found') {
        return NextResponse.json({
          success: true,
          message: 'Processed videos folder not found in Dropbox',
          account: connectionResult.accountInfo?.name?.display_name,
          folder: '/AI Avatar/Digital_Ocean_Try/Digital_Ocean_Social_V1/processed-videos',
          files: [],
          note: 'The processed-videos folder will be created automatically when the first video is processed'
        });
      }
      throw listError;
    }
    
  } catch (error: any) {
    console.error('❌ Dropbox file listing failed:', error);
    
    return NextResponse.json({
      success: false,
      message: 'Dropbox file listing failed',
      error: error.message
    }, { status: 500 });
  }
}