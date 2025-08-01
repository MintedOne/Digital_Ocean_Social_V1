# AI Avatar Yacht Project - Victoria Sterling

An intelligent yacht consultation system featuring Victoria Sterling, an AI-powered yacht consultant specializing in the $200k-$5M yacht market.

## 📍 Repository Location

This project is maintained as a **private repository** on GitHub:
- **Repository**: [MintedOne/AI_Avatar_Vic](https://github.com/MintedOne/AI_Avatar_Vic)
- **Visibility**: Private (Proprietary to Minted Yachts)
- **Access**: Restricted to authorized team members only

## Project Overview

Victoria Sterling is an AI yacht consultant with an Australian personality, designed to help clients navigate the yacht market with professional expertise and warm, knowledgeable guidance. The system provides personalized yacht recommendations, market insights, and comprehensive consultation services.

## ✅ Current Working Features (Last Updated: July 31, 2025)

### 🤖 Victoria Sterling AI Personality
- **Professional Australian yacht consultant** with warm, approachable personality
- **Market specialization**: $200k-$5M yacht segment
- **Concise responses**: 2-3 sentences maximum for engaging conversation
- **Comprehensive yacht knowledge base** covering brands, models, and market trends

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

## Project Structure

```
src/
├── app/
│   ├── api/victoria/chat/          # Victoria chat API endpoint
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

- **Environment-based API keys** - No hardcoded secrets
- **Secure API routes** with proper error handling
- **Git security** - All secrets use environment variables
- **Production-ready** security practices

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

### **⚠️ IMPORTANT: Always Backup Before Changes**
When working with AI assistance (Claude Code), follow these critical steps:

1. **Before Making ANY Changes:**
   ```bash
   git add .
   git commit -m "Save working version before changes"
   git push origin main
   ```

2. **After Major Updates:**
   - **Update this README** with new features and current state
   - **Commit and push changes** immediately to GitHub
   - **Document the commit ID** for easy rollback if needed

3. **Recovery Command:**
   ```bash
   # Restore to last perfect working version (commit: 861e80e)
   git reset --hard 861e80e
   ```

### **🤖 AI Assistant Reminders**
- **AI should remind user** to backup README and GitHub after major feature updates
- **Always test functionality** before considering changes "complete"
- **Document commit IDs** for important working versions
- **Never lose working code** - commit early, commit often

### **🚨 Lessons Learned**
- Working versions that exist only locally can be lost during git operations
- Always commit working states before experimenting with new features
- Use branches for major experiments: `git checkout -b feature/experiment-name`

## License

Private repository - All rights reserved by Minted Yachts.

---

**Victoria Sterling - Your Expert Yacht Consultant** 🛥️ 
*Specializing in the $200k-$5M yacht market with Australian expertise and warmth.*

**Current Working Version**: Commit 861e80e - "Perfect Working Victoria Sterling Implementation"