/**
 * YouTube Metadata Extraction Utilities
 * Handles Phase 1 generated content format and YouTube API limits
 */

export interface YouTubeMetadata {
  title: string;
  description: string;
  tags: string[];
}

export interface YouTubeUploadOptions {
  title: string;
  description: string;
  tags: string[];
  privacyStatus: 'private' | 'unlisted' | 'public';
  categoryId: string;
  playlistName?: string;
  thumbnailPath?: string;
}

/**
 * Extract metadata from Phase 1 generated content
 * Handles the exact format from the working Mac system
 */
export function extractMetadataFromContent(content: string): YouTubeMetadata {
  console.log('📋 Extracting metadata from Phase 1 content...');
  console.log('📋 Content preview:', content.substring(0, 500) + '...');

  // Extract YOUTUBE TITLE (section 1) - LIMIT 100 CHARACTERS - Handle both \r\n and \n line endings
  const youtubeTitleMatch = content.match(/📌\s*1\.\s*YOUTUBE\s+TITLE[:\s]*\r?\n(.*?)(?=\r?\n\r?\n|📌|$)/is);
  console.log('📋 Title match:', youtubeTitleMatch);
  let title = youtubeTitleMatch ? youtubeTitleMatch[1].trim() : 'Yacht Video';

  // Clean up title - remove extra whitespace and newlines
  title = title.replace(/\s+/g, ' ').trim();

  // Remove emojis and special characters that might cause issues (keep safe characters)
  title = title.replace(/[^\w\s\-.,!?'"():&]/g, '').trim();

  // Truncate title to YouTube's 100 character limit
  if (title.length > 100) {
    title = title.substring(0, 97) + '...';
  }

  // Extract YOUTUBE DESCRIPTION (section 2) - Handle both \r\n and \n line endings
  const youtubeDescMatch = content.match(/📌\s*2\.\s*YOUTUBE\s+DESCRIPTION[:\s]*\r?\n(.*?)(?=📌|$)/is);
  console.log('📋 Description match:', youtubeDescMatch ? 'FOUND' : 'NOT FOUND');
  if (youtubeDescMatch) {
    console.log('📋 Description raw match:', youtubeDescMatch[1].substring(0, 300));
  } else {
    // Let's also try some alternative patterns to debug
    const altMatch1 = content.match(/📌.*2.*DESCRIPTION.*?\n(.*?)(?=📌|$)/is);
    const altMatch2 = content.match(/YOUTUBE\s+DESCRIPTION[:\s]*([^📌]*?)(?=📌|$)/i);
    console.log('📋 Alt pattern 1 match:', altMatch1 ? 'FOUND' : 'NOT FOUND');
    console.log('📋 Alt pattern 2 match:', altMatch2 ? 'FOUND' : 'NOT FOUND');
    
    // Show content around section 2
    const section2Index = content.indexOf('📌 2');
    if (section2Index !== -1) {
      console.log('📋 Content around section 2:', content.substring(section2Index, section2Index + 500));
    }
  }
  const description = youtubeDescMatch ? youtubeDescMatch[1].trim() : '';

  // Extract tags (after "TAGS:") - LIMIT 500 CHARACTERS TOTAL - Handle both \r\n and \n line endings
  const tagsMatch = content.match(/TAGS:\s*(.+?)(?:\r?\n|$)/i);
  const rawTags = tagsMatch ? tagsMatch[1] : '';

  // Clean and process tags
  let tags = rawTags
    .split(',')
    .map(tag => tag.trim())
    .map(tag => tag.replace(/[^\w\s-]/g, '')) // Remove special characters except hyphens
    .filter(tag => tag.length > 0 && tag.length <= 30) // YouTube tag limit is 30 chars
    .filter((tag, index, arr) => arr.indexOf(tag) === index); // Remove duplicates

  // Ensure total tag string doesn't exceed 500 characters (including commas)
  let tagString = tags.join(', ');
  while (tagString.length > 500 && tags.length > 0) {
    tags.pop();
    tagString = tags.join(', ');
  }

  console.log('✅ Metadata extracted:', {
    titleLength: title.length,
    descriptionLength: description.length,
    tagCount: tags.length,
    tagStringLength: tagString.length
  });

  return { title, description, tags };
}

/**
 * Create YouTube upload options from metadata with defaults
 */
export function createUploadOptions(
  metadata: YouTubeMetadata,
  options: Partial<YouTubeUploadOptions> = {}
): YouTubeUploadOptions {
  return {
    title: metadata.title,
    description: metadata.description,
    tags: metadata.tags,
    privacyStatus: options.privacyStatus || 'unlisted', // Default to unlisted
    categoryId: options.categoryId || '2', // Autos & Vehicles category
    playlistName: options.playlistName || 'YachtSpecsDirect.com',
    thumbnailPath: options.thumbnailPath
  };
}

/**
 * Validate metadata against YouTube limits
 */
export function validateMetadata(metadata: YouTubeMetadata): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Title validation
  if (!metadata.title || metadata.title.length === 0) {
    errors.push('Title is required');
  } else if (metadata.title.length > 100) {
    errors.push('Title exceeds 100 character limit');
  }

  // Description validation
  if (metadata.description.length > 5000) {
    errors.push('Description exceeds 5000 character limit');
  }

  // Tags validation
  const tagString = metadata.tags.join(', ');
  if (tagString.length > 500) {
    errors.push('Tags exceed 500 character limit');
  }

  // Individual tag validation
  const invalidTags = metadata.tags.filter(tag => tag.length > 30);
  if (invalidTags.length > 0) {
    errors.push(`Tags exceed 30 character limit: ${invalidTags.join(', ')}`);
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Extract metadata from Phase 1 files (script + metadata)
 * Handles both combined and separate file formats
 */
export function extractMetadataFromFiles(
  scriptContent?: string,
  metadataContent?: string
): YouTubeMetadata {
  // If we have separate metadata content, use that
  if (metadataContent) {
    return extractMetadataFromContent(metadataContent);
  }

  // Otherwise, try to extract from script content
  if (scriptContent) {
    return extractMetadataFromContent(scriptContent);
  }

  // Fallback to empty metadata
  console.warn('⚠️ No content provided for metadata extraction');
  return {
    title: 'Yacht Video',
    description: '',
    tags: ['yacht', 'boat', 'luxury']
  };
}

/**
 * Optimize tags for YouTube SEO
 * Adds common yacht-related tags if not present
 */
export function optimizeTagsForYouTube(tags: string[], manufacturer?: string, model?: string): string[] {
  const commonYachtTags = [
    'yacht', 'boat', 'luxury yacht', 'motor yacht', 'yachts for sale',
    'yacht tour', 'yacht review', 'boating', 'marine', 'yacht life'
  ];

  // Start with existing tags
  let optimizedTags = [...tags];

  // Add manufacturer and model if provided
  if (manufacturer) {
    optimizedTags.unshift(manufacturer.toLowerCase());
  }
  if (model) {
    optimizedTags.unshift(`${manufacturer} ${model}`.toLowerCase());
  }

  // Add common tags if space allows
  for (const commonTag of commonYachtTags) {
    if (optimizedTags.length >= 30) break; // YouTube allows max 30 tags
    
    if (!optimizedTags.some(tag => tag.toLowerCase().includes(commonTag.toLowerCase()))) {
      optimizedTags.push(commonTag);
    }
  }

  // Ensure we don't exceed 500 character limit
  let tagString = optimizedTags.join(', ');
  while (tagString.length > 500 && optimizedTags.length > 0) {
    optimizedTags.pop();
    tagString = optimizedTags.join(', ');
  }

  return optimizedTags.slice(0, 30); // YouTube max 30 tags
}

/**
 * Format description for YouTube with proper structure
 */
export function formatDescriptionForYouTube(description: string, additionalInfo?: string): string {
  let formattedDescription = description;

  // Add additional info if provided
  if (additionalInfo) {
    formattedDescription += '\n\n' + additionalInfo;
  }

  // Add standard footer
  const footer = `

🛥️ More Yacht Reviews & Specs: https://YachtSpecsDirect.com
📧 Contact us for yacht consultation and purchasing guidance

#Yacht #LuxuryYacht #YachtLife #Boating #YachtReview`;

  // Ensure we don't exceed YouTube's 5000 character limit
  const maxDescriptionLength = 5000 - footer.length;
  if (formattedDescription.length > maxDescriptionLength) {
    formattedDescription = formattedDescription.substring(0, maxDescriptionLength - 3) + '...';
  }

  return formattedDescription + footer;
}