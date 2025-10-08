# Claude Code Project Guide - Digital Ocean Social V1

**🚨 DOCUMENTATION-ONLY REPOSITORY: This repository contains NO code, only documentation**

## 🤖 IMPORTANT: Claude Code Instructions

This file provides server architecture documentation for developers working with the Digital Ocean server-based application.

**⚠️ CRITICAL: All code exists on the server at `/root/social-media-manager/`. This repository contains documentation only.**

## Quick Project Overview

Next.js 14.2.7 social media management platform featuring AI-powered content generation, professional video processing, YouTube integration, and multi-platform social media distribution via Metricool API.

### 🎯 Core Architecture

**3-Phase Workflow:**
1. **Phase 1**: AI Content Generation (Claude API for scripts + metadata)
2. **Phase 2**: Video Processing (FFmpeg merging) + YouTube Upload (OAuth + API)
3. **Phase 3**: Social Distribution (Metricool API for multi-platform scheduling)

### 🔑 Server Directory Structure

**Location**: `/root/social-media-manager/` on Digital Ocean server (142.93.52.214)

```
/root/social-media-manager/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth/                    # Authentication API routes
│   │   │   ├── admin/                   # Admin management
│   │   │   ├── victoria/chat/           # Victoria AI chat endpoint
│   │   │   ├── video-generator/         # Phase 1: Content generation
│   │   │   ├── video/merge/             # Phase 2: FFmpeg processing
│   │   │   ├── youtube/                 # Phase 2: YouTube integration
│   │   │   └── metricool/               # Phase 3: Social distribution
│   │   ├── video-generator/page.tsx     # Main UI (3-phase workflow)
│   │   ├── admin/page.tsx               # Admin portal dashboard
│   │   ├── login/page.tsx               # Authentication login page
│   │   └── page.tsx                     # Victoria chat + user portal
│   ├── lib/
│   │   ├── auth/                        # Authentication & admin management
│   │   ├── victoria/                    # AI personality configuration
│   │   ├── video-processing/            # FFmpeg utilities
│   │   ├── youtube/                     # YouTube auth + upload
│   │   ├── dropbox/                     # Dropbox integration
│   │   └── metricool/                   # Metricool API + cascade scheduler
│   └── components/
│       ├── auth/                        # Auth components
│       └── VictoriaChat.tsx             # Chat interface
├── .env.server                          # Production environment variables
├── package.json                         # Dependencies
└── users.json                           # User database (JSON file)
```

### 🖥️ Server Access Methods

**Primary Access**:
```bash
doctl compute ssh social-media-manager-v1
```

**Direct SSH**:
```bash
ssh -i ~/.ssh/id_ed25519_digitalocean root@142.93.52.214
```

**Server Details**:
- **IP**: 142.93.52.214
- **Application URL**: http://142.93.52.214:3000
- **Working Directory**: `/root/social-media-manager/`
- **Runtime**: Node.js 18.20.8 with PM2

## 🚀 Recent Major Updates

### October 7, 2025 - Manual Override Time Selection Feature
**FEATURE COMPLETE**: Added optional time selection to Manual Override Date functionality

**Frontend Changes** (`src/app/video-generator/page.tsx`):
- Added `overrideTime` state variable (default: "auto-schedule")
- Time selector dropdown with 48 time slots (30-minute intervals, 12-hour format)
- Helper function `getOverrideTimeDisplay()` for clean display logic
- Grid layout changed from 3 to 4 columns for date/time/platform/brand
- Simplified display to avoid complex nested JSX conditionals

**Backend Changes** (`src/app/api/metricool/schedule/route.ts`):
- Extract `customTime` parameter from form data
- Set `isUsingCustomTime` flag when custom time selected
- Conditional logic: custom time → use exact time, auto-schedule → use heat map (7 AM, 10 AM, 1 PM, 3 PM, 6 PM)
- Pass `isUsingCustomTime` flag to `schedulePost()` function

**API Changes** (`src/lib/metricool/api.ts`):
- Added `isCustomTime` parameter to `schedulePost()` function
- Modified offset logic: `isCustomTime ? scheduledTime : scheduledTime + 4 hours`
- 4-hour offset only applied for auto-scheduled times (Metricool API timezone quirk)

**Bug Fixes**:
- ✅ Fixed 4-hour offset issue where custom times were incorrectly shifted
- ✅ Fixed Distribution Results display showing wrong time (timezone conversion issue)
- ✅ Added proper EDT offset (+4 hours) to `scheduledTime` before returning to frontend

**Expected Behavior**:
- User selects 3:30 PM → Schedules at 3:30 PM EDT exactly
- Auto-schedule → Uses intelligent heat map times with proper Metricool API offset

### August 31, 2025 - YouTube OAuth Callback Fix
- Fixed hardcoded localhost redirect in YouTube OAuth callback route
- Added server IP detection for proper callback redirects
- Documented manual OAuth workaround procedure

### August 30, 2025 - UI & Dropbox Fixes
- Fixed social channel text visibility
- Fixed distribution time display with proper 8-hour offset
- Both merge and skip-outro paths generate Dropbox links

### August 28, 2025 - Dropbox Integration
- Immediate shareable link generation after upload
- Two link types: dl=0 (view) and dl=1 (direct download)
- Links passed to Metricool for social media distribution

### August 22, 2025 - Authentication & Admin System
- Complete user authentication with session management
- Admin portal with user management (approve/block/delete)
- Activity logging system with IP tracking
- User registration with contact information
- Enhanced profile management

## 🔧 Environment Variables Required

```env
# AI & APIs
ANTHROPIC_API_KEY=sk-ant-api03-xxx
YOUTUBE_CLIENT_ID=xxx.apps.googleusercontent.com
YOUTUBE_CLIENT_SECRET=GOCSPX-xxx
YOUTUBE_REDIRECT_URI=http://142.93.52.214:3000/api/youtube/auth/callback

# Dropbox
DROPBOX_APP_KEY=xxx
DROPBOX_APP_SECRET=xxx
DROPBOX_REFRESH_TOKEN=xxx

# Authentication
GOOGLE_EMAIL=mintedyachts@gmail.com
ADMIN_EMAIL=info@mintedyachts.com
AUTH_SECRET=32_character_random_string

# Metricool
METRICOOL_API_KEY=xxx
METRICOOL_BRAND_ID=xxx
```

## 🚀 Server Development Workflow

**⚠️ IMPORTANT: All development happens directly on the Digital Ocean server**

### Server Access & Development
```bash
# SSH to server
doctl compute ssh social-media-manager-v1

# Navigate to app
cd /root/social-media-manager

# Make changes to files directly on server

# Restart application
pm2 restart social-media-manager

# Check logs
pm2 logs social-media-manager

# Test at http://142.93.52.214:3000

# Commit changes
git add .
git commit -m "Description"
git push server-backup main
```

## 📋 Claude Code Action Items

**When making server changes:**
1. ✅ SSH to server: `doctl compute ssh social-media-manager-v1`
2. ✅ Navigate: `cd /root/social-media-manager`
3. ✅ Make changes directly in server files
4. ✅ Test functionality at http://142.93.52.214:3000
5. ✅ Restart PM2: `pm2 restart social-media-manager`
6. ✅ Commit: `git add . && git commit -m "description"`
7. ✅ Push: `git push server-backup main`
8. ✅ Update local documentation repository (README.md, CLAUDE.md)

**Key server files to understand:**
- `src/app/video-generator/page.tsx` - Main UI with 3-phase workflow
- `src/lib/youtube/` - YouTube OAuth and upload integration
- `src/lib/auth/` - Authentication and session management
- `src/lib/metricool/` - Social distribution and cascade scheduler
- `src/app/api/metricool/schedule/route.ts` - Social media scheduling logic

## 🎯 Critical Implementation Details

### Manual Override Time Selection (October 7, 2025)

**Flow:**
1. User selects Manual Override Date + Time
2. Frontend sends `customTime` parameter (e.g., "15:30" for 3:30 PM) or "auto-schedule"
3. Backend extracts `customTime` and sets `isUsingCustomTime` flag
4. If custom time:
   - Parse hours/minutes from `customTime`
   - Set exact time on `overrideDate`
   - Pass `isUsingCustomTime=true` to `schedulePost()`
   - No offset applied (user gets exact time)
5. If auto-schedule:
   - Use existing heat map logic (7 AM, 10 AM, 1 PM, 3 PM, 6 PM)
   - Pass `isUsingCustomTime=false` to `schedulePost()`
   - Apply 4-hour offset for Metricool API
6. Return `scheduledTime + 4 hours` to frontend for proper EDT display

**Important Files:**
- `src/app/video-generator/page.tsx:156` - State: `overrideTime`
- `src/app/video-generator/page.tsx:1206-1215` - Helper: `getOverrideTimeDisplay()`
- `src/app/video-generator/page.tsx:1108-1112` - Form submission with `customTime`
- `src/app/api/metricool/schedule/route.ts:21` - Extract `customTime`
- `src/app/api/metricool/schedule/route.ts:62-76` - Custom time logic
- `src/app/api/metricool/schedule/route.ts:381` - Return with EDT offset
- `src/lib/metricool/api.ts:360-366` - `schedulePost()` signature
- `src/lib/metricool/api.ts:378` - Conditional offset logic

### Authentication System

**Key Components:**
- `src/lib/auth/email-validator.ts` - @mintedyachts.com domain validation
- `src/lib/auth/user-database.ts` - JSON file storage with role/status management
- `src/lib/auth/session-manager.ts` - Cookie-based sessions (7-day expiration)
- `src/middleware.ts` - Route protection with auto-redirect to /login

**Admin Features:**
- User approval/blocking system
- Activity logging with IP tracking
- Role management (admin/user)
- Session-based admin access debouncing (30-min intervals)

### YouTube Integration

**OAuth2 Flow:**
- `src/lib/youtube/auth.ts` - Token management and refresh
- `src/lib/youtube/uploader.ts` - Video upload with progress tracking
- `src/lib/youtube/metadata.ts` - Metadata extraction from Phase 1 content

**Tag Processing:**
- 400-character safety limit (YouTube allows 500 but buffer needed)
- Individual tags: 2-30 characters
- Strict validation: `/^[a-zA-Z0-9\\s\\-]+$/`
- Duplicate removal with case-insensitive Set

### Metricool Integration

**Cascade Scheduler:**
- `src/lib/metricool/cascading-scheduler.ts` - Intelligent multi-day scheduling
- 8-day cascade pattern with level progression
- Prevents stacking posts on same day
- Global level balancing across weeks

**Platform Support:**
- Twitter/X: YouTube URLs in content
- Facebook: Dropbox video files (dl=1 links)
- Instagram: Dropbox videos with rich descriptions
- LinkedIn: Professional tone
- TikTok: Trendy style
- Google Business: YouTube URLs

## 🐛 Common Debugging Areas

### Timezone Issues
- **Server timezone**: UTC
- **Frontend display**: EDT (UTC - 4 hours)
- **Metricool API quirk**: Requires 4-hour offset for auto-scheduled posts
- **Custom times**: No offset applied (exact user time)
- **Display fix**: Add 4 hours to scheduledTime before returning to frontend

### YouTube API
- Quota limit: 10,000 units daily
- Tag character limit: 400 (safety buffer)
- Metadata parsing depends on emoji format in Phase 1 output
- OAuth token refresh handled automatically

### FFmpeg Processing
- Max file size: 1.5GB for videos
- Supported: 4K main + 1080p outro
- Temp file cleanup after processing
- Permanent storage: `/processed-videos/{VesselName}-{YouTubeId}.mp4`

## 🔍 Quick Debugging Commands

```bash
# Server Status
pm2 list                          # View running processes
pm2 logs social-media-manager     # View application logs
pm2 restart social-media-manager  # Restart application
pm2 save --force                  # Save current PM2 configuration

# Git Operations (on server)
cd /root/social-media-manager
git status                        # Check git status
git log --oneline -5              # View recent commits
git add . && git commit -m "msg"  # Commit changes
git push server-backup main       # Push to server repository

# System Info
lsof -ti:3000                     # Check port 3000 usage
node --version                    # Check Node.js version
ffmpeg -version                   # Check FFmpeg installation
```

## 📊 Performance Metrics

- **Server Uptime**: 99.9% (PM2 managed)
- **Video Processing**: ~2-3 minutes for 500MB files
- **Content Generation**: ~30 seconds (Claude API)
- **Social Distribution**: ~10 seconds per platform
- **Concurrent Users**: Supports 10-15 active sessions

## 🚦 Current Production Status

### Working Features (100% Operational)
- ✅ User authentication & sessions
- ✅ Admin portal with user management
- ✅ Victoria AI chat assistant
- ✅ Phase 1: AI content generation
- ✅ Phase 2: Video processing (merge & skip-outro)
- ✅ Phase 2: YouTube upload with metadata
- ✅ Phase 2: Dropbox upload with shareable links
- ✅ Phase 3: Metricool distribution with manual time override
- ✅ Activity logging & user tracking
- ✅ Calendar integration with cascade scheduler
- ✅ Smart scheduling with manual time selection

### Repository Information
- **Server Repo**: `git@github.com:MintedOne/Digital_Ocean_Social_V1_Server.git` (contains actual code)
- **Documentation Repo**: `git@github.com:MintedOne/Digital_Ocean_Social_V1.git` (this repository - documentation only)
- **Backup Strategy**: Commit server changes after major updates, then update documentation repository

---

**Last Updated**: October 7, 2025 (Manual Override Time Selection Feature)
**Current Status**: PRODUCTION - Fully Operational
**Application URL**: http://142.93.52.214:3000
**Server IP**: 142.93.52.214
