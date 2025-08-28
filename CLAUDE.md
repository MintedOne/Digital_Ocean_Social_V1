# Claude Code Project Guide - Digital Ocean Social V1

**🚨 SERVER-ONLY DOCUMENTATION: This documentation is for the Digital Ocean server-based application. Local development files have been removed.**

## 🤖 IMPORTANT: Claude Code Instructions

**This file provides server architecture documentation for developers working directly on the Digital Ocean server. Local development is not supported.**

**⚠️ CRITICAL: All code changes must be made directly on the server at `/root/social-media-manager/`. This repository contains documentation only.**

## Quick Project Overview

This is a Next.js application featuring a comprehensive social media management platform with AI-powered content generation, video processing, and multi-platform distribution capabilities.

### 🎯 Core Architecture

**3-Phase Workflow:**
1. **Phase 1**: Content Generation (AI scripts + metadata)
2. **Phase 2**: Video Processing (FFmpeg merging) + YouTube Upload (OAuth + API integration)
3. **Phase 3**: Social Media Distribution (Multi-platform posting via Metricool)

### 🔑 Server Directory Structure

**Location**: `/root/social-media-manager/` on Digital Ocean server (142.93.52.214)

```
/root/social-media-manager/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth/                    # Authentication API routes
│   │   │   ├── admin/                   # Admin management API routes
│   │   │   ├── victoria/chat/           # Victoria AI chat endpoint
│   │   │   ├── video-generator/         # Phase 1 content generation
│   │   │   ├── video/merge/             # Phase 2 server-side processing
│   │   │   └── youtube/                 # Phase 2 YouTube integration
│   │   ├── admin/page.tsx               # Admin portal dashboard
│   │   ├── login/page.tsx               # Authentication login page
│   │   ├── auth-status/page.tsx         # Authentication status page
│   │   ├── video-generator/page.tsx     # Main UI (Phases 1 & 2)
│   │   └── page.tsx                     # Victoria chat interface + User profile
│   ├── lib/
│   │   ├── auth/                        # Authentication & admin management
│   │   ├── victoria/persona.ts          # AI personality configuration
│   │   ├── video-processing/            # Phase 2 utilities
│   │   └── youtube/                     # Phase 2 auth + upload
│   └── components/
│       ├── auth/                        # Authentication components
│       └── VictoriaChat.tsx             # Chat interface component
├── .next/                               # Production build files
├── node_modules/                        # Dependencies
└── package.json                         # Project configuration
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

## 🔧 Environment Variables Required

```env
ANTHROPIC_API_KEY=your_key_here
YOUTUBE_CLIENT_ID=your_youtube_client_id
YOUTUBE_CLIENT_SECRET=your_youtube_client_secret
YOUTUBE_REDIRECT_URI=http://localhost:3000/api/youtube/auth/callback
GOOGLE_EMAIL=mintedyachts@gmail.com
ADMIN_EMAIL=info@mintedyachts.com
AUTH_SECRET=your_32_character_random_string
DROPBOX_APP_KEY=your_dropbox_app_key
DROPBOX_APP_SECRET=your_dropbox_app_secret
DROPBOX_REFRESH_TOKEN=your_dropbox_refresh_token
```

## 🚀 Server Development Workflow

**⚠️ IMPORTANT: All development happens directly on the Digital Ocean server**

### Server Development Process
1. **SSH Access**: `doctl compute ssh social-media-manager-v1`
2. **Navigate to App**: `cd /root/social-media-manager`
3. **Make Changes**: Edit files directly on server
4. **PM2 Management**: Restart with `pm2 restart social-media-manager`
5. **Test Live**: Visit http://142.93.52.214:3000

### Testing on Server
1. **Authentication**: Test login at http://142.93.52.214:3000/login
2. **Phase 1**: Generate content with AI scripts
3. **Phase 2**: Process video with FFmpeg merge and YouTube upload
4. **Phase 3**: Test social media distribution
5. **Monitor**: Check `pm2 logs social-media-manager` for issues

### Server Repository Strategy
- **Server Repository**: `git@github.com:MintedOne/Digital_Ocean_Social_V1_Server.git` (production state)
- **Documentation Repository**: This local repository (documentation only)
- **Backup Process**: Commit server changes to server repository after major updates

## 📋 Claude Code Action Items - SERVER DEVELOPMENT

**When making server changes:**
1. ✅ SSH to server: `doctl compute ssh social-media-manager-v1`
2. ✅ Navigate to app: `cd /root/social-media-manager`
3. ✅ Make changes directly in server files
4. ✅ Test functionality at http://142.93.52.214:3000
5. ✅ Restart PM2: `pm2 restart social-media-manager`
6. ✅ Commit to server repository: `git add . && git commit -m "description"`
7. ✅ Push to server repo: `git push server-backup main`
8. ✅ Update local documentation repositories (README.md, CLAUDE.md)

**Key server files to understand:**
1. `/root/social-media-manager/src/app/video-generator/page.tsx` (main UI logic)
2. `/root/social-media-manager/src/lib/youtube/` (YouTube integration)
3. `/root/social-media-manager/src/lib/auth/` (authentication system)
4. `/root/social-media-manager/src/app/api/` (all API endpoints)

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

## 🎯 Current State Management Notes

### Authentication Flow
- User authentication check runs FIRST (fast)
- YouTube authentication check runs SECOND (slower)
- Optimized for faster login redirects

### Main Application Features
- **Phase 1**: AI content generation with Claude API
- **Phase 2**: Video processing with FFmpeg + YouTube upload
- **Phase 3**: Social media distribution via Metricool API
- **Admin Portal**: User management and activity tracking
- **Victoria Chat**: AI assistant for yacht industry consultations

### Server Infrastructure
- **Status**: Production-ready and stable
- **Mode**: Development (`npm run dev`) for hot reloading
- **Uptime**: Stable operation with PM2 process management
- **Monitoring**: PM2 logs and system monitoring available

---

**Last Updated**: August 28, 2025 (Documentation cleanup)
**Current Status**: SERVER-ONLY OPERATION - All development on Digital Ocean server
**Working Application**: http://142.93.52.214:3000