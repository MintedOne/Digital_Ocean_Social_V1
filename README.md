# Digital Ocean Social V1 - Social Media Management Platform

A comprehensive social media management platform built on Next.js with AI-powered content generation, video processing, and multi-platform distribution capabilities.

## 📍 Repository Location

This project is maintained as a **private repository** on GitHub:
- **Repository**: [Digital_Ocean_Social_V1](https://github.com/MintedOne/Digital_Ocean_Social_V1)
- **Visibility**: Private (Proprietary)
- **Access**: Restricted to authorized team members only

## 🚀 Repository Migration - Completed August 24, 2025

### Recent Migration from Local_Social_Media_Manager
This project was successfully migrated from the original `Local_Social_Media_Manager` repository to provide a cleaner GitHub presence and better organization:

**Migration Steps Completed:**
- ✅ **Disconnected from old repository**: Removed connection to `https://github.com/MintedOne/Local_Social_Media_Manager-`
- ✅ **Connected to new repository**: Established connection to `https://github.com/MintedOne/Digital_Ocean_Social_V1`
- ✅ **Transferred working configuration**: Copied all API keys, credentials, and configuration files from working project
- ✅ **Preserved user data**: Migrated activity logs, user database, and system configuration
- ✅ **Maintained security**: All sensitive files properly gitignored while preserving local functionality

**Files Successfully Migrated:**
- 🔑 **`.env.local`** - All working API keys and environment configuration (10 environment variables)
- 📁 **`config/youtube-credentials.json`** - YouTube API credentials and OAuth tokens
- 📊 **`data/activity-log.json`** & **`data/users.json`** - Complete user database and activity tracking
- ⚙️ **`src/config/firebase-urls.ts`** - Firebase configuration settings

**Ready for Development:**
```bash
# Navigate to project directory
cd "/Users/mintedone/Library/CloudStorage/Dropbox/AI Avatar/Digital_Ocean_Try/Digital_Ocean_Social_V1"

# Install dependencies (required first time)
npm install

# Start development server
npm run dev
```

The application is now ready to run with all working API keys and configuration from the original project. All features should work exactly as before, including Victoria chat, video generation, YouTube integration, and admin functionality.

## 🤖 For Claude Code Developers

**Important**: This project includes a `CLAUDE.md` file specifically designed to help Claude Code instances understand the project architecture, recent changes, and development patterns quickly. 

**⚠️ Claude Code Instruction**: Always update `CLAUDE.md` after major changes, feature completions, or architectural modifications to help future Claude Code sessions.

## Project Overview

Digital Ocean Social V1 is a comprehensive social media management platform that combines AI-powered content generation with automated video processing and multi-platform distribution. The system provides tools for creating, processing, and distributing social media content across various platforms including YouTube, Twitter, Facebook, Instagram, LinkedIn, TikTok, and Google Business.

## ✅ Current Working Features (Last Updated: August 22, 2025)

### 🎉 **SEGMENT 4 COMPLETE**: Activity Log Layout Redesign & Enhanced User Tracking with Smart Debouncing - PRODUCTION READY!
- **📊 COMPLETE ACTIVITY LOG REDESIGN** - Moved from tab navigation to separate collapsible section below user table
- **🔄 ENHANCED USER TRACKING SYSTEM** - Comprehensive tracking for all main application features with detailed activity logging
- **🎯 MAIN FEATURE TRACKING** - Victoria Chat, Video Generator, Video Processing, YouTube Upload, and Admin Portal access tracking
- **🚀 OPTIMIZED ADMIN PORTAL LOGGING** - Session-based debouncing prevents duplicate admin access entries (30-minute intervals)
- **⚡ SMART LOGGING DEBOUNCE** - Server-side session tracking eliminates excessive duplicate activity log entries
- **👤 IMPROVED USER MANAGEMENT** - Enhanced profile forms with full address support on auth-status page
- **📈 COMPREHENSIVE ACTIVITY TYPES** - Login/logout, profile updates, chat interactions, video generation, processing, uploads
- **🎨 BETTER UI SEPARATION** - Clean separation between user management and activity monitoring with collapsible interface
- **🔒 ENHANCED API SECURITY** - All main application endpoints now track user activities with detailed context
- **📝 ACTIVITY CONTEXT TRACKING** - IP addresses, user agents, timestamps, and specific action details for all activities
- **🎯 ADMIN ACTIVITY INSIGHTS** - Color-coded activity types with comprehensive session tracking and monitoring
- **✅ COLLAPSIBLE INTERFACE** - localStorage persistence for activity log expand/collapse state with smooth animations

### 🎉 **SEGMENT 3 ENHANCED**: User Registration & Personalization Improvements - PRODUCTION READY!
- **✅ SEPARATE NEW USER REGISTRATION** - Clean "New User - Request Access" button with dedicated form
- **✅ OPTIONAL CONTACT DETAILS** - firstName, lastName, phoneNumber collected during registration
- **✅ ENHANCED ADMIN PORTAL** - New "Contact Info" column displays all user details
- **✅ PERSONALIZED WELCOME MESSAGES** - "Welcome back, [FirstName]!" throughout application
- **✅ SMART PROFILE DISPLAYS** - Real names prioritized over generic displayName everywhere
- **✅ ENHANCED USER DROPDOWN** - Shows actual names in header profile sections
- **✅ PERSONALIZED CHAT CALLS** - "Start Your Consultation, [FirstName]!" buttons
- **✅ COMPREHENSIVE USER MANAGEMENT** - Admins see full contact details for better support

### 🎉 **SEGMENT 1 COMPLETE**: Basic Email Validation & Database Setup - MERGED TO MAIN!
- **🔐 AUTHENTICATION SYSTEM COMPLETE** - Full user authentication infrastructure with persistent sessions
- **📧 DOMAIN-BASED EMAIL VALIDATION** - Strict @mintedyachts.com validation with security through obscurity
- **💾 LOCAL JSON USER DATABASE** - File-based user storage with automatic admin user creation
- **🍪 PERSISTENT SESSION MANAGEMENT** - 7-day cookie sessions survive Fast Refresh and page navigation
- **🎨 SEPARATED USER PROFILE DROPDOWN** - Clean UI positioning in upper-right corner, separate from YouTube status
- **🔒 EDGE RUNTIME COMPATIBLE MIDDLEWARE** - Auto-redirects unauthenticated users to login page
- **✅ NAVIGATION PERSISTENCE FIX** - Sessions no longer lost during quick page navigation
- **🛡️ UX IMPROVEMENTS** - Email field clears automatically on authentication failures
- **🔧 SESSION DEBUGGING** - Enhanced logging for session creation and validation tracking

### 🎉 **SEGMENTS 1 & 2 MERGED TO MAIN**: Complete Authentication & Admin System - PRODUCTION READY!
- **🔑 ADMIN PORTAL AT /admin** - Complete administrative dashboard with professional yacht club UI
- **👑 DEFAULT ADMIN USERS** - info@mintedyachts.com, admin@mintedyachts.com, ts@mintedyachts.com auto-created as admins
- **📊 USER MANAGEMENT INTERFACE** - Full CRUD operations with status-based filtering and real-time statistics
- **⏳ PENDING USER APPROVAL SYSTEM** - New users start as "pending", require admin approval before login
- **🔐 ADMIN AUTHENTICATION FLOW** - Secure privilege checking with admin-only access controls
- **🛡️ USER STATUS MANAGEMENT** - Pending/Approved/Blocked status system with role-based permissions
- **👥 ROLE MANAGEMENT** - Promote users to admin, demote admins to users with safety protections
- **📈 REAL-TIME STATISTICS** - Dashboard shows user counts by status and role with live updates
- **🎯 ADMIN-ONLY UI ELEMENTS** - Admin portal link appears in profile dropdown only for admin users
- **🔒 SECURITY PROTECTIONS** - Admins cannot block themselves, users cannot block admins, comprehensive validation
- **🗑️ SECURE USER DELETION** - Permanent removal of blocked users with strict protections (ts@mintedyachts.com cannot be deleted)
- **📊 CLICKABLE STATISTICS CARDS** - Interactive dashboard cards filter user list with hover effects and visual feedback
- **👤 STANDARD USERS FILTER** - Dedicated "Standard Users" tab and filter for non-admin users with clear labeling
- **✅ FINAL TESTING COMPLETE** - All admin portal features tested and production-ready for merge to main
- **🧠 MIN-BASED ALGORITHM** - Only considers POPULATED weeks for level calculation, ignores empty weeks
- **🔄 UNIFIED CASCADE LOGIC** - Both Smart Insights and actual scheduling use CascadingScheduler.getNextAction()
- **🌊 COMPLETE WEEK SATURATION** - Aug 22-27: fill to Level 2 before Aug 28+ starts
- **✅ Enhanced Cascade Scheduler** - Intelligent topic-based scheduling with proper date progression
- **✅ BREAKTHROUGH: Calendar API Working** - Successfully retrieving actual scheduled posts from Metricool
- **✅ 4-Week Content Calendar** - Visual calendar display showing real scheduled posts across all platforms  
- **✅ MetricoolCalendarReader Class** - Fully functional READ-ONLY API integration for calendar data retrieval
- **✅ API Parameter Fix** - Resolved datetime format issues (yyyy-MM-ddTHH:mm:ss required, not yyyy-MM-dd)
- **✅ Smart Scheduling Analysis** - AI-powered recommendations based on existing calendar data
- **✅ Optimal Time Suggestions** - Calculates best posting times to avoid busy periods
- **✅ Platform Distribution Analysis** - Shows actual posting breakdown across Twitter, Facebook, Instagram, etc.
- **✅ Calendar-Based Posting** - Social distribution integration with Enhanced Cascade Scheduler
- **✅ Real-Time Calendar Refresh** - Updates calendar data as needed from live Metricool API
- **✅ Robust Error Handling** - Detailed logging and fallback mechanisms
- **✅ Multi-Platform Scheduling** - Post to Twitter, Facebook, Instagram, LinkedIn, TikTok, Google Business
- **✅ Dropbox Video Integration** - Handles 1.5GB+ videos with auto-download share links
- **✅ Enhanced Content Generation** - Platform-specific messaging with professional CTAs
- **✅ Resolution Auto-Scaling** - FFmpeg handles 4K + 1080p video combinations seamlessly
- **✅ Smart Platform Logic** - Twitter/GMB use YouTube URLs, others use Dropbox videos
- **✅ Smart Phase 2 Collapse** - Upload/config sections auto-hide after processing, YouTube upload stays visible
- **✅ Playlist Sorting** - Default "YachtSpecsDirect.com..." playlist now always appears at top of list
- **✅ Larson Scanner Progress Bar** - Purple KITT/Cylon-style scanner for Phase 1 generation
- **✅ Dynamic Status Messages** - Real-time updates during content generation process
- **✅ Optimized Scanner Animation** - Fast, smooth 16% width beam with full-range sweep
- **✅ Dynamic Playlist Selector** - Loads actual YouTube playlists with checkboxes
- **✅ Smart Default Selection** - "YachtSpecsDirect.com - New Yachts Hitting the Market..." auto-selected
- **✅ Comprehensive Auto-Collapse** - Entire YouTube section collapses after upload success
- **✅ Manual Collapse Controls** - Collapse/expand buttons for clean workflow management
- **✅ Enhanced Collapsed UI** - Shows connection status with expand/disconnect options
- **✅ YouTube Tags Fixed** - Robust extraction from Phase 1 sections (3 & 4) with strict API validation
- **✅ Perfect Description Upload** - YouTube descriptions upload correctly from Phase 1 content
- **✅ Smart Tag Combination** - Primary yacht tags + competitors + industry keywords for maximum SEO
- **✅ Enhanced Tag Validation** - 30-char limit per tag, safe character filtering, duplicate removal
- **✅ Video File Preservation** - Merged videos saved permanently for Phase 3 social distribution
- **🆕 400-Character Tag Limit** - Prevents intermittent YouTube upload failures at 498+ characters
- **✅ Enhanced Progress Bars** - Both merge and upload progress show file sizes
- **✅ Real-Time File Size Display** - See "125.3 MB / 280.7 MB" under progress bars
- **✅ Collapsible Phase 1 Inputs** - Form inputs collapse after content generation with refresh option
- **✅ Refresh Page Button** - Prevents multiple content generation attempts with clean reset

### 🚀 **Core YouTube Integration**
- **✅ Phase 2 YouTube Upload** - Direct upload from browser to YouTube
- **✅ OAuth2 Authentication** - Secure YouTube account connection with auto-refresh
- **✅ Dynamic Playlist Management** - Loads user's actual playlists with checkbox selection
- **✅ Smart Auto-Collapse UI** - Clean workflow with collapsible upload sections
- **✅ Home Page YouTube Status** - Global authentication status and one-click connect
- **✅ Custom Thumbnail Support** - Upload custom thumbnails with videos
- **✅ Complete End-to-End Workflow** - Script → Process → Upload → Share YouTube link

### 🔐 **SEGMENTS 1, 2 & 3: Complete Authentication System - PRODUCTION READY!**

#### **🆕 SEGMENT 3: Logins & Security + Enhanced User Experience - PRODUCTION READY (August 22, 2025)**

**Core Security Features:**
- **✅ Yearly Admin Passwords** - Working! Admin passwords: "SocialPosts" + current year (e.g., "SocialPosts2025")
- **✅ Gmail API Integration** - Working! Uses Gmail API directly instead of SMTP OAuth2
- **✅ Password Management** - bcrypt hashing with salt rounds, password strength validation implemented
- **✅ Admin Notification System** - Working! Emails sent to info@mintedyachts.com when new users register
- **✅ User Approval Email System** - Working! Password setup emails sent to approved users
- **✅ OAuth Authentication** - Successfully extended YouTube OAuth to include Gmail permissions
- **✅ Email Templates** - Professional HTML email templates for all notification types
- **✅ Security Improvements** - Removed password hints from login page for better security
- **✅ Password Setup Flow** - Users receive email with secure token-based password creation

**Enhanced User Experience Features:**
- **✅ NEW USER REGISTRATION SYSTEM** - Separate "New User" button with clean registration form
- **✅ OPTIONAL USER DETAILS** - Collect firstName, lastName, phoneNumber during registration  
- **✅ ENHANCED ADMIN PORTAL** - Displays full contact information for all users
- **✅ PERSONALIZED USER EXPERIENCE** - Names displayed throughout app (not just generic displayName)
- **✅ IMPROVED PROFILE DISPLAYS** - Real names in header dropdowns, admin interface, status pages
- **✅ SMART WELCOME MESSAGES** - "Welcome back, [FirstName]!" personalization
- **✅ ENHANCED CHAT INTEGRATION** - "Start Your Consultation, [FirstName]!" personalized CTAs
- **✅ COMPREHENSIVE CONTACT INFO** - Admin can see phone numbers and full names for user support
- **✅ CONSISTENT NAME DISPLAY** - Fixed user name display logic across all components with getUserDisplayName() utility
- **✅ CONSISTENT EMAIL NAMES** - Fixed email notifications to use proper names instead of displayName fallback
- **✅ EMAIL NOTIFICATIONS WORKING** - Fixed variable name bug that prevented admin notification emails from being sent

**Production Status:**
- **📧 Email Service**: Sends from mintedyachts@gmail.com using Gmail API
- **🔐 OAuth Integration**: YouTube OAuth with gmail.send scope working perfectly
- **✅ PRODUCTION TESTING**: Complete workflow tested - registration → admin approval → password setup → login

#### **SEGMENTS 1 & 2 COMPLETE: Authentication & Admin System - PRODUCTION READY**
- **✅ Domain-Based Email Validation** - Strict @mintedyachts.com validation with configurable domains
- **✅ Local JSON User Database** - File-based user storage with automatic admin creation and role management
- **✅ Persistent Session Management** - 7-day cookie sessions with globalThis persistence across Hot Module Reloads
- **✅ Professional Login Page** - Clean UI with security through obscurity and auto-clearing failed attempts
- **✅ Authentication Status Page** - Detailed user information and session management at `/auth-status`
- **✅ Separated User Profile Dropdown** - Upper-right header positioning, independent from YouTube status
- **✅ Edge Runtime Compatible Middleware** - Automatic route protection with proper authentication redirects
- **✅ Security Through Obscurity** - Generic error messages, no domain hints for unauthorized users
- **✅ Session Persistence Fix** - Sessions survive Fast Refresh, quick navigation, and server recompiles
- **✅ UX Improvements** - Email field auto-clears on authentication failures for better user experience
- **✅ Admin Portal at `/admin`** - Complete user management dashboard with admin-only access

### 🎉 **LATEST FIXES**: Metricool Timezone & UI Improvements - PRODUCTION READY! (August 25, 2025)

#### **🔧 CRITICAL TIMEZONE FIX** - Metricool API Scheduling Issues RESOLVED
- **✅ METRICOOL API QUIRK IDENTIFIED** - Despite setting `timezone="America/New_York"`, their API treats dateTime as UTC
- **✅ TIMEZONE OFFSET COMPENSATION** - Added +4 hours to scheduled times to compensate for Metricool's broken timezone logic  
- **✅ MANUAL OVERRIDE SCHEDULING WORKING** - Users can now schedule posts for specific dates without "datetime cannot be in the past" errors
- **✅ PROPER EDT/EST HANDLING** - System automatically adjusts for Eastern Daylight Time (-4 UTC) vs Eastern Standard Time (-5 UTC)
- **✅ SERVER DEPLOYMENT COMPLETE** - Timezone fix deployed and tested on Digital Ocean server
- **✅ SCHEDULING VERIFICATION** - Confirmed posts schedule correctly (11:00 AM EDT instead of failing at 3:25 AM)

#### **🎨 UI DISPLAY IMPROVEMENTS** - Better User Experience
- **✅ TIMEZONE DISPLAY FIX** - Frontend now shows times in Eastern timezone instead of browser's local timezone
- **✅ PROPER TIME FORMATTING** - Schedule results display format: "8/26/2025, 11:00:00 AM EDT" with timezone abbreviation
- **✅ SOCIAL PLATFORM VISIBILITY FIX** - Platform names (twitter, instagram, facebook, etc.) now display in readable dark gray instead of invisible white text
- **✅ ENHANCED DISTRIBUTION RESULTS** - Users can now clearly see which platforms were scheduled and their specific times

#### **🔍 DEBUGGING & TESTING INFRASTRUCTURE** 
- **✅ TIMEZONE TEST ENDPOINT** - `/api/test-timezone` shows current conversion logic vs proper timezone handling
- **✅ DROPBOX CONNECTION TEST** - `/api/test-dropbox` verifies API token status and account connectivity  
- **✅ DROPBOX FILE LISTING** - `/api/list-dropbox-files` shows processed videos in user's Dropbox account
- **✅ SERVER LOG ANALYSIS** - Comprehensive debugging of scheduling timestamps and Metricool API responses
- **✅ MIDDLEWARE UPDATES** - Added test endpoints to public paths for easy debugging access

#### **📊 CONFIRMED WORKING STATUS**
- **🎯 MANUAL OVERRIDE POSTING** - ✅ Working correctly with proper timezone compensation
- **🎯 METRICOOL SCHEDULING** - ✅ All 6 platforms (Twitter, Instagram, Facebook, TikTok, LinkedIn, GMB) scheduling successfully
- **🎯 DROPBOX INTEGRATION** - ✅ API connection working, file sharing operational
- **🎯 TIMEZONE CONVERSION** - ✅ Server time (UTC) → Metricool time (EDT) conversion working perfectly
- **🎯 UI DISPLAY** - ✅ Users see correct Eastern times in distribution results
- **✅ User Status System** - Pending/Approved/Blocked status with automatic approval workflow
- **✅ Role Management** - Promote/demote users with safety protections against self-modification
- **✅ Real-Time Statistics** - Live user counts and status tracking with filtered views
- **API Endpoints**: `/api/auth/*`, `/api/admin/*` - Full authentication and administration API
- **Protected Pages**: All application pages redirect to `/login` if not authenticated
- **Admin Pages**: `/admin` requires admin privileges, shows in dropdown for admins only
- **Public Pages**: `/login` page and authentication API routes only

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

#### **🚀 Phase 2: Video Processing & YouTube Upload - ENHANCED PROGRESS TRACKING!**
- **🆕 Enhanced Progress Bars** - Real-time file size tracking with "current / total" display
- **🆕 Smart File Size Estimation** - Intelligent progress calculation based on input files
- **🆕 Detailed Server Logging** - Terminal shows "🔄 Merge progress: 45% - Output size: 125.3 MB / 280.7 MB"
- **Server-Side FFmpeg Processing** - Handles large video files (1.5GB+) without browser limitations
- **Professional Video Merging** - Seamlessly combines Creatify exports with outro videos
- **Default Outro Management** - Set and manage default outro videos for efficient workflow
- **Custom Outro Support** - Upload different outros for specific projects
- **Drag-and-Drop Video Upload** - Intuitive file upload with validation
- **Real-Time Processing Status** - Progress indicators for upload, processing, and download
- **Automatic Metadata Application** - Applies Phase 1 metadata to final videos
- **Project Management** - IndexedDB storage for video projects and settings
- **Past Projects Access** - Quick access to previous scripts and metadata
- **Stream-Based File Handling** - Efficient memory management for large files

#### **📺 Phase 2 (Continued): YouTube Integration - COMPLETE METADATA MASTERY!**
- **🆕 COMPLETE TAG EXTRACTION** - Extracts ALL tags from "📌 3. YOUTUBE METADATA" + "📌 4. COMPETITIVE BUILDER TAG LIST"
- **🆕 ~450 Character Tag Optimization** - Uses 90% of YouTube's 500-character tag limit for maximum SEO
- **🆕 Smart Tag Combination** - Primary yacht tags + competitive builders + strategic industry keywords
- **🆕 FIXED: Description Upload** - YouTube descriptions now upload perfectly from Phase 1 content
- **🆕 Robust Metadata Parsing** - No more regex issues, reliable extraction for all metadata sections
- **🆕 Enhanced Upload Progress** - Shows "180.2 MB / 300.5 MB" file size tracking during upload
- **🆕 Smart Upload Estimation** - Time-based progress calculation with file size metrics
- **🆕 Detailed Upload Logging** - Terminal shows "📊 Upload progress: 60% - Processing video upload... - 180.2 MB / 300.5 MB"
- **🆕 Home Page OAuth Status** - Global YouTube connection status with one-click authentication
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
- **🆕 YouTube API Credentials** (for Phase 2 YouTube integration)
  - Google Cloud Console project with YouTube Data API v3 enabled
  - OAuth2 client credentials (Client ID and Client Secret)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-org/Digital_Ocean_Social_V1.git
   cd Digital_Ocean_Social_V1
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env.local` file:
   ```env
   # Digital Ocean Social V1 Environment Variables
   
   # Anthropic Claude API Key (Required)
   ANTHROPIC_API_KEY=your_anthropic_api_key_here
   
   # YouTube API Configuration (Required for YouTube Upload)
   YOUTUBE_CLIENT_ID=your_youtube_client_id_here
   YOUTUBE_CLIENT_SECRET=your_youtube_client_secret_here
   YOUTUBE_REDIRECT_URI=http://localhost:3000/api/youtube/auth/callback
   
   # Dropbox API Configuration (Required for Phase 3 Video Sharing)
   DROPBOX_APP_KEY=your_dropbox_app_key_here
   DROPBOX_APP_SECRET=your_dropbox_app_secret_here
   DROPBOX_REFRESH_TOKEN=your_dropbox_refresh_token_here
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to `http://localhost:3000` to access the Digital Ocean Social V1 platform

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

#### **🆕 Phase 2: Video Processing & YouTube Upload**
- **Upload Main Video**: Drag and drop your Creatify export (up to 1.5GB)
- **Configure Outro**: Choose default outro or upload custom outro
- **Set Default Outro**: Upload outro once, use for all future videos
- **Server Processing**: Videos processed server-side for reliability
- **Download Result**: Get professionally merged video with metadata
- **Project Management**: Access past projects and scripts
- **One-Click Workflow**: After setup, process videos in seconds

#### **📺 Phase 2 (Continued): YouTube Upload - PRODUCTION READY!**

**🚀 Recommended Workflow (Home Page First):**
1. **Home Page OAuth**: Click "🔐 Connect" in header to authenticate YouTube (1-hour session)
2. **Generate Content**: Navigate to Video Generator → Create yacht marketing content
3. **Process Video & Upload to YouTube**: Upload Creatify export, merge with outro, and upload directly to YouTube with automatic metadata application
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
│   ├── video-generator/            # Video generator page (Phase 1 & 2)
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
│   └── 🆕 youtube/                 # Phase 2 YouTube integration
│       ├── auth.ts                 # OAuth2 authentication with token refresh
│       ├── uploader.ts             # Video upload with progress tracking
│       └── metadata.ts             # Phase 1 content parsing for YouTube
├── 🆕 config/                      # Configuration files (excluded from git)
│   └── youtube-credentials.json    # YouTube OAuth2 tokens (auto-generated)
└── temp/                           # Server-side temporary files (auto-cleaned)
```

## Deployment

### 🚀 **LIVE PRODUCTION DEPLOYMENT** ✅

**Current Status**: This application is successfully deployed and running on Digital Ocean!

- **🌐 Live URL**: `http://142.93.52.214:3000`
- **🖥️ Server**: Digital Ocean Droplet (4GB RAM, 2 vCPUs, 50GB SSD)
- **💰 Cost**: $24/month
- **🏃‍♂️ Performance**: 0.1-0.7 second page loads
- **🔧 Mode**: Development with warmup optimization
- **📍 Region**: NYC1 (New York)

### 🛠️ **Digital Ocean CLI Deployment Guide**

**Prerequisites:**
- Digital Ocean account with Personal Access Token
- `doctl` CLI tool installed

**1. Setup Digital Ocean CLI:**
```bash
# Install doctl
# Visit: https://docs.digitalocean.com/reference/doctl/how-to/install/

# Authenticate
doctl auth init
# Enter your Personal Access Token when prompted
```

**2. Create and Deploy Droplet:**
```bash
# Create SSH key
ssh-keygen -t ed25519 -f ~/.ssh/id_ed25519_digitalocean -N "" -C "your-email@domain.com"

# Add SSH key to Digital Ocean
doctl compute ssh-key import social-media-key --public-key-file ~/.ssh/id_ed25519_digitalocean.pub

# Create 4GB Droplet (recommended for stability)
doctl compute droplet create social-media-manager-v1 \
  --size s-2vcpu-4gb \
  --image ubuntu-24-04-x64 \
  --region nyc1 \
  --ssh-keys $(doctl compute ssh-key list --format ID --no-header) \
  --wait

# Get Droplet IP
doctl compute droplet list
```

**3. Server Setup:**
```bash
# SSH into your Droplet (replace with your IP)
ssh root@YOUR_DROPLET_IP

# Install dependencies
apt update && apt upgrade -y
apt install -y curl git ffmpeg
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt-get install -y nodejs
npm install -g pm2

# Clone and setup project
git clone https://github.com/MintedOne/Digital_Ocean_Social_V1.git
cd Digital_Ocean_Social_V1
npm install

# Copy environment variables (create .env.local with your API keys)
# See Environment Variables section below
```

**4. Start Application:**
```bash
# Development mode (recommended - faster startup, good performance after warmup)
NODE_OPTIONS='--max-old-space-size=2048' PORT=3000 pm2 start 'npm run dev' --name social-media-manager

# Run warmup script for better performance
chmod +x warmup.sh && ./warmup.sh

# Enable auto-restart
pm2 save && pm2 startup

# Optional: Enable port 80 access (no :3000 needed)
iptables -t nat -A PREROUTING -p tcp --dport 80 -j REDIRECT --to-port 3000
```

**5. Management Commands:**
```bash
# View logs
pm2 logs social-media-manager

# Restart application
pm2 restart social-media-manager

# Monitor performance
pm2 monit

# Stop application
pm2 stop social-media-manager

# View server status
pm2 status
```

### 🔧 **Performance Optimization**

The application includes several performance optimizations:

**Warmup Script** (`warmup.sh`):
- Pre-compiles main pages for faster loading
- Run after server restarts: `./warmup.sh`
- Improves performance from 2-6s to 0.1-0.7s

**Memory Configuration**:
- Node.js memory limit: 2048MB (`--max-old-space-size=2048`)
- Recommended Droplet: 4GB RAM minimum
- PM2 manages process restarts automatically

**Development vs Production Mode**:
- **Development Mode** (Current): Reliable, good performance after warmup
- **Production Mode**: Faster but requires more memory for builds

### 💾 **Backup and Git Management**

**Current Repository**:
- **GitHub**: `https://github.com/MintedOne/Digital_Ocean_Social_V1`
- **Status**: Private repository with all deployment configurations
- **Branch**: `main` (production-ready)

**Important Files Included**:
- `deploy.sh` - Automated deployment script
- `warmup.sh` - Performance optimization script
- `ecosystem.config.js` - PM2 configuration
- `.env.example` - Environment variable template

### 🚀 **Alternative Hosting Solutions**

#### ✅ **Recommended: VPS/Cloud Hosting**

**Digital Ocean** (Currently deployed):
- ✅ **4GB Droplet**: $24/month - **DEPLOYED AND WORKING**
- ✅ **Easy CLI management** with `doctl`
- ✅ **Automatic backups available**
- ✅ **SSH access and full control**

**Other VPS Providers:**
- **Linode**: Similar pricing and performance (~$24/month)
- **Vultr**: Good alternative with global locations
- **AWS EC2** / **Google Compute**: Enterprise-grade but more complex

#### ⚠️ **Alternative: Platform-as-a-Service**

- **Railway.app**: Modern PaaS with persistent servers (~$20/month)
- **Render.com**: Good Docker support for FFmpeg (~$25/month)
- **Heroku**: Works but more expensive (~$50+/month)

These require minimal configuration changes but cost more than VPS hosting.

#### ❌ **Not Compatible: Serverless Platforms**

The following platforms **will NOT work** without major code rewrites:
- **Vercel**: Serverless functions can't run FFmpeg or handle large files
- **Netlify**: Similar serverless limitations
- **Firebase Hosting**: Static hosting only (attempted migration failed)
- **GitHub Pages**: Static sites only, no server-side processing

**Why Serverless Doesn't Work:**
- No FFmpeg binary support
- 10MB function size limits (our videos are 1.5GB+)
- No persistent file system
- Request timeout limitations

### 📦 Environment Configuration

Regardless of hosting choice, configure these environment variables:

```bash
# Required API Keys
ANTHROPIC_API_KEY=your_anthropic_api_key
YOUTUBE_CLIENT_ID=your_youtube_client_id
YOUTUBE_CLIENT_SECRET=your_youtube_client_secret
YOUTUBE_REDIRECT_URI=https://yourdomain.com/api/youtube/auth/callback

# Optional Integrations
DROPBOX_APP_KEY=your_dropbox_key
DROPBOX_APP_SECRET=your_dropbox_secret
DROPBOX_REFRESH_TOKEN=your_dropbox_token

# Email Configuration
GOOGLE_EMAIL=mintedyachts@gmail.com
ADMIN_EMAIL=info@mintedyachts.com
AUTH_SECRET=your_32_character_random_string
```

### 🔄 Migration Path

**Current Architecture:** Full-stack Next.js with server-side processing
**Future Option:** Gradual migration to microservices (keep complex APIs on VPS, move simple APIs to serverless)

The codebase includes Firebase preparation (`NEXT_PUBLIC_USE_FIREBASE` toggle) for potential future hybrid deployment.

## 🔧 Troubleshooting & Performance

### ⚡ **Performance Optimization**

#### **Initial Page Load (4-19 seconds)**
**Issue**: First-time page loads can be slow in development mode
**Root Cause**: Next.js compiles pages on-demand in development mode
**Solutions**:
1. **Run Warmup Script** (recommended):
   ```bash
   ssh root@YOUR_DROPLET_IP 'cd /root/social-media-manager && ./warmup.sh'
   ```
   - Pre-compiles all main pages 
   - Reduces subsequent loads to 0.1-0.4 seconds
   - Login page prioritized for fastest user experience

2. **Production Mode** (faster but requires 4GB+ RAM):
   ```bash
   # Stop development mode
   pm2 delete social-media-manager
   
   # Build and start production
   NODE_OPTIONS='--max-old-space-size=2048' npm run build
   PORT=3000 pm2 start 'npm start' --name social-media-manager
   ```

#### **"Generate Content" Button Not Activating**
**Required Fields**: All three must be filled:
- ✅ **Manufacturer**: Must not be empty/whitespace
- ✅ **Model**: Must not be empty/whitespace  
- ✅ **Video Length**: Must be a number > 0

**Debug Steps**:
1. Check browser console (F12 → Console) for JavaScript errors
2. Verify all fields have values (spaces don't count)
3. Try refreshing the page if it went "dark"

### 🐛 **Common Issues**

#### **✅ FIXED: Distribution Error: "Given datetime cannot be in the past"** 
**Root Cause**: Metricool API timezone logic bug - treats dateTime as UTC despite timezone parameter
**Error Example**: `dateTime=2025-08-25T03:00:00, timezone=America/New_York` (API ignores timezone)
**Solution Applied**: Added +4 hour compensation offset to scheduled times
**Status**: ✅ **RESOLVED (August 25, 2025)** - Manual override posting now works correctly
**Verification**: Posts now schedule at intended times (11:00 AM EDT) instead of failing

#### **✅ VERIFIED: Dropbox Integration Status**  
**Connection Status**: ✅ **WORKING** - API tokens valid and account connected
**Account**: Tony Smith (tsmith_tsmith@hotmail.com) - Dropbox Pro account  
**Test Results**: `/api/test-dropbox` - Connection successful, tokens valid
**File Location**: `/AI Avatar/Digital_Ocean_Try/Digital_Ocean_Social_V1/processed-videos/`
**Note**: Dropbox fallback works when file sharing needed for Instagram, Facebook, LinkedIn, TikTok platforms

#### **🌑 Dark Page / Page Not Loading**
**Root Cause**: React hydration errors from server-side compilation issues
**Solution**: 
1. Refresh the page 2-3 times
2. Run warmup script: `./warmup.sh`
3. If persistent, restart server: `pm2 restart social-media-manager`

#### **🎬 Video Generator FFmpeg Errors**
**Root Cause**: FFmpeg trying to load on server-side instead of browser-only
**Fixed In**: Latest version uses dynamic imports with browser detection
**Status**: ✅ **Resolved** - FFmpeg now properly isolated to browser environment

### 📊 **Performance Metrics**

| Component | First Load | After Warmup | Mode |
|-----------|------------|--------------|------|
| **Login Page** | 4-19s | 0.1-0.3s | Dev |
| **Video Generator** | 4-19s | 0.1-0.4s | Dev |
| **Admin Portal** | 2-8s | 0.1-0.2s | Dev |
| **Production Mode** | 0.5-2s | 0.05-0.1s | Prod |

### 🖥️ **Server Access & Monitoring**

#### **SSH Access**
```bash
# Direct access
ssh root@142.93.52.214

# Using configured alias
ssh social-media-do
```

#### **Application Monitoring**
```bash
# View real-time logs
pm2 logs social-media-manager

# Monitor server resources  
pm2 monit

# Check application status
pm2 status

# Restart if needed
pm2 restart social-media-manager
```

#### **Web-Based VM Access**
1. **Digital Ocean Console**: 
   - Visit: https://cloud.digitalocean.com/droplets
   - Click "Console" on your droplet

2. **Install Web Terminal**:
   ```bash
   # On the server
   apt install -y ttyd
   ttyd -p 7681 bash
   # Access: http://142.93.52.214:7681
   ```

### 🔄 **Git Backup Strategy**

#### **Current Issue**: ⚠️ **Server-side changes not backed up**
Recent improvements made directly on server without Git commits.

#### **Recommended Workflow**:
1. **Development**: Make changes locally first
2. **Testing**: Deploy to server with `./deploy.sh` 
3. **Backup**: Commit and push to GitHub regularly
4. **Production**: Tag stable releases

#### **Recovery Commands**:
```bash
# Download current server files
rsync -avz social-media-do:/root/social-media-manager/ ./server-backup/

# Commit server changes
git add . && git commit -m "Server improvements: FFmpeg fixes, performance optimizations"
git push origin main

# Deploy from Git
git pull origin main && ./deploy.sh
```

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

## Phase 3: Social Media Distribution (Production Ready with Smart Calendar)

### ✅ Current Phase 3 Status (August 4, 2025)
- **🆕 Smart Calendar Integration** - 4-week visual calendar showing existing Metricool posts
- **🆕 Calendar-Based Scheduling** - Posts scheduled using intelligent calendar analysis
- **🆕 Optimal Time Calculations** - AI suggests best posting times based on calendar data
- **🆕 Platform Distribution Insights** - Visual breakdown of posts across all social networks
- **🆕 Smart Recommendations** - System provides scheduling guidance based on calendar analysis
- **✅ Metricool API Integration** - Successfully posting to all 6 platforms (Twitter, Facebook, Instagram, LinkedIn, TikTok, GMB)
- **✅ YouTube Tag Issue Resolved** - 400-character limit prevents intermittent failures  
- **✅ Dropbox API Integration** - Handles large video files (1.5GB+) with share links
- **✅ Smart Platform Logic** - Twitter/GMB use YouTube URLs, others use Dropbox share links
- **✅ Enhanced Content Generation** - Platform-specific messaging with professional CTAs
- **✅ Resolution Auto-Scaling** - FFmpeg handles 4K + 1080p video combinations seamlessly
- **✅ API Structure Optimized** - Clean Metricool API integration with proper error handling
- **✅ Professional Contact Info** - Full contact details with Phone/WhatsApp/Email/Website

### 📅 **NEW: Smart Calendar Features**
- **4-Week Calendar View**: Visual grid showing scheduled posts with platform icons
- **Intelligent Scheduling**: System analyzes existing posts to avoid busy periods
- **Platform Insights**: Breakdown showing post distribution across all social networks
- **Optimal Timing**: AI calculates best posting times based on calendar analysis
- **Smart Recommendations**: Actionable insights like "Avoid busy days" and "Best time slots"
- **Failsafe Operation**: Calendar works even when Metricool API is unavailable
- **Real-Time Updates**: Calendar refreshes automatically to show latest schedule

### ✅ **Calendar API Status - WORKING!**
- **Calendar UI**: ✅ Complete - 4-week calendar display implemented
- **Smart Analysis**: ✅ Complete - AI recommendations and optimal timing calculations  
- **Metricool Integration**: ✅ **WORKING** - Calendar API successfully retrieving real scheduled posts
- **API Fix Applied**: ✅ Fixed datetime format (yyyy-MM-ddTHH:mm:ss), parameter names (blog_id, start, end)
- **Current Behavior**: Calendar displays actual scheduled posts from Metricool API
- **Next Steps**: Debug scheduling logic to intelligently avoid conflicts with existing posts

### 🎯 Platform-Specific Features
- **Twitter (X)**: ✅ Concise posts with YouTube URLs, urgency-focused CTAs
- **Facebook**: ✅ Engaging content with Dropbox videos, no YouTube URLs when video attached
- **Instagram**: ✅ Rich feature lists with full contact info, optimized hashtags
- **LinkedIn**: ✅ Professional tone, business benefits, no YouTube URLs with Dropbox
- **TikTok**: ✅ Trendy POV style, lifestyle focus, youth-oriented hashtags
- **Google Business**: ✅ Location-focused with business hours, YouTube URLs required

### 🔥 Recent Improvements (August 4, 2025)
- **Enhanced CTAs**: "🔥 Inquire Now!", "📅 Schedule Your Tour", "💼 Full Specs & Pricing"
- **Better Hashtags**: Manufacturer-specific tags (#AzimutYachts), platform-optimized
- **Contact Options**: Call/Text/WhatsApp, Email (TS@MintedYachts.com), Website
- **Video Resolution Fix**: Handles 4K main videos with 1080p outros seamlessly
- **Increased Upload Limit**: 1.5GB for larger, higher-quality yacht tour videos

### Future Phase 3 Enhancements
- **Cross-platform analytics** - Unified performance tracking
- **Automated scheduling optimization** - AI-powered best posting times
- **Content variation** - Platform-specific messaging and hashtags

### Additional Features
- **User authentication** with Firebase Auth
- **Conversation history** with Firestore
- **Yacht database integration** for real-time inventory
- **Image generation** for yacht visualizations
- **Multi-language support** for international clients
- **Voice interaction** capabilities
- **Mobile app** development

## Contributing

This is a proprietary project for Digital Ocean Social V1. For development questions or feature requests, contact the development team.

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
   - **Branch**: `feature/phase3-testing-social-tools`
   - **Purpose**: Testing and future social media distribution tools
   - **Status**: Active development - safe testing environment

4. **Merge Back When Ready:**
   ```bash
   # When feature is complete and tested
   git checkout main
   git merge feature/phase3-testing-social-tools
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

## 🔧 Current Debugging Status (August 2, 2025)

### Server Stability Issues Under Investigation

**Problem:**
- Server crashes when started through Claude Code (AI assistant)
- Server runs fine when started manually in terminal
- Issue appears to be timing-related with YouTube OAuth initialization

**Debugging Steps Taken:**
1. **Removed OpenAI Contamination** ✅
   - Deleted OpenAI rewrite rule from `next.config.mjs`
   - Removed all OpenAI dependencies and references
   - Cleaned up template contamination from previous sessions

2. **Fixed YouTube Auth Singleton Pattern** ✅
   - Changed from eager initialization to lazy initialization
   - OAuth client now only initializes when first needed
   - Prevents startup crashes from missing environment variables

3. **Added Authentication Delays** ⚠️
   - Tried 1-second delay: Not sufficient
   - Tried 5-second delay: Still experiencing crashes
   - Currently testing 10-second delay: Partially working
   - Server runs in background mode but crashes in foreground mode

**Current Challenges:**
- Server stability inconsistent between foreground/background execution
- YouTube authentication timing still causing intermittent crashes
- Chat function and video generator page navigation triggers crashes
- Need to investigate deeper into async initialization patterns

**Branch Status:**
- Working on `feature/youtube-uploader-auth`
- Last stable commit: `f304b3f` - "Stabilize system architecture and enhance user experience"
- Current changes include debugging attempts and 10-second YouTube auth delay

## License

Private repository - All rights reserved.

---

**Digital Ocean Social V1 - Social Media Management Platform** 📱 
*Comprehensive social media management with AI-powered content generation and multi-platform distribution.*

**Current Working Version**: Migrated from Local_Social_Media_Manager template