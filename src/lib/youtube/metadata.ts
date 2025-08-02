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
  const section1Start = content.indexOf('📌 1. YOUTUBE TITLE');
  let title = 'Yacht Video';
  if (section1Start !== -1) {
    const section1Content = content.substring(section1Start);
    const nextSectionIndex = section1Content.indexOf('📌 2');
    const endIndex = nextSectionIndex !== -1 ? nextSectionIndex : section1Content.length;
    const section1Text = section1Content.substring(0, endIndex);
    // Extract the line after the heading
    const lines = section1Text.split(/\r?\n/);
    if (lines.length > 1) {
      title = lines[1].trim();
    }
  }
  console.log('📋 Title found:', title);

  // Clean up title - remove extra whitespace and newlines
  title = title.replace(/\s+/g, ' ').trim();

  // Remove emojis and special characters that might cause issues (keep safe characters)
  title = title.replace(/[^\w\s\-.,!?'"():&]/g, '').trim();

  // Truncate title to YouTube's 100 character limit
  if (title.length > 100) {
    title = title.substring(0, 97) + '...';
  }

  // Extract YOUTUBE DESCRIPTION (section 2) - Handle both \r\n and \n line endings
  const section2Start = content.indexOf('📌 2. YOUTUBE DESCRIPTION');
  let description = '';
  if (section2Start !== -1) {
    const section2Content = content.substring(section2Start);
    const nextSectionIndex = section2Content.indexOf('📌 3');
    const endIndex = nextSectionIndex !== -1 ? nextSectionIndex : section2Content.length;
    const section2Text = section2Content.substring(0, endIndex);
    // Extract everything after the heading
    const lines = section2Text.split(/\r?\n/);
    if (lines.length > 1) {
      // Join all lines after the heading, excluding the heading itself
      description = lines.slice(1).join('\n').trim();
    }
  }
  
  console.log('📋 Description found:', description ? 'YES' : 'NO');
  if (description) {
    console.log('📋 Description preview:', description.substring(0, 300));
  } else {
    // Show content around section 2 for debugging
    const section2Index = content.indexOf('📌 2');
    if (section2Index !== -1) {
      console.log('📋 Content around section 2:', content.substring(section2Index, section2Index + 500));
    }
  }

  // Extract tags from both Section 3 (YOUTUBE METADATA) and Section 4 (COMPETITIVE BUILDER TAG LIST)
  console.log('📋 Extracting tags from Phase 1 sections...');
  
  // Extract tags from Section 3: 📌 3. YOUTUBE METADATA - Look for "Tags:"
  // First find the section, then extract tags more carefully
  const section3Start = content.indexOf('📌 3. YOUTUBE METADATA');
  let section3Tags = '';
  if (section3Start !== -1) {
    const section3Content = content.substring(section3Start);
    const tagsMatch = section3Content.match(/Tags:\s*([^\r\n]+)/i);
    section3Tags = tagsMatch ? tagsMatch[1].trim() : '';
  }
  console.log('📋 Section 3 tags found:', section3Tags ? 'YES' : 'NO');
  if (section3Tags) {
    console.log('📋 Section 3 tags:', section3Tags.substring(0, 200));
  } else {
    // Debug: Show what's around Section 3
    const section3Index = content.indexOf('📌 3');
    if (section3Index !== -1) {
      console.log('📋 Section 3 area preview:', content.substring(section3Index, section3Index + 500));
    }
  }

  // Extract competitive builders from Section 4: 📌 4. COMPETITIVE BUILDER TAG LIST
  const section4Start = content.indexOf('📌 4. COMPETITIVE BUILDER TAG LIST');
  let section4Tags = '';
  if (section4Start !== -1) {
    const section4Content = content.substring(section4Start);
    const nextSectionIndex = section4Content.indexOf('📌 5');
    const endIndex = nextSectionIndex !== -1 ? nextSectionIndex : section4Content.length;
    const section4Text = section4Content.substring(0, endIndex);
    // Extract the line after the heading
    const lines = section4Text.split(/\r?\n/);
    if (lines.length > 1) {
      section4Tags = lines[1].trim();
    }
  }
  console.log('📋 Section 4 tags found:', section4Tags ? 'YES' : 'NO');
  if (section4Tags) {
    console.log('📋 Section 4 tags:', section4Tags.substring(0, 200));
  } else {
    // Debug: Show what's around Section 4
    const section4Index = content.indexOf('📌 4');
    if (section4Index !== -1) {
      console.log('📋 Section 4 area preview:', content.substring(section4Index, section4Index + 300));
    }
  }

  // Fallback: Look for standalone "TAGS:" for backward compatibility
  const fallbackTagsMatch = content.match(/TAGS:\s*(.+?)(?:\r?\n|$)/i);
  const fallbackTags = fallbackTagsMatch ? fallbackTagsMatch[1] : '';

  // Combine tags from both sections with priority: Section 3 first, then Section 4, then fallback
  const allRawTags = [section3Tags, section4Tags, fallbackTags]
    .filter(tagString => tagString.length > 0)
    .join(', ');

  console.log('📋 Combined raw tags:', allRawTags.substring(0, 300));
  console.log('📋 Raw tags length:', allRawTags.length);

  // Process and clean all tags
  let tags = allRawTags
    .split(/[,\n\r]+/) // Split by commas and line breaks
    .map(tag => tag.trim())
    .filter(tag => tag.length > 0 && tag.length <= 30) // YouTube tag limit is 30 chars per tag
    .filter((tag, index, arr) => arr.indexOf(tag.toLowerCase()) === arr.lastIndexOf(tag.toLowerCase())); // Remove duplicates (case insensitive)

  // Add strategic yacht industry tags to reach closer to 500 characters
  const additionalYachtTags = [
    'yacht tour', 'yacht walkthrough', 'yacht review', 'yacht specs',
    'yacht for sale', 'yacht charter', 'yacht broker', 'yacht buying guide',
    'luxury yacht', 'motor yacht', 'superyacht', 'yacht lifestyle',
    'yacht market', 'yacht brokerage', 'performance yacht', 'luxury cruiser',
    'yacht design', 'yacht interior', 'yacht technology', 'yacht features'
  ];
  
  // Add additional tags if we have space and they're not already included
  for (const additionalTag of additionalYachtTags) {
    const currentTagString = tags.join(', ');
    const potentialNewString = currentTagString + (currentTagString ? ', ' : '') + additionalTag;
    
    // Stop if we'd exceed 500 characters or 30 tags
    if (potentialNewString.length > 500 || tags.length >= 30) break;
    
    // Only add if not already included (case insensitive)
    if (!tags.some(tag => tag.toLowerCase().includes(additionalTag.toLowerCase()))) {
      tags.push(additionalTag);
    }
  }
  
  console.log('✅ Enhanced tag list with yacht industry tags');

  // Ensure total tag string doesn't exceed 500 characters (YouTube limit)
  let tagString = tags.join(', ');
  while (tagString.length > 500 && tags.length > 0) {
    tags.pop();
    tagString = tags.join(', ');
  }

  console.log('📋 Final processed tags:', {
    totalTags: tags.length,
    tagStringLength: tagString.length,
    charactersUsed: `${tagString.length}/500 (${Math.round((tagString.length/500)*100)}%)`,
    firstEightTags: tags.slice(0, 8),
    allTags: tagString
  });

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