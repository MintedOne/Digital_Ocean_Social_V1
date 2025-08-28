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
- **Integrates APIs**: YouTube uploads, Dropbox file sharing, and intelligent scheduling

## ✅ Current Features

### 🤖 **Victoria AI Chat Assistant**
- Yacht industry expert AI personality
- Australian accent and professional yacht broker knowledge
- Full-screen chat interface for client consultations
- Anthropic Claude integration with streaming responses

### 📹 **Video Content Pipeline**
- **Phase 1**: AI script generation with yacht-specific metadata and tags
- **Phase 2**: Server-side video processing with FFmpeg merging and YouTube upload
- **Phase 3**: Multi-platform social media distribution with intelligent scheduling

### 🌐 **Social Media Distribution**
- **6 Platform Support**: Twitter/X, Instagram, Facebook, TikTok, LinkedIn, Google Business
- **Smart Scheduling**: Cascade algorithm prevents posting conflicts and optimizes engagement
- **Manual Override**: Schedule posts for specific dates with timezone-aware posting
- **Platform Optimization**: Tailored content length and format for each social network

### 🎥 **YouTube Integration**
- OAuth2 authentication with automatic token refresh
- Direct video uploads with progress tracking
- Playlist management and custom thumbnail support
- Metadata extraction from AI-generated content

### 🗂️ **File Management**
- **Dropbox Integration**: Automatic file sharing for large video files (1.5GB+)
- **IndexedDB Storage**: Browser-based project management
- **Server Storage**: Processed videos stored permanently for multi-platform use

### 👥 **User Management & Authentication**
- **Email-based Authentication**: @mintedyachts.com domain restriction
- **Admin Portal**: Complete user management with approval workflow
- **Activity Tracking**: Comprehensive logging of all user actions
- **Role Management**: Admin and standard user roles with appropriate permissions

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

## 🔧 Recent Updates

### Latest: Authentication Performance Optimization (August 28, 2025)
- **Login Prioritization**: User authentication check now runs before YouTube authentication
- **Performance Improvement**: Unauthenticated users redirect to login immediately without waiting for YouTube API timeout
- **Faster User Experience**: Eliminated up to 5-second delay for login redirects
- **Server Stability**: Maintained all existing functionality while improving startup performance

### Previous: Complete System Integration Success (August 27, 2025)
- ✅ **ERR_EMPTY_RESPONSE Fixed**: Video merge functionality completely restored
- ✅ **Video Processing Pipeline**: FFmpeg integration fully operational
- ✅ **Dropbox Integration**: Script uploads and file sharing working
- ✅ **YouTube Integration**: OAuth authenticated, upload ready
- ✅ **User Management**: Complete admin portal with activity tracking
- ✅ **Server Stability**: Stable operation with PM2 process management

## 📋 Current Status

**Version**: PRODUCTION READY ✅
**Last Updated**: August 28, 2025
**Application URL**: http://142.93.52.214:3000
**Server Status**: Online and stable

### ✅ Fully Operational Systems
- ✅ **AI Content Generation**: Claude AI creating yacht-specific scripts and metadata
- ✅ **Video Processing Pipeline**: FFmpeg merge with outro sequences
- ✅ **YouTube Integration**: OAuth authenticated, upload ready, playlist management
- ✅ **Dropbox Integration**: OAuth API integration, automatic script file uploads
- ✅ **User Authentication**: Complete admin portal with activity tracking
- ✅ **Metricool Integration**: Calendar loading and scheduling system
- ✅ **Server Infrastructure**: Stable Digital Ocean deployment

### Integration Status
- **Phase 1** (Content Generation): ✅ COMPLETE - AI scripts with Dropbox upload
- **Phase 2** (Video Processing): ✅ COMPLETE - FFmpeg merge with YouTube upload
- **Phase 3** (Social Distribution): ✅ COMPLETE - Multi-platform posting via Metricool

### Access Requirements
- Requires @mintedyachts.com email for access
- Admin approval required for new users
- Server-based operation only - no local development supported

---

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
- ✅ **Development History**: Progress tracking and update logs
- ✅ **Configuration Reference**: Environment and setup information for server management

---

## 🤖 For Authorized Developers

Server changes should be made directly on the Digital Ocean server at `/root/social-media-manager/`. This documentation repository includes a `CLAUDE.md` file with detailed architectural information for development context.

**Access Requirements**: Digital Ocean account access and SSH key authentication required for server modifications.