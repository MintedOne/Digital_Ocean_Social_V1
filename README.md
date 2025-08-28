# Digital Ocean Social V1 - AI-Powered Social Media Management Platform

**🚨 SERVER-ONLY OPERATION: This repository is for documentation only. The application runs exclusively on the Digital Ocean server.**

---

A comprehensive social media management platform that combines AI-powered content generation with automated video processing and multi-platform distribution, running on Digital Ocean server infrastructure.

## 🎯 What It Does

**Digital Ocean Social V1** is a complete social media workflow automation tool that:

- **Generates AI Content**: Creates yacht listing scripts, metadata, and social media content using Claude AI
- **Processes Videos**: Merges user videos with outro sequences using FFmpeg
- **Distributes Content**: Automatically schedules posts across 6+ social platforms via Metricool API
- **Manages Users**: Complete authentication system with admin controls and activity tracking

## 🖥️ **SERVER-ONLY ACCESS**

### **⚠️ IMPORTANT: No Local Development**
This repository contains **DOCUMENTATION ONLY**. The application cannot be run locally. All operational code runs on the Digital Ocean server.

### **Application Access**
- **Production URL**: http://142.93.52.214:3000
- **Login Required**: @mintedyachts.com email addresses only
- **Admin Access**: Available to authorized users through the admin portal

### **Server Details**
- **Server**: `social-media-manager-v1`
- **IP Address**: `142.93.52.214`
- **Region**: NYC1 (Digital Ocean)
- **Specifications**: 4GB RAM, 2 vCPU, 50GB SSD
- **OS**: Ubuntu 24.04 (LTS) x64
- **Runtime**: Node.js 18.20.8 with PM2 process manager
- **Mode**: Development (`npm run dev`) for stability and hot reloading

## 🔧 **SERVER MANAGEMENT** (Authorized Personnel Only)

### **Server Access Methods**
```bash
# Using doctl command (recommended)
doctl compute ssh social-media-manager-v1

# Using direct SSH with key
ssh -i ~/.ssh/id_ed25519_digitalocean root@142.93.52.214
```

### **PM2 Process Management**
```bash
# Application control
pm2 list                          # View running processes
pm2 logs social-media-manager     # View live logs
pm2 restart social-media-manager  # Restart application
pm2 monit                         # System monitoring dashboard
```

### **Server Directory Structure**
```
/root/
└── social-media-manager/          # ACTIVE running application
    ├── src/app/api/               # API routes and endpoints
    ├── src/components/            # React components
    ├── src/lib/                   # Utility libraries
    ├── .next/                     # Production build files
    ├── node_modules/              # Dependencies
    └── package.json               # Project configuration
```

## 📋 **REPOSITORY STATUS**

### **Local Repository** (This Repository)
- **Purpose**: Documentation and reference only
- **URL**: `git@github.com:MintedOne/Digital_Ocean_Social_V1.git`
- **Status**: No operational code - cleaned for documentation
- **Contents**: README.md, CLAUDE.md, and configuration files for reference

### **Server Repository** (Production Backup)
- **Purpose**: Production server state backup
- **URL**: `git@github.com:MintedOne/Digital_Ocean_Social_V1_Server.git`
- **Status**: Contains exact working server configuration
- **Latest Commit**: Authentication performance optimization with login prioritization

### **Development Workflow**
1. **Server Changes**: Made directly on the Digital Ocean server
2. **Testing**: Live testing at http://142.93.52.214:3000
3. **Documentation**: Updated in this local repository for reference
4. **Backup**: Server changes backed up to server GitHub repository

## 🔧 **RECENT FIXES** (August 28, 2025)

### **Dropbox Refresh Token Implementation - RESOLVED ✅**
**Problem**: Video generation failing with "Failed to save to Dropbox: 500 Internal Server Error"
- **Root Cause**: Dropbox access token expiring after a few hours (temporary tokens starting with `sl.u.`)
- **Solution**: Implemented permanent refresh token authentication that never expires
- **Fix Applied**: 
  - Generated OAuth refresh token: `PBzRKh_7_EkAAAAAAAAAAUIKP0ylkl57tmzIkEqPvs3O8OmKg9YDtJRRPyCpwYIO`
  - Updated `/root/social-media-manager/src/lib/dropbox/integration.ts` for refresh token support
  - Added `DROPBOX_REFRESH_TOKEN` to server environment variables
  - Server automatically gets new access tokens as needed

**Benefits**:
- ✅ **Permanent Solution**: Refresh token never expires
- ✅ **Automatic Renewal**: Dropbox SDK handles token refresh automatically  
- ✅ **No Manual Updates**: No more token expiration issues
- ✅ **Auto-Save Working**: Video generation now successfully saves to `/Minted Yachts Marketing/claude-output/`

### **YouTube API Stability Fix - RESOLVED ✅**
**Problem**: Server instability causing "ERR_CONNECTION_REFUSED" and "ERR_EMPTY_RESPONSE" errors
- **Root Cause**: YouTube API calls overwhelming Next.js development server on page load
- **Symptoms**: Fast Refresh reload loops, playlist loading failures, connection timeouts
- **Solution**: Added 1-second delays to prevent server overload
- **Fix Applied**:
  - Added `setTimeout(1000ms)` to initial `checkYouTubeAuthStatus()` call
  - Added delay to post-authentication YouTube status checks  
  - Added delay to playlist loading in `useEffect` hook
  - Updated `/root/social-media-manager/src/app/video-generator/page.tsx`

**Benefits**:
- ✅ **Server Stability**: No more connection refused errors on new browser windows
- ✅ **YouTube Auth Working**: Authentication status loads reliably with delay
- ✅ **Playlist Loading**: User playlists now load consistently without timeouts
- ✅ **Fast Refresh Fixed**: Development server no longer crashes from rapid API calls

## 🏗️ Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend API   │    │  External APIs  │
│                 │    │                 │    │                 │
│ • Next.js UI    │◄──►│ • Phase 1: AI   │◄──►│ • Anthropic     │
│ • React Pages   │    │ • Phase 2: Video│    │ • YouTube       │
│ • Auth System   │    │ • Phase 3: Social│    │ • Metricool     │
│ • File Upload   │    │ • Admin Portal  │    │ • Dropbox       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Key Components
- **Frontend**: Next.js 14 with TypeScript, Tailwind CSS
- **Authentication**: Cookie-based sessions with middleware protection
- **Video Processing**: Server-side FFmpeg integration
- **API Integration**: RESTful endpoints for all external services
- **Database**: JSON file storage for users and activity logs
- **Deployment**: Digital Ocean VPS with PM2 process management

## 🚨 **IMPORTANT NOTICES**

### **No Local Development**
- Local source code has been removed from this repository
- Application runs exclusively on Digital Ocean server
- All development and changes must be made on the server
- This repository serves as documentation only

### **Server-Only Operation**
- Production URL: http://142.93.52.214:3000
- No `npm install` or `npm run dev` commands available locally
- No local environment setup possible
- All functionality accessible through web interface

### **Documentation Repository**
This repository now serves as:
- ✅ **Project Documentation**: Complete feature and architecture documentation
- ✅ **Server Information**: Access methods and management procedures
- ✅ **Configuration Reference**: Environment and setup information for server management

### **Access Requirements**
- Requires @mintedyachts.com email for access
- Admin approval required for new users
- Server-based operation only - no local development supported

---

## 🤖 For Authorized Developers

Server changes should be made directly on the Digital Ocean server at `/root/social-media-manager/`. This documentation repository includes a `CLAUDE.md` file with detailed architectural information for development context.

**Access Requirements**: Digital Ocean account access and SSH key authentication required for server modifications.