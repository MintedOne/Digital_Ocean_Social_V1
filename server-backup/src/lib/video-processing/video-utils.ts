// Video utility functions that don't require FFmpeg
// These can safely run on both client and server side

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export function validateVideoFile(file: File): { valid: boolean; error?: string } {
  console.log('🔍 Validating video file:', { 
    name: file.name, 
    size: file.size, 
    type: file.type 
  });
  
  // Check file type
  const allowedTypes = [
    'video/mp4', 
    'video/quicktime', 
    'video/x-msvideo',
    'video/webm',
    'video/ogg'
  ];
  
  if (!allowedTypes.includes(file.type)) {
    const error = `Unsupported video format: ${file.type}. Please use MP4, MOV, AVI, WebM, or OGG format.`;
    console.error('❌ Video validation failed:', error);
    return { valid: false, error };
  }
  
  // Check file size (1.5GB limit)
  const maxSizeBytes = 1.5 * 1024 * 1024 * 1024; // 1.5GB
  if (file.size > maxSizeBytes) {
    const error = `File size too large: ${formatFileSize(file.size)}. Maximum allowed: ${formatFileSize(maxSizeBytes)}`;
    console.error('❌ Video validation failed:', error);
    return { valid: false, error };
  }
  
  // Check minimum file size (1MB)
  const minSizeBytes = 1024 * 1024; // 1MB
  if (file.size < minSizeBytes) {
    const error = `File size too small: ${formatFileSize(file.size)}. Minimum required: ${formatFileSize(minSizeBytes)}`;
    console.error('❌ Video validation failed:', error);
    return { valid: false, error };
  }
  
  console.log('✅ Video validation passed');
  return { valid: true };
}