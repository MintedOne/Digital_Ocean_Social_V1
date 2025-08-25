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