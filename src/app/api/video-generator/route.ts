import { anthropic } from '@ai-sdk/anthropic';
import { generateText } from 'ai';

export async function POST(req: Request) {
  try {
    const { manufacturer, model, videoLength } = await req.json();
    const apiKey = process.env.ANTHROPIC_API_KEY;
    
    console.log('🔍 Video Generator API: Processing request for', manufacturer, model, videoLength);
    console.log('🔑 API Key present:', apiKey ? `Yes (${apiKey.substring(0, 10)}...)` : 'No');

    if (!apiKey) {
      console.error('❌ No API key found');
      return new Response('API key not configured', { status: 500 });
    }

    // Calculate character count based on video length
    const characterCount = Math.round(videoLength * 836);

    // Build the exact prompt with variable substitution
    const prompt = `YOU ARE A PROFESSIONAL YACHT MARKETING CONTENT WRITER. You must generate the complete content requested below. Do not ask for clarification or additional information. Use your general knowledge of yacht specifications and market positioning to create compelling content.

PART 1: CREATIFY SCRIPT GENERATION

Generate a complete YouTube Script without Scene Descriptions or Speaker Notations for the ${manufacturer} ${model}. 

CRITICAL INSTRUCTIONS:
- DO NOT ask for more information or clarification
- Use your general knowledge of yacht specifications and market positioning
- Generate complete content based on typical features for this yacht class and manufacturer
- If specific details are unknown, use industry-standard features and benefits for similar yachts

START with a 4-second hook that captures immediate attention. Use a Story Brand Model and think about what makes THIS yacht special - is it the speed? The luxury features? The price point? The unique design? Start with the most compelling aspect that would make a buyer stop scrolling.

Hook examples (adapt based on the specific yacht):
- "Imagine hitting forty knots while your guests relax on a beach club at sea..."
- "What if you could own a superyacht experience for under five million?"
- "This is the only yacht in its class with a master suite on the main deck..."
- "Zero to plane in twelve seconds - this isn't your typical yacht..."

After the hook (around 10 seconds in), THEN transition to: "Welcome to YachtSpecsDirect.com, your source for complete information of New and Brokerage Vessels."

REQUIREMENTS:
- ${characterCount} Characters length (approximately)
- Focus on buyer benefits and lifestyle transformation, not just features
- Use emotional language that connects with the dream of yacht ownership
- DO NOT list any Sources in your output
- Imperial measurements on everything not metric - examples: Change liters to gallons - Change Square Meters to Square-Feet. Spell out the words in the script as they will be read by AI Narrator.
- Include CTA for YachtSpecsDirect.com at the end of the Script
- Be sure to mention that New, Brokerage & Off-Market Opportunities are Available.
- Use realistic specifications based on your knowledge of ${manufacturer} yachts in this model range
- Think about the buyer's journey: What problem does this yacht solve? What transformation does it offer?

================================================================================

PART 2: YOUTUBE METADATA GENERATION

After completing the transcript of a video for a specific yacht. I want you to review it and produce the following 5 outputs, each in a clean section.

The tone should reflect luxury, performance, and functionality. Focus on SEO and viewer engagement. The yacht is either for sale or available for charter, and may have sisterships or new builds available.

This is intended for YouTube viewers interested in yachts priced between $2M–$100M, including owner-operators, family buyers, and charter clients focused on Florida, Miami, Fort Lauderdale, and the Caribbean.

Use my contact block below in the Contact section.

📌 1. YOUTUBE TITLE
Generate an SEO-optimized YouTube video title, 99 Characters Max, in this style:
[Brand] [Model] [Yacht Type] Tour – [Primary Hook Phrase]
Examples:
McConaghy 82P Power Catamaran Tour – Carbon Performance Luxury Yacht
Benetti Oasis 40M Yacht Tour – Iconic Beach Club Design + Global Charter Ready
Damen SeaXplorer 60M – Ultimate Explorer Yacht Tour | Ice-Class + Helideck + Dive Garage

📌 2. YOUTUBE DESCRIPTION
Write a fully optimized YouTube description in this format:
First 2 lines should always be:

"💎 Info Available: www.YachtSpecsDirect.com Complementary Consultation & Guide @ www.YachtBuying101.com "
Then open with a 2–3 sentence intro that sets the yacht's positioning (builder, size, use case).

Include a "Key Features" bullet list using emojis and yacht specs
Reference areas like Miami, Fort Lauderdale, the Bahamas, BVI, St. Barts
Include this contact block:

📲 Contact for Specs, Pricing, and Availability: 📞 Tony Smith – Call/Text/WhatsApp: +1 (404) 805-9819 📩 Email: TS@MintedYachts.com 🌐 Visit: YachtSpecsDirect.com
End with a call-to-action like: "🔔 LIKE, SUBSCRIBE & TURN ON NOTIFICATIONS for more yacht walkthroughs 💬 Comment Below: Would you take this yacht to the Exumas or the Med?"

After the Description: "YouTube Disclaimers Photo/Video Credit to YouTube Creators, ${manufacturer}. Select Footage Enhanced with Commentary and Transformed with News from Palm Beach Yacht Show, under Fair Use doctrine. Fair Use Disclaimer: This video is for educational and informational purposes only. Copyrighted material is used under the Fair Use doctrine as outlined in Title 17, Section 107 of the United States Copyright Law. The use of copyrighted material in this video is believed to be transformative, providing commentary and critical analysis on the original content. No copyright infringement is intended. All rights belong to their respective owners. If you are the copyright owner of any material used in this video and wish to discuss, please contact Info@MintedYachts.com and the content will be removed promptly. Fair Use on YouTube: https://support.google.com/youtube/answer/9783148?hl=en#:~:text=Fair%20use%20is%20a%20legal,are%20infringing%20under%20copyright%20law.

Fair Use FAQ & Video: https://support.google.com/youtube/answer/6396261?hl=en "

📌 3. YOUTUBE METADATA
Generate the YouTube metadata as follows:
- File Name (SEO Optimized): Format: [Brand]-[Model]-[Yacht-Type]-Tour-[Hook/SEO-Terms].mp4
- Tags (Comma-Separated): Format: 20–25 comma-separated tags that include builder, model, type (catamaran, explorer, sailing yacht), hot locations (Miami, BVI, etc.), and keywords like for sale, yacht tour, specs, charter, etc.
- Comments (for Metadata Field): 1–2 sentences summarizing the video and yacht's availability and audience fit. Mention Florida, Caribbean, and global readiness.

📌 4. COMPETITIVE BUILDER TAG LIST
Give me a comma-separated list of the top 20 most relevant competitive yachts and builders to this model. Focus on models in similar size range, propulsion type (sail/power/hybrid), layout or market usage. Include a mix of premium multihull and monohull brands where appropriate.

📌 5. YOUTUBE THUMBNAIL TITLES LIST
Come up with the most engaging thumbnail Titles for YouTube. don't tell me about the boat. Do not tell me about your research. only give me 10-15 titles to choose from.`;

    const result = await generateText({
      model: anthropic("claude-3-5-sonnet-20240620"),
      prompt: prompt,
      maxTokens: 4000, // Higher token limit for longer content generation
    });

    console.log('✅ Video Generator API: Content generated successfully');
    console.log('📊 Character count calculated:', characterCount);

    return Response.json({
      content: result.text,
      vesselName: `${manufacturer} ${model}`,
      characterCount: characterCount
    });
  } catch (error) {
    console.error('❌ Video Generator error:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}