# AI Avatar Yacht Project - Victoria Sterling

An intelligent yacht consultation system featuring Victoria Sterling, an AI-powered yacht consultant specializing in the $200k-$5M yacht market.

## 📍 Repository Location

This project is maintained as a **private repository** on GitHub:
- **Repository**: [MintedOne/AI_Avatar_Vic](https://github.com/MintedOne/AI_Avatar_Vic)
- **Visibility**: Private (Proprietary to Minted Yachts)
- **Access**: Restricted to authorized team members only

## Project Overview

Victoria Sterling is an AI yacht consultant with an Australian personality, designed to help clients navigate the yacht market with professional expertise and warm, knowledgeable guidance. The system provides personalized yacht recommendations, market insights, and comprehensive consultation services.

## Features

### 🤖 Victoria Sterling AI Personality
- **Professional Australian yacht consultant** with warm, approachable personality
- **Market specialization**: $200k-$5M yacht segment
- **Real-time conversational interface** with typing effects
- **Comprehensive yacht knowledge base** covering brands, models, and market trends

### 🛥️ Yacht Consultation Services
- **Yacht Selection & Purchasing Advice**
- **Market Analysis & Pricing Insights**
- **Charter vs Ownership Consultation**
- **Yacht Financing Options**
- **Maintenance & Operational Cost Guidance**
- **Brand Recommendations** (Azimut, Princess, Sunseeker, Fairline, Riviera, Maritimo, etc.)

### 💬 Advanced Chat Interface
- **Natural typing effect** for realistic conversation flow
- **Mobile-responsive design** with yacht club themed UI
- **Real-time streaming responses** powered by Claude AI
- **Professional blue and gold color scheme**

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

## License

Private repository - All rights reserved by Minted Yachts.

---

**Victoria Sterling - Your Expert Yacht Consultant** 🛥️ 
*Specializing in the $200k-$5M yacht market with Australian expertise and warmth.*