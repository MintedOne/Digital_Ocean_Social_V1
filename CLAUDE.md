# Claude Code Project Guide - AI Avatar Yacht Project

## 🤖 IMPORTANT: Claude Code Instructions

**This file must be updated after any major changes, feature completions, or architectural modifications.**

## Quick Project Overview

This is a Next.js application featuring Victoria Sterling, an AI yacht consultant with a complete video content generation and YouTube publishing pipeline.

### 🎯 Core Architecture

**2-Phase Workflow (Phase 3 Reserved for Future):**
1. **Phase 1**: Content Generation (AI scripts + metadata)
2. **Phase 2**: Video Processing (FFmpeg merging) + YouTube Upload (OAuth + API integration)
3. **Phase 3**: Reserved for future social media distribution

### 🔑 Key Directories & Files

```
src/
├── app/
│   ├── api/
│   │   ├── victoria/chat/           # Victoria AI chat endpoint
│   │   ├── video-generator/         # Phase 1 content generation
│   │   ├── video/merge/             # Phase 2 server-side processing
│   │   └── youtube/                 # Phase 2 YouTube integration
│   ├── video-generator/page.tsx     # Main UI (Phases 1 & 2)
│   └── page.tsx                     # Victoria chat interface
├── lib/
│   ├── victoria/persona.ts          # AI personality configuration
│   ├── video-processing/            # Phase 2 utilities
│   └── youtube/                     # Phase 2 auth + upload
└── components/
    └── VictoriaChat.tsx             # Chat interface component
```

## 🚨 Critical Implementation Details

### YouTube Integration (Phase 2 - Continued)
- **OAuth2 Flow**: `src/lib/youtube/auth.ts` - handles token management
- **Upload Pipeline**: `src/lib/youtube/uploader.ts` - video upload with progress
- **Metadata Parsing**: `src/lib/youtube/metadata.ts` - extracts from Phase 1 content
- **State Management**: Multiple useState hooks in `page.tsx` for auth status, playlists, collapse states

### Current State Management (video-generator/page.tsx)
```typescript
// Key state variables to understand:
const [youtubeAuthStatus, setYoutubeAuthStatus] = useState({...})
const [isYoutubeOptionsCollapsed, setIsYoutubeOptionsCollapsed] = useState(false)
const [selectedPlaylists, setSelectedPlaylists] = useState([...])
const [availablePlaylists, setAvailablePlaylists] = useState([...])
```

### Auto-Collapse Logic
- Triggers 2.5 seconds after successful YouTube upload
- Collapses BOTH authentication status AND upload options
- User can manually collapse/expand with buttons
- Located in `handleUploadToYouTube()` function

## 🔧 Environment Variables Required

```env
ANTHROPIC_API_KEY=your_key_here
YOUTUBE_CLIENT_ID=your_youtube_client_id
YOUTUBE_CLIENT_SECRET=your_youtube_client_secret
YOUTUBE_REDIRECT_URI=http://localhost:3000/api/youtube/auth/callback
```

## 🎨 UI Patterns & Conventions

### Collapsible Sections Pattern
```typescript
// Standard pattern used throughout:
{!isCollapsed && (
  <div>Full content here</div>
)}
{isCollapsed && (
  <div>Collapsed state with expand button</div>
)}
```

### Progress Tracking Pattern
```typescript
// File size tracking with formatFileSize():
<span>
  {formatFileSize(current)} / {formatFileSize(total)}
</span>
```

## 📝 Content Generation Format

Phase 1 generates structured content with these sections:
```
📌 1. YOUTUBE TITLE
📌 2. YOUTUBE DESCRIPTION  
📌 3. YOUTUBE METADATA
📌 4. COMPETITIVE BUILDER TAG LIST
📌 5. THUMBNAIL TITLE OPTIONS
```

**Critical**: YouTube metadata extraction depends on this exact emoji + numbering format.

## 🎬 Video Processing Pipeline

### Phase 2 Flow:
1. User uploads main video (Creatify export)
2. Server-side FFmpeg merging with outro
3. IndexedDB storage for projects
4. Download processed video

### Phase 2 (Continued) - YouTube Upload Flow:
1. OAuth authentication with YouTube
2. Metadata extraction from Phase 1 content
3. Video upload with progress tracking
4. Playlist assignment + thumbnail upload
5. Auto-collapse UI after success

## 🐛 Common Debugging Areas

### YouTube API Issues
- Check OAuth token refresh in `youtube/auth.ts`
- Verify metadata parsing in `youtube/metadata.ts`
- Monitor quota usage (10,000 units daily)

### Server-Side Processing
- FFmpeg path issues: check system installation
- File size limits: 500MB for videos, 2MB for thumbnails
- Temp file cleanup in `/temp` directory

### UI State Management
- Multiple collapse states can conflict
- useState dependencies in useEffect hooks
- Progress tracking requires proper state updates

## 🔄 Recent Major Changes (Update History)

### Latest: UI Workflow Improvements (Current Session)
- ✅ Added authentic Larson Scanner progress bar for Phase 1 content generation
- ✅ Purple scanner beam with light grey background matching app theme
- ✅ Dynamic status messages showing generation progress
- ✅ Optimized scanner: 16% width, 1.125s speed, full-range sweep
- ✅ Fixed Phase 2 collapse timing - now collapses upload sections when processing completes
- ✅ Default playlist "YachtSpecsDirect.com - New Yachts..." now appears at top of list
- ✅ Smart collapse: hides upload/config sections but keeps YouTube upload visible

### Previous: Upload Playlist Selector Working (Commit: c2668db)
- ✅ Dynamic playlist loading from YouTube account
- ✅ Default playlist set to full "YachtSpecsDirect.com - New Yachts..." title
- ✅ Comprehensive auto-collapse for entire YouTube section
- ✅ Manual collapse/expand with bidirectional controls
- ✅ Enhanced UI for clean workflow management

### Previous: Complete YouTube Metadata Fix
- ✅ Fixed tag extraction from Phase 1 sections (3 & 4)
- ✅ Optimized to use ~450 of 500 available characters
- ✅ Robust description upload from Phase 1 content
- ✅ Enhanced progress tracking with file sizes

## 🚀 Development Workflow

### Starting Development
1. `npm run dev` - starts on port 3000
2. Test both phases: Generate → Process & Upload to YouTube
3. Check OAuth authentication status on home page

### Testing YouTube Integration
1. Authenticate from home page (recommended) OR in-process
2. Generate content with Phase 1
3. Process video with Phase 2
4. Upload with Phase 2 YouTube integration (test auto-collapse)

### Branch Strategy
- **main**: Stable production code
- **feature/[name]**: Development branches
- Current: `feature/phase2-uploader-improvements`

## 📋 Claude Code Action Items

**When making changes:**
1. ✅ Update this CLAUDE.md file after major features
2. ✅ Update README.md with new functionality
3. ✅ Test both phases work together (Phase 1 → Phase 2 with YouTube)
4. ✅ Commit with descriptive messages
5. ✅ Push to feature branch, merge when stable

**Key files to read when joining project:**
1. This CLAUDE.md file (project context)
2. README.md (user documentation)
3. `src/app/video-generator/page.tsx` (main UI logic)
4. `src/lib/youtube/` (YouTube integration)

## 🔍 Quick Debugging Commands

```bash
# Check server status
lsof -ti:3000

# View recent commits
git log --oneline -10

# Check environment variables
env | grep YOUTUBE

# Test FFmpeg installation
ffmpeg -version
```

## 🎯 Current State Management Notes

### Phase 2 Collapse Logic
- `isPhase2Expanded`: Controls entire Phase 2 section visibility
- `isPhase2UploadCollapsed`: Controls only upload/config sections within Phase 2
- Auto-collapse triggers on `setProcessedVideo()` with 2-second delay
- YouTube upload section remains visible after processing completes

### Playlist Management
- Playlists sorted with default at top using `sort()` before setting state
- Full playlist name: "YachtSpecsDirect.com - New Yachts Hitting the Market..."
- Auto-selected on load if exists

### 🔧 YouTube Upload & Tag Processing (August 3, 2025) - RESOLVED ✅

#### Critical Issue Resolution: "Invalid Video Keywords" Error - FIXED
**Problem**: YouTube API rejecting uploads with "The request metadata specifies invalid video keywords"
**Root Cause**: Tags approaching 500-character limit (like 498 chars) caused intermittent failures
**Solution**: Reduced tag limit to 400 characters for safety buffer in `src/lib/youtube/metadata.ts`

#### Key Insights Learned:
1. **Merge Process is NOT the issue** - FFmpeg merge works fine, YouTube accepts merged videos
2. **Tag validation is critical** - YouTube API is very strict about tag formatting
3. **Individual tag limits**: 30 characters max per tag
4. **Character restrictions**: Only alphanumeric, spaces, hyphens allowed
5. **Empty/whitespace tags cause failures**

#### Enhanced Tag Processing (`src/lib/youtube/metadata.ts:198-203`):
- **400-Character Safety Limit**: Tags limited to 400 chars instead of 500 for reliability
- **Strict character filtering**: `/^[a-zA-Z0-9\s\-]+$/` regex validation
- **Length limits**: 2-30 characters per tag
- **Duplicate removal**: Case-insensitive deduplication using Set
- **Safe extraction**: Still uses sections 3 & 4 but with bulletproof validation
- **Prevents intermittent failures**: No more 498+ character edge case issues

#### Video File Preservation System:
**Problem**: Video files deleted immediately after YouTube upload, but needed for Phase 3 (Metricool)
**Solution**: 
- Permanent storage: `/processed-videos/{VesselName}-{YouTubeId}.mp4`
- Delayed cleanup: Original temp files deleted after 5 minutes
- API response includes: `permanentVideoPath` and `youtubeUrl` for Phase 3

#### Updated Frontend Integration:
- Added state: `permanentVideoPath`, `youtubeVideoUrl`
- Phase 3 now requires permanent video path instead of blob
- Metricool API route updated to handle file paths instead of File objects

### 🔧 Phase 3 Metricool API Integration (August 3, 2025) - RESOLVED ✅

#### Critical Issue Resolution: Metricool 400 Bad Request Error - FIXED
**Problem**: Metricool API returning `400 Bad Request` with "Unrecognized field 'url'" error
**Root Cause**: API was sending YouTube URLs in unsupported "url" field
**Solution**: YouTube URLs now included in text content only (`src/lib/metricool/api.ts:266`)

#### Metricool API Structure Fix:
- **Removed "url" field**: YouTube URLs now in text content for all platforms
- **Direct postData structure**: No "info" wrapper object (was causing deserialization errors)
- **Platform-specific handling**: Twitter uses YouTube URL in text, Facebook uploads video files
- **Staggered scheduling**: 15-minute delays between platforms (5-min intervals)

#### Phase 3 Testing Results:
- ✅ **Twitter/X**: Posts scheduled successfully with YouTube URLs in content
- ✅ **Facebook**: Posts scheduled successfully with uploaded video files  
- ✅ **Multi-platform**: Both platforms working simultaneously
- ✅ **Staggered timing**: Posts scheduled 15 minutes apart for optimal engagement

#### Updated File Structure:
```
src/lib/metricool/
├── api.ts                 # Fixed postData structure, removed "url" field
├── config.ts              # Platform limits and authentication
└── /api/metricool/
    ├── test/route.ts      # API connectivity testing
    └── schedule/route.ts   # Multi-platform posting endpoint
```

---

**Last Updated**: August 3, 2025 (Claude Code session)
**Current Status**: All Phase 3 issues resolved - YouTube + Metricool working perfectly
**Next Steps**: Phase 3 production ready - complete all platform testing (Instagram, LinkedIn, TikTok)