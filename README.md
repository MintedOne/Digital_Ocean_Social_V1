# AI Avatar Yacht Project - Victoria Sterling

An intelligent yacht consultation system featuring Victoria Sterling, an AI-powered yacht consultant specializing in the $200k-$5M yacht market.

## 📍 Repository Location

This project is maintained as a **private repository** on GitHub:
- **Repository**: [MintedOne/AI_Avatar_Vic](https://github.com/MintedOne/AI_Avatar_Vic)
- **Visibility**: Private (Proprietary to Minted Yachts)
- **Access**: Restricted to authorized team members only

## Project Overview

Victoria Sterling is an AI yacht consultant with an Australian personality, designed to help clients navigate the yacht market with professional expertise and warm, knowledgeable guidance. The system provides personalized yacht recommendations, market insights, and comprehensive consultation services.

## ✅ Current Working Features (Last Updated: August 1, 2025)

### 🎉 **LATEST UPDATE**: Complete YouTube Integration Live!
- **✅ Phase 3 YouTube Upload** - Direct upload from browser to YouTube
- **✅ OAuth2 Authentication** - Secure YouTube account connection with auto-refresh
- **✅ Home Page YouTube Status** - Global authentication status and one-click connect
- **✅ Perfect Metadata Parsing** - Correctly extracts YOUTUBE TITLE and DESCRIPTION sections
- **✅ Custom Thumbnail Support** - Upload custom thumbnails with videos
- **✅ Complete End-to-End Workflow** - Script → Process → Upload → Share YouTube link

### 🤖 Victoria Sterling AI Personality - NOW WITH SALES FOCUS
- **CLOSER Framework Integration**: Emotionally connects while qualifying leads
- **BANT Methodology**: Naturally qualifies Budget, Authority, Need, Timeline
- **Dynamic Response Length**: Brief initially (1-2 sentences), expands with engagement
- **Lead Capture Focus**: Guides conversations toward contact collection in 7-10 exchanges

### 💬 Perfect Chat Interface
- **Word-by-word typing effect** (160ms timing) - realistic conversation flow
- **Delayed typing indicator** - "Victoria is typing..." appears after 0.5 seconds
- **Line breaks after sentences** - improved readability
- **Test buttons for buyer personas** - Family Cruiser, Luxury Charter, Brand Compare
- **Mobile-responsive yacht club themed UI** with professional blue/gold design
- **Proper input text color** - dark gray for visibility

### 🛥️ Yacht Consultation Services
- **Yacht Selection & Purchasing Advice**
- **Market Analysis & Pricing Insights**
- **Charter vs Ownership Consultation**
- **Yacht Financing Options**
- **Maintenance & Operational Cost Guidance**
- **Brand Recommendations** (Azimut, Princess, Sunseeker, Fairline, Riviera, Maritimo, etc.)

### 🎬 Video Content Generator - FULLY FEATURED!

#### **Phase 1: Content Generation**
- **Professional YouTube Script Generation** - Creates engaging yacht marketing scripts
- **Complete Metadata Package** - Titles, descriptions, tags, competitive analysis
- **Character Count Calculation** - Precise timing based on video length (minutes × 836)
- **Creatify Integration Ready** - Scripts optimized for AI video creation
- **Copy & Download Functions** - Easy content export for immediate use
- **SEO-Optimized Content** - YouTube-ready titles and descriptions with proper keywords
- **Competitive Analysis** - Builder comparisons and market positioning
- **Thumbnail Title Suggestions** - 10-15 engaging options for video thumbnails
- **Auto-Save to Dropbox** - Automatically saves scripts and metadata to claude-output folder
- **Iterative Feedback System** - Give feedback on scripts for continuous refinement
- **YouTube Short Generator** - Create optimized short-form content with customizable length and tone
- **Research Tools Integration** - Direct links to Yatco photos, Google search, and YouTube research
- **Collapsible Interface** - Clean, organized UI with expandable sections

#### **🚀 Phase 2: Server-Side Video Processing - NEW!**
- **Server-Side FFmpeg Processing** - Handles large video files (500MB+) without browser limitations
- **Professional Video Merging** - Seamlessly combines Creatify exports with outro videos
- **Default Outro Management** - Set and manage default outro videos for efficient workflow
- **Custom Outro Support** - Upload different outros for specific projects
- **Drag-and-Drop Video Upload** - Intuitive file upload with validation
- **Real-Time Processing Status** - Progress indicators for upload, processing, and download
- **Automatic Metadata Application** - Applies Phase 1 metadata to final videos
- **Project Management** - IndexedDB storage for video projects and settings
- **Past Projects Access** - Quick access to previous scripts and metadata
- **Stream-Based File Handling** - Efficient memory management for large files

#### **📺 Phase 3: YouTube Integration - PRODUCTION READY!**
- **🆕 Home Page OAuth Status** - Global YouTube connection status with one-click authentication
- **🆕 Perfect Metadata Parsing** - Correctly extracts "📌 1. YOUTUBE TITLE" and "📌 2. YOUTUBE DESCRIPTION" sections
- **OAuth2 Authentication** - Secure YouTube account connection with automatic token refresh (1-hour sessions)
- **Direct Video Upload** - Upload processed videos directly to YouTube from the browser
- **Metadata Integration** - Automatically applies Phase 1 metadata (title, description, tags)
- **Privacy Controls** - Upload as Unlisted (recommended), Private, or Public
- **Playlist Management** - Automatically add videos to "YachtSpecsDirect.com" playlist or custom playlists
- **Custom Thumbnail Support** - Upload custom thumbnails (JPG/PNG, up to 2MB, 1280x720 recommended)
- **Real-Time Upload Progress** - Progress tracking with detailed status messages
- **YouTube URL Generation** - Get shareable YouTube links immediately after upload
- **Error Handling & Retry** - Robust error handling with authentication recovery
- **Channel Information** - Display connected YouTube channel details
- **Multi-Session Support** - Authenticate once, upload multiple videos within session

## Technical Implementation

### Technologies Used
- **Next.js 14** with App Router and API Routes
- **React & TypeScript** for type-safe development
- **Node.js Runtime** for server-side video processing
- **System FFmpeg** via child_process for reliable video operations
- **IndexedDB** (via idb library) for client-side project storage
- **Vercel AI SDK** for streaming chat responses
- **Anthropic Claude** (claude-3-5-sonnet-20240620) for AI responses
- **🆕 Google APIs Client** (googleapis) for YouTube integration
- **🆕 OAuth2 Authentication** for secure YouTube access with token refresh
- **TailwindCSS** for responsive yacht club styling
- **UUID** for unique file handling and session management

### Key Components

#### Victoria Persona System (`src/lib/victoria/persona.ts`)
- Comprehensive personality configuration
- Market expertise and knowledge base
- Australian voice characteristics
- Professional consultation prompts

#### Chat Interface (`src/components/VictoriaChat.tsx`)
- Full-screen yacht club themed chat interface
- Custom typing animation system
- Responsive message bubbles
- Professional header with Victoria branding

#### API Integration
- **Victoria Chat** (`src/app/api/victoria/chat/route.ts`) - Secure Claude AI integration with streaming
- **Video Generator** (`src/app/api/video-generator/route.ts`) - Script and metadata generation
- **Dropbox Save** (`src/app/api/save-to-dropbox/route.ts`) - Auto-save functionality
- **Video Processing** (`src/app/api/video/merge/route.ts`) - Server-side FFmpeg video merging
- **🆕 YouTube Authentication** (`src/app/api/youtube/status/route.ts`) - OAuth2 authentication management
- **🆕 YouTube Upload** (`src/app/api/youtube/upload/route.ts`) - Direct video upload to YouTube
- **🆕 YouTube Callback** (`src/app/api/youtube/auth/callback/route.ts`) - OAuth2 callback handler

#### Video Processing System (`src/lib/video-processing/`)
- **Storage** (`storage.ts`) - IndexedDB project and outro management
- **Metadata Utils** (`metadata-utils.ts`) - YouTube metadata parsing and tag optimization
- **FFmpeg Utils** (`ffmpeg-utils.ts`) - File validation and utility functions

#### 🆕 YouTube Integration System (`src/lib/youtube/`)
- **Authentication** (`auth.ts`) - OAuth2 authentication with automatic token refresh
- **Uploader** (`uploader.ts`) - Video upload to YouTube with progress tracking
- **Metadata Parser** (`metadata.ts`) - Phase 1 content parsing and YouTube optimization

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Anthropic API key
- **System FFmpeg installation** (for Phase 2 video processing)
  - macOS: `brew install ffmpeg`
  - Ubuntu/Debian: `sudo apt install ffmpeg`
  - Windows: Download from [ffmpeg.org](https://ffmpeg.org/download.html)
- **🆕 YouTube API Credentials** (for Phase 3 YouTube integration)
  - Google Cloud Console project with YouTube Data API v3 enabled
  - OAuth2 client credentials (Client ID and Client Secret)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/MintedOne/AI_Avatar_Vic.git
   cd AI_Avatar_Vic
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env.local` file:
   ```env
   # AI Avatar Project Environment Variables
   
   # Anthropic Claude API Key (Required)
   ANTHROPIC_API_KEY=your_anthropic_api_key_here
   
   # YouTube API Configuration (Required for YouTube Upload)
   YOUTUBE_CLIENT_ID=your_youtube_client_id_here
   YOUTUBE_CLIENT_SECRET=your_youtube_client_secret_here
   YOUTUBE_REDIRECT_URI=http://localhost:3000/api/youtube/auth/callback
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to `http://localhost:3000` to start chatting with Victoria Sterling

## Usage

### Interacting with Victoria
- **Yacht Purchase Consultation**: Ask about yacht recommendations for your budget and needs
- **Market Insights**: Get current market trends and pricing information  
- **Brand Comparisons**: Compare different yacht manufacturers and models
- **Financing Advice**: Learn about yacht financing options and considerations
- **Operational Guidance**: Understand maintenance, insurance, and operational costs

### Example Conversations
- "I'm looking for a 40-foot motor yacht under $500k. What would you recommend?"
- "What's the difference between Azimut and Princess yachts?"
- "Should I buy or charter a yacht for weekend use?"
- "What are the ongoing costs of owning a $2M yacht?"

### Video Generator Usage

#### **Phase 1: Content Generation**
- Navigate to `/video-generator` from the main portal
- Enter manufacturer (e.g., "Ferretti"), model (e.g., "500"), and video length in minutes
- Generate professional YouTube scripts and complete metadata packages
- **Auto-save feature**: Files automatically saved to `Dropbox/Minted Yachts Marketing/claude-output/`
  - Script file: `Manufacturer-Model-script.txt`
  - Metadata file: `Manufacturer-Model-youtube.txt`
- **Feedback system**: Click "Give Feedback" to iteratively improve scripts
- **YouTube Shorts**: Generate short-form content with customizable length (15-60s) and tone
- **Research tools**: Quick access to Yatco photos, Google search, and YouTube research
- Copy or download content for immediate use in video production

#### **🆕 Phase 2: Video Processing**
- **Upload Main Video**: Drag and drop your Creatify export (up to 500MB)
- **Configure Outro**: Choose default outro or upload custom outro
- **Set Default Outro**: Upload outro once, use for all future videos
- **Server Processing**: Videos processed server-side for reliability
- **Download Result**: Get professionally merged video with metadata
- **Project Management**: Access past projects and scripts
- **One-Click Workflow**: After setup, process videos in seconds

#### **📺 Phase 3: YouTube Upload - PRODUCTION READY!**

**🚀 Recommended Workflow (Home Page First):**
1. **Home Page OAuth**: Click "🔐 Connect" in header to authenticate YouTube (1-hour session)
2. **Generate Content**: Navigate to Video Generator → Create yacht marketing content
3. **Process Video**: Upload Creatify export, merge with outro, download final video
4. **Upload to YouTube**: One-click upload with automatic metadata application
5. **Share**: Get instant YouTube URL for marketing campaigns

**⚡ Alternative Workflow (In-Process Authentication):**
- Generate content → Process video → Authenticate → Upload (still available)

**🎯 Key Features:**
- **Perfect Metadata Extraction**: Correctly parses "📌 1. YOUTUBE TITLE" and "📌 2. YOUTUBE DESCRIPTION"
- **Global Authentication Status**: See YouTube connection status from home page
- **Custom Thumbnail Support**: Upload custom thumbnails (optional)
- **Privacy Controls**: Upload as Unlisted (recommended), Private, or Public
- **Playlist Auto-Add**: Videos automatically added to "YachtSpecsDirect.com" playlist
- **Multi-Video Sessions**: Authenticate once, upload multiple videos
- **Real-Time Progress**: Detailed upload progress with status messages
- **Instant Sharing**: Get YouTube URLs immediately for marketing distribution

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── victoria/chat/          # Victoria chat API endpoint
│   │   ├── video-generator/        # Video content generation API
│   │   ├── save-to-dropbox/        # Auto-save to Dropbox folder API
│   │   ├── video/merge/            # Server-side video processing API
│   │   └── 🆕 youtube/             # YouTube integration APIs
│   │       ├── auth/callback/      # OAuth2 callback handler
│   │       ├── status/             # Authentication status management
│   │       └── upload/             # Video upload to YouTube
│   ├── video-generator/            # Video generator page (Phase 1, 2 & 3)
│   ├── page.tsx                    # Main application page
│   └── layout.tsx                  # App layout
├── components/
│   ├── VictoriaChat.tsx           # Main chat interface
│   └── StaticWelcome.tsx          # Welcome message with typing effect
├── lib/
│   ├── victoria/
│   │   └── persona.ts              # Victoria personality configuration
│   ├── video-processing/           # Phase 2 video processing utilities
│   │   ├── storage.ts              # IndexedDB project management
│   │   ├── metadata-utils.ts       # YouTube metadata parsing
│   │   └── ffmpeg-utils.ts         # File validation utilities
│   └── 🆕 youtube/                 # Phase 3 YouTube integration
│       ├── auth.ts                 # OAuth2 authentication with token refresh
│       ├── uploader.ts             # Video upload with progress tracking
│       └── metadata.ts             # Phase 1 content parsing for YouTube
├── 🆕 config/                      # Configuration files (excluded from git)
│   └── youtube-credentials.json    # YouTube OAuth2 tokens (auto-generated)
└── temp/                           # Server-side temporary files (auto-cleaned)
```

## Deployment

The application is designed for deployment on Vercel with automatic environment variable integration:

1. **Connect your repository** to Vercel
2. **Set environment variables** in Vercel dashboard
3. **Deploy automatically** on every commit to main branch

## Security Features

### 🔐 API Key Management & Security

**Where API Keys Are Stored:**
- **Local Development**: API keys are stored in `.env.local` file in project root
- **Production**: Environment variables are configured in deployment platform (Vercel)
- **Location**: `/Users/[username]/[project-path]/.env.local` (local development only)

**GitHub Backup & Security:**
- **✅ API keys are NOT backed up to GitHub** - `.env.local` is in `.gitignore`
- **✅ NOT publicly accessible** - Private repository with restricted access
- **✅ No API keys in commit history** - All secrets use environment variables only
- **⚠️ Local backup responsibility** - `.env.local` exists only on your machine

**How the System Retrieves API Keys:**
```typescript
// System reads from environment variables at runtime
const apiKey = process.env.ANTHROPIC_API_KEY;
```

**Security Best Practices:**
- **Environment-based API keys** - No hardcoded secrets in code
- **Secure API routes** with proper error handling  
- **Git security** - All secrets use environment variables
- **Production-ready** security practices
- **Private repository** - Restricted to authorized team members only

**⚠️ Important Notes:**
- If you lose your `.env.local` file, you'll need to recreate it with your API keys
- Never commit `.env.local` or share API keys in messages/screenshots
- Keep backup of your API keys in a secure password manager

## Future Enhancements

- **User authentication** with Firebase Auth
- **Conversation history** with Firestore
- **Yacht database integration** for real-time inventory
- **Image generation** for yacht visualizations
- **Multi-language support** for international clients
- **Voice interaction** capabilities
- **Mobile app** development

## Contributing

This is a proprietary project for Minted Yachts. For development questions or feature requests, contact the development team.

## 🔧 Development Best Practices

### **🌿 Branch Strategy & Safe Development**

**Feature Branch Workflow:**
We use feature branches for safe development and testing:

1. **Main Branch Protection:**
   ```bash
   # Main branch contains stable, tested code
   git checkout main  # Switch to stable main branch
   ```

2. **Feature Branch Development:**
   ```bash
   # Create feature branch for new development
   git checkout -b feature/descriptive-name
   
   # Work safely on feature branch
   git commit -m "Incremental improvements"
   git push origin feature/descriptive-name
   ```

3. **Current Feature Branch:**
   - **Branch**: `feature/phase2-video-processing-improvements`
   - **Purpose**: Restore Phase 1 functionality, improve Phase 2 integration
   - **Status**: Active development - safe testing environment

4. **Merge Back When Ready:**
   ```bash
   # When feature is complete and tested
   git checkout main
   git merge feature/phase2-video-processing-improvements
   git push origin main
   ```

**Benefits:**
- ✅ **Main branch stays stable** - existing code protected
- ✅ **Safe experimentation** on feature branches
- ✅ **Easy rollback** - just switch branches
- ✅ **Incremental commits** without affecting main
- ✅ **Clean merge** when features complete

### **⚠️ IMPORTANT: Smart Backup Strategy**
When working with AI assistance (Claude Code), follow these practices:

1. **For Testing & Experimentation:**
   - Work on feature branches for safety
   - Test functionality thoroughly before deciding to preserve

2. **After MAJOR Feature Completions:**
   - **Commit to feature branch** for incremental backup
   - **Only merge to main** when user confirms the changes are complete
   - **Update README** with new features and current state
   - **Document the commit ID** for easy rollback if needed

3. **Recovery Commands:**
   ```bash
   # Switch back to stable main branch
   git checkout main
   
   # Or restore to last perfect working version (commit: 861e80e)
   git reset --hard 861e80e
   ```

### **🤖 AI Assistant Protocol**
- **Use feature branches** for safe development
- **Commit to feature branch** for incremental backup (not main)
- **Always test functionality** before considering changes "complete"  
- **Ask permission** before merging anything to main branch
- **Preserve working versions** - but avoid commit spam on main

### **📅 Daily Development Workflow**
1. **Start of day**: Check that everything still works from last save point
2. **During work**: Use feature branches, commit frequently for backup
3. **When features complete**: Test thoroughly, then merge to main
4. **End of session**: Commit progress to feature branch for backup

### **🏁 Hard Points (Major Milestones)**
Special checkpoints for major achievements - not daily, but for significant completions:

- **Current**: v1.0-working-victoria (July 31, 2025) - Perfect typing effects, test buttons, concise responses
- **Recovery Command**: `git checkout v1.0-working-victoria`
- **Create new hard points**: After major feature completions only (weekly/monthly)
- **Examples**: Completing voice chat, adding yacht images, major UI overhauls

```bash
# Create a hard point (major milestone)
git tag -a v1.1-voice-chat -m "Added voice chat feature"
git push origin --tags

# Return to a hard point
git checkout v1.0-working-victoria
```

### **🚨 Lessons Learned**
- Working versions that exist only locally can be lost during git operations
- Always commit working states before experimenting with new features
- Use branches for major experiments: `git checkout -b feature/experiment-name`
- **Daily commits** for regular saves, **hard points** for major milestones

## License

Private repository - All rights reserved by Minted Yachts.

---

**Victoria Sterling - Your Expert Yacht Consultant** 🛥️ 
*Specializing in the $200k-$5M yacht market with Australian expertise and warmth.*

**Current Working Version**: Commit 861e80e - "Perfect Working Victoria Sterling Implementation"