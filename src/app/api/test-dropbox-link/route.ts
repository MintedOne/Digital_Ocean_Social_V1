import { NextRequest, NextResponse } from 'next/server';
import { createDropboxIntegration } from '@/lib/dropbox/integration';

export async function GET(request: NextRequest) {
  try {
    console.log('🔗 Testing Dropbox link generation for recent video...');
    
    // Test with the latest video file on the server
    const testVideoPath = '/root/social-media-manager/processed-videos/MTI-482-Catamaran-Tour-65-MPH-Luxury-Powerhouse-Miami-to-Bahamas-in-2-Hours-KiGxaQb9i2s.mp4';
    
    // Create Dropbox integration instance
    const dropbox = createDropboxIntegration();
    
    // Generate share link
    const linkResult = await dropbox.generateShareLink(testVideoPath);
    
    if (linkResult.success) {
      console.log('✅ Dropbox link generated successfully');
      return NextResponse.json({
        success: true,
        message: 'Dropbox share link generated',
        video: {
          filename: 'MTI-482-Catamaran-Tour-65-MPH-Luxury-Powerhouse-Miami-to-Bahamas-in-2-Hours-KiGxaQb9i2s.mp4',
          size: '62.7 MB',
          serverPath: testVideoPath,
          dropboxPath: linkResult.dropboxPath
        },
        dropboxLink: {
          shareUrl: linkResult.shareUrl,
          directUrl: linkResult.directUrl,
          method: linkResult.method
        },
        instructions: {
          whereToFind: 'In your Dropbox: /AI Avatar/Digital_Ocean_Try/Digital_Ocean_Social_V1/processed-videos/',
          autoDownload: 'The directUrl has ?dl=1 which makes it auto-download for Metricool',
          testInBrowser: 'Try the directUrl in your browser - it should auto-download the video'
        }
      });
    } else {
      console.error('❌ Dropbox link generation failed:', linkResult.error);
      return NextResponse.json({
        success: false,
        message: 'Dropbox link generation failed',
        error: linkResult.error,
        video: {
          filename: 'MTI-482-Catamaran-Tour-65-MPH-Luxury-Powerhouse-Miami-to-Bahamas-in-2-Hours-KiGxaQb9i2s.mp4',
          serverPath: testVideoPath
        }
      }, { status: 500 });
    }
    
  } catch (error: any) {
    console.error('❌ Dropbox link test failed:', error);
    
    return NextResponse.json({
      success: false,
      message: 'Dropbox link test failed',
      error: error.message
    }, { status: 500 });
  }
}