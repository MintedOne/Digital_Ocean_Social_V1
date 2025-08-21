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
- File size limits: 1.5GB for videos, 2MB for thumbnails
- Temp file cleanup in `/temp` directory

### UI State Management
- Multiple collapse states can conflict
- useState dependencies in useEffect hooks
- Progress tracking requires proper state updates

## 🔄 Recent Major Changes (Update History)

### Latest: FFmpeg Video Merge Fix (August 21, 2025)
- ✅ **CRITICAL FIX**: Resolved FFmpeg concat filter failure due to frame rate mismatch
- ✅ **Root Cause**: Main video at 30fps, outro at 29.97fps causing concat to truncate outro
- ✅ **Solution**: Normalize both videos to 30fps, 1920x1080, 48kHz audio before concatenation
- ✅ **File Updated**: `src/app/api/video/merge/route.ts` lines 168-191
- ✅ **Result**: Full 15+ second outro now merges correctly instead of just a few frames
- ✅ **Calendar Integration**: Confirmed working - fetching and displaying Metricool posts
- ✅ **Manual Date Posting**: Verified functional - can schedule to specific dates
- ✅ **Core Functions**: All basic operations confirmed working on process-flow-optimization branch
- ✅ Fixed Phase 2 collapse timing - now collapses upload sections when processing completes
- ✅ Default playlist "YachtSpecsDirect.com - New Yachts..." now appears at top of list
- ✅ Smart collapse: hides upload/config sections but keeps YouTube upload visible

### Previous: UI Workflow Improvements
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

### 🔧 Phase 3 Dropbox Integration (August 3, 2025) - IMPLEMENTED ✅

#### Dropbox API Integration Complete
**Problem**: Large video files (189MB+) caused Metricool API 500 errors during direct upload
**Solution**: Implemented Dropbox share link generation with `dl=1` parameter for auto-download

#### Implementation Details:
- **Dropbox SDK**: Installed and configured with refresh token authentication
- **Share Link Generation**: Creates public links with critical `dl=1` parameter
- **Path Conversion**: Automatically converts local paths to Dropbox API paths
- **Platform Logic**: 
  - Twitter & GMB: Always use YouTube URLs
  - Instagram, Facebook, LinkedIn, TikTok: Use Dropbox share links
  - Fallback: YouTube URLs if Dropbox fails

#### File Structure Added:
```
src/lib/dropbox/
└── integration.ts         # Complete Dropbox API integration class
```

#### Environment Variables Required:
```env
DROPBOX_APP_KEY=toyyrz07dydwu7t
DROPBOX_APP_SECRET=zrjfs9pbfcn4myl
DROPBOX_REFRESH_TOKEN=N3Jm_r8oINYAAAAAAAAAASxdMyFTOGVI9reUIFjeo3NFm34zwSzN3imQvNYyR3FY
```

#### Testing Status:
- ✅ **Connection Test**: Successfully authenticated with Dropbox account
- ✅ **Share Link Generation**: Working for 189MB video files
- ✅ **URL Format**: Generates proper `dl=1` URLs for Metricool
- 🧪 **Multi-Platform Testing**: Currently testing all platforms with Dropbox links

### 🔧 Enhanced Cascade Scheduler Logic Fix (August 8, 2025) - COMPLETED ✅

#### Critical Issue Resolution: Topic Counting Logic - FIXED
**Problem**: Scheduler correctly identified future dates (e.g., 8/22/2025) but still posted to current dates (8/9/2025)
**Root Cause**: Complex yacht name text parsing was unreliable, causing incorrect topic grouping
**Solution**: Simplified to time-based grouping - 6 posts within 3 hours = 1 topic

#### Enhanced Topic Grouping Logic (`src/lib/metricool/cascading-scheduler.ts:56-104`):
- **OLD**: Complex regex patterns trying to extract yacht names from post text
- **NEW**: Simple time-based grouping within 3-hour windows
- **Result**: Much more reliable topic detection (6 social posts = 1 topic)
- **Forward Date Filling**: Now properly schedules to 8/10, 8/11, etc. instead of stacking on 8/9
- **Sequential Progression**: Correctly implements Day 0→1→2→3→4→5→6→7 then level up

#### Code Changes:
- Removed complex `yachtPatterns` regex matching
- Removed `extractTopicFromText()` method entirely  
- Simplified `groupPostsByTopic()` to use chronological grouping
- Posts within 3-hour windows grouped as same topic
- Topic naming: `Topic-YYYY-MM-DD` (simple and reliable)

#### Expected Behavior:
- **6+ posts on a day**: Recognized as 1 complete topic
- **Next scheduling**: Moves to next available day (8/10, 8/11, etc.)
- **No more stacking**: Sequential date progression instead of tripling up on same day
- **Cascade pattern**: Proper 8-day rotation then level increase

### 🔧 Date Range Fix for Cascade Scheduler (August 9, 2025) - COMPLETED ✅

#### Critical Issue Resolution: Stale Data vs Live API Data - FIXED
**Problem**: Calendar displayed different data than actual Metricool calendar, cascade scheduler made incorrect decisions
**Root Cause**: Date range inconsistency - cascade scheduler fetched only 7 days, but calendar API fetched 70 days
**Solution**: Extended cascade scheduler date range to include the full 8th day

#### Date Range Synchronization Fix:
- **File**: `src/lib/metricool/cascading-scheduler.ts` lines 119, 356
- **File**: `src/app/api/metricool/cascade-debug/route.ts` line 20
- **OLD**: `endDate = today + (7 * 24 * 60 * 60 * 1000)` - excluded 8th day posts
- **NEW**: `endDate = today + (8 * 24 * 60 * 60 * 1000)` - includes full 8th day
- **Result**: Cascade scheduler now sees same data as calendar API

#### Verification Results:
- **Before**: Day 7 (2025-08-16) showed 0 posts, cascade decision targeted wrong day
- **After**: Day 7 (2025-08-16) shows 6 posts (1 topic), cascade decision now properly targets day 5
- **Calendar Refresh**: Already implemented with `calendarRefreshTrigger` after post scheduling

### 🔧 Cascade Progression Logic Implementation (August 11, 2025) - COMPLETED ✅

#### BREAKTHROUGH: Cascade Progression Algorithm - Perfect Level Balancing - IMPLEMENTED
**Problem**: System extended to Week 4 instead of progressing Week 2 (jumping to day 25 vs day 7)
**Root Cause**: System found empty weeks before balancing existing weeks - ignored level differences between weeks
**Solution**: Implemented cascade progression that brings all weeks to maximum level before starting new weeks

#### Cascade Progression Algorithm (`src/lib/metricool/cascading-scheduler.ts:288-330`):
- **NEW Logic**: Global level analysis with progression prioritization  
- **Level Balancing**: Bring all weeks to maximum level before any week advances further
- **Algorithm**: 
  ```
  // Find global maximum level across all populated weeks
  globalMaxLevel = getMaxLevelAcrossAllWeeks()
  
  // Progress each week that's below maximum level
  for each populatedWeek:
    if (week.maxTopics < globalMaxLevel):
      // Find day in this week that can be progressed
      return getDayBelowMaxLevel(week)
  
  // All weeks at same level, start new empty week
  return getFirstEmptyWeek()
  ```

#### Cascade Progression Features:
- **Perfect Level Balancing**: Progresses Week 2 to Level 2 before starting Week 4
- **Global Level Analysis**: Finds maximum level and ensures all weeks reach that level
- **Proper Progression Order**: All weeks reach Level 3 before any week goes to Level 4
- **Prevents Wrong Extensions**: Never starts new weeks before existing weeks are balanced
- **Verified Results**: Day 7 (Week 2) chosen for progression instead of Day 25 (Week 4)

#### Test Results (August 11, 2025):
- **BEFORE**: Day 25 (2025-09-07) - extending to Week 4 ❌
- **AFTER**: Day 7 (2025-08-20) - progressing Week 2 ✅  
- **Current State**: Week 1 at Level 3, Week 2 at Level 1 → Week 2 progresses to Level 2
- **Future Pattern**: All weeks reach Level 3 → Then all weeks reach Level 4 → etc.
- **Verified**: Cascade progression balances all weeks before starting new weeks
- **No More Clustering**: System prevents tripling up by finding future empty days

#### Files Updated:
- `src/lib/metricool/cascading-scheduler.ts` - Core cascade progression logic with global level analysis
- `src/lib/metricool/calendar-reader.ts` - Cache busting system for fresh data and force refresh parameters
- `src/app/api/metricool/cascade-test/route.ts` - Updated test endpoint for cascade progression pattern
- `src/app/api/metricool/calendar/route.ts` - Added force refresh support with ?force=true parameter
- `src/components/ContentCalendar.tsx` - Frontend triggers forced refresh after posting

---

### 🔧 Week-by-Week Cascade Logic Implementation (Latest - August 14, 2025)

#### Critical Issue Discovered:
**Problem**: The cascade progression logic was still allowing days within weeks to be skipped. For example:
- Aug 21: 3 topics (Level 3) ✅  
- Aug 22-27: Only 1 topic each (Level 1) ❌
- Aug 28: 3 topics (Level 3) ✅ **← WRONG! Should fill Aug 22-27 first**

**Root Cause**: Logic checked `week.maxTopics < globalMaxLevel` but this meant Week 2 was considered "complete" because Day 21 was at Level 3, even though Days 22-27 were still at Level 1.

#### Week-by-Week Algorithm (`src/lib/metricool/cascading-scheduler.ts:288-336`):
- **NEW Logic**: Min-based week progression instead of max-based  
- **Complete Week Saturation**: Fill ALL days in each week to same level before advancing
- **Algorithm**: 
  ```
  // Find global minimum level across ALL days in ALL weeks
  overallMinLevel = getMinLevelAcrossAllDays()
  
  // Fill all days to minimum + 1 level before any day goes higher
  for each populatedWeek:
    for each dayInWeek:
      if (day.topics < overallMinLevel + 1):
        return fillThisDay()
  
  // Only after all days are at same level, look for empty weeks
  return getFirstEmptyWeek()
  ```

#### Week-by-Week Features:
- **Complete Week Saturation**: All days in a week reach same level before week advances
- **Min-Based Progression**: Uses global minimum across all days, not week maximums  
- **No Day Skipping**: Aug 22-27 must fill to Level 2 before Aug 28 can start
- **Proper Week Order**: Week 1 fully saturated → Week 2 fully saturated → Week 3 starts
- **Expected Pattern**: Aug 21: 3 topics → Aug 22-27: fill to 2 EACH → Aug 22-27: fill to 3 EACH → THEN Aug 28+

#### Test Results (August 14, 2025):
- **ISSUE**: Aug 22-27 staying at 1 topic while Aug 28 jumps to 3 topics ❌
- **SOLUTION**: Fill Aug 22-27 to Level 2, then Level 3, before Aug 28 starts ✅
- **Pattern**: Complete week saturation prevents partial week fills
- **Result**: True week-by-week progression with no day skipping within weeks

#### Files Updated:
- `src/lib/metricool/cascading-scheduler.ts` - Week-by-week fill logic with min-based progression
- `src/app/api/metricool/cascade-test/route.ts` - Updated test descriptions for week-by-week pattern

---

---

### 🎯 Smart Insights Alignment Implementation (Final Fix - August 14, 2025)

#### Critical Discovery:
**Problem**: Found TWO separate cascade systems running simultaneously:
1. **Actual Posting Logic**: `CascadingScheduler.getNextAction()` in `cascading-scheduler.ts` ✅ **WORKING CORRECTLY**
2. **Smart Insights Display**: `MetricoolCalendarReader.calculateOptimalTime()` in `calendar-reader.ts` ❌ **USING OLD LOGIC**

**Result**: Smart Insights showed "September 11" while actual posts correctly went to "August 22" - creating user confusion about system behavior.

#### Root Cause Analysis:
- `schedule/route.ts` calls `CascadingScheduler.getNextAction()` (CORRECT week-by-week logic)
- `calendar/route.ts` calls `MetricoolCalendarReader.calculateOptimalTime()` (OLD gap-filling logic)
- Two different algorithms produced conflicting recommendations despite working data

#### Smart Insights Alignment Fix (`src/lib/metricool/calendar-reader.ts:340-358`):
- **REPLACED**: Old cascade logic with direct call to `CascadingScheduler`
- **UNIFIED LOGIC**: Both Smart Insights and actual posting now use identical algorithm
- **PERFECT ALIGNMENT**: Smart Insights suggestions match actual posting behavior
- **Algorithm**: 
  ```typescript
  async calculateOptimalTime(analysis: CalendarAnalysis): Promise<string> {
    // Import and use the SAME logic as actual posting
    const { CascadingScheduler } = await import('./cascading-scheduler');
    const cascadeScheduler = new CascadingScheduler(this);
    
    // Get identical decision to actual posting
    const cascadeDecision = await cascadeScheduler.getNextAction();
    
    return this.setOptimalTime(cascadeDecision.dateObj, cascadeDecision.currentTopics);
  }
  ```

#### Smart Insights Alignment Features:
- **Perfect Logic Unity**: Smart Insights and actual posting use identical CascadingScheduler
- **Real-Time Accuracy**: Insights reflect exactly what the posting system will do
- **User Confidence**: No more conflicts between suggestions and actual behavior
- **Week-by-Week Alignment**: Both systems fill Aug 22-27 to Level 2 before advancing
- **Populated Week Focus**: Both systems ignore empty weeks in minimum level calculation

#### Test Results (August 14, 2025):
- **BEFORE**: Smart Insights suggested "September 11" while posts went to "August 22" ❌
- **AFTER**: Smart Insights suggest "August 22" and posts go to "August 22" ✅
- **User Feedback**: "That worked that time" - confirmed alignment success
- **Behavior**: Week-by-week progression now works as designed in both systems

#### Files Updated:
- `src/lib/metricool/calendar-reader.ts` - Replaced calculateOptimalTime with CascadingScheduler call
- `src/lib/metricool/cascading-scheduler.ts` - Fixed populated week level calculation

---

**Last Updated**: August 21, 2025 (Claude Code session)
**Current Status**: FFMPEG MERGE FIXED - Full outro video now merges correctly, calendar integration working
**Branch**: process-flow-optimization
**Test Verification**: ✅ 15+ second outro merges completely, manual date posting works, calendar fetch operational
**Core Functions**: ✅ All basic video generation, processing, and social scheduling features confirmed working