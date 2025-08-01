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

### 🎬 Video Content Generator - ENHANCED!
- **Professional YouTube Script Generation** - Creates engaging yacht marketing scripts
- **Complete Metadata Package** - Titles, descriptions, tags, competitive analysis
- **Character Count Calculation** - Precise timing based on video length (minutes × 836)
- **Creatify Integration Ready** - Scripts optimized for AI video creation
- **Copy & Download Functions** - Easy content export for immediate use
- **SEO-Optimized Content** - YouTube-ready titles and descriptions with proper keywords
- **Competitive Analysis** - Builder comparisons and market positioning
- **Thumbnail Title Suggestions** - 10-15 engaging options for video thumbnails
- **🆕 Auto-Save to Dropbox** - Automatically saves scripts and metadata to claude-output folder
- **🆕 Iterative Feedback System** - Give feedback on scripts for continuous refinement
- **🆕 YouTube Short Generator** - Create optimized short-form content with customizable length and tone
- **🆕 Research Tools Integration** - Direct links to Yatco photos, Google search, and YouTube research
- **🆕 Collapsible Interface** - Clean, organized UI with expandable sections

## Technical Implementation

### Technologies Used
- **Next.js 14** with App Router
- **React & TypeScript** for type-safe development
- **Vercel AI SDK** for streaming chat responses
- **Anthropic Claude** (claude-3-5-sonnet-20240620) for AI responses
- **TailwindCSS** for responsive yacht club styling
- **Firebase** (Auth, Storage, Database) ready for integration

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

#### API Integration (`src/app/api/victoria/chat/route.ts`)
- Secure Claude AI integration
- Environment-based API key management
- Streaming response handling
- Error handling and logging

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Anthropic API key

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
   ANTHROPIC_API_KEY=your_anthropic_api_key_here
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

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── victoria/chat/          # Victoria chat API endpoint
│   │   ├── video-generator/        # Video content generation API
│   │   └── save-to-dropbox/        # Auto-save to Dropbox folder API
│   ├── video-generator/            # Video generator page with enhanced features
│   ├── page.tsx                    # Main application page
│   └── layout.tsx                  # App layout
├── components/
│   ├── VictoriaChat.tsx           # Main chat interface
│   └── StaticWelcome.tsx          # Welcome message with typing effect
└── lib/
    └── victoria/
        └── persona.ts              # Victoria personality configuration
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