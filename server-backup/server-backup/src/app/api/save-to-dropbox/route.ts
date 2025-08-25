import { writeFile } from 'fs/promises';
import { join } from 'path';

export async function POST(req: Request) {
  try {
    const { content, filename, folder } = await req.json();
    
    console.log('💾 Saving file to Dropbox:', filename);
    
    if (!content || !filename || !folder) {
      return new Response('Missing required parameters', { status: 400 });
    }
    
    // Construct full file path
    const fullPath = join(folder, filename);
    
    // Write file to Dropbox folder
    await writeFile(fullPath, content, 'utf8');
    
    console.log('✅ File saved successfully:', fullPath);
    
    return Response.json({
      success: true,
      path: fullPath,
      filename
    });
  } catch (error) {
    console.error('❌ Save to Dropbox error:', error);
    return new Response('Failed to save file', { status: 500 });
  }
}