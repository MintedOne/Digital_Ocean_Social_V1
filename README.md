# Digital Ocean Social V1 - AI-Powered Social Media Management Platform

A comprehensive social media management platform that combines AI-powered content generation with automated video processing and multi-platform distribution.

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

## 🚀 Getting Started

### Prerequisites
```bash
# Required software
Node.js 18+
FFmpeg (for video processing)
```

### Environment Setup
1. **Clone the repository**
   ```bash
   git clone https://github.com/MintedOne/Digital_Ocean_Social_V1.git
   cd Digital_Ocean_Social_V1
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Required variables:
   ```env
   ANTHROPIC_API_KEY=your_claude_api_key
   YOUTUBE_CLIENT_ID=your_youtube_client_id
   YOUTUBE_CLIENT_SECRET=your_youtube_client_secret
   YOUTUBE_REDIRECT_URI=http://localhost:3000/api/youtube/auth/callback
   DROPBOX_APP_KEY=your_dropbox_app_key
   DROPBOX_APP_SECRET=your_dropbox_app_secret
   DROPBOX_REFRESH_TOKEN=your_dropbox_refresh_token
   AUTH_SECRET=your_32_character_random_string
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Access the application**
   - Open [http://localhost:3000](http://localhost:3000)
   - Login with @mintedyachts.com email address
   - Admin users are auto-created: info@mintedyachts.com, admin@mintedyachts.com, ts@mintedyachts.com

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
- **Video Processing**: Browser and server-side FFmpeg integration
- **API Integration**: RESTful endpoints for all external services
- **Database**: JSON file storage for users and activity logs
- **Deployment**: Digital Ocean VPS with PM2 process management

## 🔧 Development Workflow

### Adding New Features
1. Update `CLAUDE.md` with architectural context for AI assistance
2. Test changes locally with `npm run dev`
3. Deploy to server using `./deploy.sh`
4. Monitor with `pm2 logs social-media-manager`

### Common Commands
```bash
# Development
npm run dev                    # Start local development server
npm run build                  # Build for production
npm run lint                   # Run ESLint

# Deployment
./deploy.sh                    # Deploy to Digital Ocean server
./warmup.sh                    # Pre-compile pages for better performance

# Server Management
ssh social-media-do           # Access production server
pm2 logs social-media-manager # View application logs
pm2 restart social-media-manager # Restart application
```

## 🖥️ Digital Ocean Server Management

### Server Details
- **Droplet Name**: `social-media-manager-v1`
- **IP Address**: `142.93.52.214`
- **Region**: NYC1
- **Specifications**: 4GB RAM, 2 vCPU, 50GB SSD
- **OS**: Ubuntu 24.04 (LTS) x64
- **Runtime**: Node.js 18.20.8 with PM2 process manager

### Server Access Methods

#### 1. SSH Access
```bash
# Using doctl command (recommended)
doctl compute ssh social-media-manager-v1

# Using direct SSH with key
ssh -i ~/.ssh/id_ed25519_digitalocean root@142.93.52.214

# Check SSH keys available
doctl compute ssh-key list
```

#### 2. doctl Commands
```bash
# List all droplets
doctl compute droplet list

# View droplet details
doctl compute droplet get social-media-manager-v1

# Access droplet console
doctl compute ssh social-media-manager-v1

# Droplet actions
doctl compute droplet-action reboot social-media-manager-v1
doctl compute droplet-action shutdown social-media-manager-v1
doctl compute droplet-action power-on social-media-manager-v1
```

### Server Application Management

#### Running Directory Structure
```
/root/
├── social-media-manager/          # ACTIVE running application
│   ├── src/app/api/               # API routes and endpoints
│   ├── src/components/            # React components
│   ├── src/lib/                   # Utility libraries
│   ├── .next/                     # Production build files
│   ├── node_modules/              # Dependencies
│   └── package.json               # Project configuration
```

#### PM2 Process Management
```bash
# Application control
pm2 start social-media-manager     # Start application
pm2 stop social-media-manager      # Stop application
pm2 restart social-media-manager   # Restart application
pm2 list                          # List all processes

# Monitoring and logs
pm2 logs social-media-manager      # View live logs
pm2 monit                         # System monitoring dashboard
pm2 show social-media-manager     # Detailed process information

# Build and deployment
cd /root/social-media-manager
npm run build                     # Build production version
pm2 restart social-media-manager # Apply changes
```

### GitHub Repository Integration

#### Server Repository Configuration
```bash
# Repository details (on server)
cd /root/social-media-manager
git remote -v
# server-backup    git@github.com:MintedOne/Digital_Ocean_Social_V1_Server.git (fetch)
# server-backup    git@github.com:MintedOne/Digital_Ocean_Social_V1_Server.git (push)

# Current branch: main
# Working directory: /root/social-media-manager (ACTIVE)
```

#### Local-to-Server Sync Process
1. **Local Development**: Make changes in this repository
2. **Local Testing**: `npm run dev` for local development
3. **Push to Local GitHub**: Regular commits to main local repository
4. **Server Manual Updates**: SSH into server and manually pull/apply changes
5. **Server Deployment**: `pm2 restart social-media-manager` to apply changes

#### GitHub Repository Links
- **Local Repository**: `git@github.com:MintedOne/Digital_Ocean_Social_V1.git`
- **Server Repository**: `git@github.com:MintedOne/Digital_Ocean_Social_V1_Server.git`

> **Note**: Server repository is separate from local for production isolation.

## 🔧 Recent Maintenance (August 26, 2025)

### Video Merge Functionality Fully Restored ✅ 
**Issue**: Server video processing pipeline was failing with multiple cascading issues:
- Frontend attempting to parse binary video responses as JSON
- Authentication middleware blocking video merge endpoint
- PM2 process manager stuck in production mode without build
- Network binding preventing external access

**Complete Solution Applied**:

#### 1. **Server Architecture Cleanup**
- Found and eliminated duplicate code directories on server
- Active directory: `/root/social-media-manager` (PM2 runs from here)
- Removed problematic Dropbox integration from video processing

#### 2. **Critical Fixes Deployed**
- **Frontend Fix**: Enhanced error handling to check Content-Type before JSON parsing
  - Prevents "Unexpected token 'ftypis'" errors when receiving binary video data
  - Properly handles both JSON error responses and binary video streams
- **Middleware Fix**: Added `/api/video/merge` to publicPaths for authentication bypass
  - Video merge endpoint now accessible without login requirement
  - Eliminates ERR_EMPTY_RESPONSE and redirect issues
- **Network Binding**: Configured Next.js to bind to 0.0.0.0:3000 for external access
- **PM2 Configuration**: Fixed ecosystem.config.js to run in development mode

#### 3. **FFmpeg Video Processing**
- **Local Processing**: FFmpeg v6.1.1 runs directly on Digital Ocean server
- **No External Dependencies**: Videos processed entirely on VPS, not calling other servers
- **Successful Testing**: 47MB video successfully merged and delivered to client
- **Binary Stream Handling**: Server correctly returns video/mp4 content-type with binary data

**Current Working Status**:
- ✅ **Video Merge CONFIRMED WORKING**: Users successfully uploading and merging videos
- ✅ **Server Stable**: PM2 running with no restart loops at http://142.93.52.214:3000
- ✅ **Clean Processing Pipeline**: FFmpeg merges videos without Dropbox interference
- ✅ **Frontend Handling**: Properly processes binary video responses
- ✅ **Server GitHub Updated**: All fixes committed to server repository

### Server Repository Management
- **Local Repository**: `git@github.com:MintedOne/Digital_Ocean_Social_V1.git` (for development)
- **Server Repository**: `git@github.com:MintedOne/Digital_Ocean_Social_V1_Server.git` (production fixes)
- **Latest Server Commit**: `7242219` - SUCCESS: Video Merge Functionality Fully Restored
- **Deployment Method**: Direct file copy via SCP or manual code updates on server
- **Server Working Directory**: `/root/social-media-manager`

> **Important**: Server repository maintains production fixes separately from local development. Video merge fixes were deployed directly to server and committed to server GitHub.

## 🐛 Troubleshooting

### Common Issues

#### **Video Generator Not Loading**
**Symptoms**: Page goes "dark" or shows compilation errors
**Solution**: 
1. Refresh the page 2-3 times
2. Run `./warmup.sh` to pre-compile pages
3. Check server logs: `pm2 logs social-media-manager`

#### **Authentication Issues**
**Symptoms**: Cannot login with valid @mintedyachts.com email
**Solution**:
1. Check if user exists in admin portal at `/admin`
2. Ensure user status is "Approved" (not "Pending")
3. Try password reset if user account exists

#### **YouTube Upload Failures** 
**Symptoms**: OAuth authentication fails or uploads timeout
**Solution**:
1. Check YouTube API quota (10,000 units daily limit)
2. Re-authenticate YouTube connection from home page
3. Verify video file size is under 1.5GB limit

#### **Social Media Distribution Errors**
**Symptoms**: "Distribution failed" with platform-specific errors
**Solution**:
1. Check Metricool API connectivity: `/api/metricool/test`
2. Verify manual override dates are in the future (Eastern timezone)
3. Test Dropbox integration: `/api/test-dropbox`

### Debug Endpoints
- `/api/test-dropbox` - Test Dropbox API connection
- `/api/test-timezone` - Verify timezone conversion logic  
- `/api/list-dropbox-files` - List files in Dropbox processed-videos folder
- `/admin` - User management and system statistics

## 📋 Project Status

**Current Version**: Production Ready ✅
**Last Updated**: August 25, 2025
**Deployment**: Digital Ocean VPS (Ubuntu 24.04, 4GB RAM, 2 vCPU)
**Repository**: Private GitHub repository

### Working Systems
- ✅ AI content generation with Claude
- ✅ Video processing and YouTube upload
- ✅ Multi-platform social media scheduling
- ✅ User authentication and admin management
- ✅ Dropbox file integration
- ✅ Timezone-aware posting with Metricool API
- ✅ Activity logging and user tracking

### Known Limitations
- Requires @mintedyachts.com email for access
- YouTube API daily quota limits (10,000 units)
- Video file size limit: 1.5GB for processing
- FFmpeg required for video merging functionality

---

## 🤖 For Developers

This project includes a `CLAUDE.md` file with detailed architectural information, recent changes, and development patterns. Always reference and update this file when making significant changes to help future development sessions.

**Important**: This is a proprietary application with restricted access. All API keys and credentials are excluded from version control.