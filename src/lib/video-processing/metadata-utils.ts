export interface YouTubeMetadata {
  title: string;
  description: string;
  tags: string[];
  filename: string;
  comments: string;
  competitors: string[];
  thumbnailTitles: string[];
}

export function parseYouTubeMetadata(content: string): YouTubeMetadata {
  const sections = content.split('📌');
  let title = '';
  let description = '';
  let tags: string[] = [];
  let filename = '';
  let comments = '';
  let competitors: string[] = [];
  let thumbnailTitles: string[] = [];

  sections.forEach(section => {
    const trimmed = section.trim();
    
    if (trimmed.startsWith('1. YOUTUBE TITLE')) {
      const titleMatch = trimmed.match(/YOUTUBE TITLE\s*\n(.+?)(?:\n|$)/);
      if (titleMatch) title = titleMatch[1].trim();
    }
    
    if (trimmed.startsWith('2. YOUTUBE DESCRIPTION')) {
      const descMatch = trimmed.match(/YOUTUBE DESCRIPTION\s*\n([\s\S]+?)(?=📌|$)/);
      if (descMatch) description = descMatch[1].trim();
    }
    
    if (trimmed.startsWith('3. YOUTUBE METADATA')) {
      const tagsMatch = trimmed.match(/Tags \(Comma-Separated\):[^\n]*\n(.+?)(?:\n|$)/);
      if (tagsMatch) {
        tags = tagsMatch[1].split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
      }
      
      const filenameMatch = trimmed.match(/File Name[^\n]*:\s*(.+?)(?:\n|$)/);
      if (filenameMatch) filename = filenameMatch[1].trim();
      
      const commentsMatch = trimmed.match(/Comments[^\n]*:\s*(.+?)(?:\n|$)/);
      if (commentsMatch) comments = commentsMatch[1].trim();
    }
    
    if (trimmed.startsWith('4. COMPETITIVE BUILDER TAG LIST')) {
      const compMatch = trimmed.match(/COMPETITIVE BUILDER TAG LIST\s*\n(.+?)(?=📌|$)/s);
      if (compMatch) {
        competitors = compMatch[1].split(',').map(comp => comp.trim()).filter(comp => comp.length > 0);
      }
    }
    
    if (trimmed.startsWith('5. YOUTUBE THUMBNAIL TITLES LIST')) {
      const thumbMatch = trimmed.match(/YOUTUBE THUMBNAIL TITLES LIST\s*\n([\s\S]+?)(?=📌|$)/);
      if (thumbMatch) {
        const lines = thumbMatch[1].split('\n');
        thumbnailTitles = lines
          .map(line => line.replace(/^\d+\.\s*/, '').trim())
          .filter(title => title.length > 0);
      }
    }
  });

  return {
    title,
    description,
    tags,
    filename,
    comments,
    competitors,
    thumbnailTitles
  };
}

export function generateOptimizedTags(
  primaryTags: string[],
  competitors: string[],
  maxLength: number = 500
): string[] {
  const defaultTags = [
    'yacht tour', 'luxury yacht', 'yacht for sale', 'yacht specs', 
    'yacht review', 'superyacht', 'motor yacht', 'yacht broker'
  ];
  
  const allTags: string[] = [];
  let currentLength = 0;
  
  // Helper function to add tags if they fit
  const addTagsIfFit = (tagArray: string[]) => {
    for (const tag of tagArray) {
      const tagLength = tag.length + (allTags.length > 0 ? 2 : 0); // +2 for ", "
      if (currentLength + tagLength <= maxLength) {
        allTags.push(tag);
        currentLength += tagLength;
      } else {
        break;
      }
    }
  };
  
  // Add tags in priority order
  addTagsIfFit(primaryTags);
  addTagsIfFit(competitors);
  addTagsIfFit(defaultTags);
  
  return allTags;
}

export function extractVideoTitle(youtubeContent: string, manufacturer: string, model: string): string {
  const metadata = parseYouTubeMetadata(youtubeContent);
  return metadata.title || `${manufacturer} ${model} Yacht Tour`;
}

export function extractVideoDescription(youtubeContent: string): string {
  const metadata = parseYouTubeMetadata(youtubeContent);
  return metadata.description || 'Professional yacht tour and review.';
}

export function calculateTagsLength(tags: string[]): number {
  return tags.join(', ').length;
}

export function validateTagsLength(tags: string[], maxLength: number = 500): boolean {
  return calculateTagsLength(tags) <= maxLength;
}