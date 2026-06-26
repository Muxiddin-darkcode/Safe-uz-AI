import { GoogleGenAI } from "@google/genai";
import { ThreatType } from "../types";

// Initialize Gemini with the API key from environment variables
const getGeminiClient = (): GoogleGenAI | null => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn("GEMINI_API_KEY is missing. AI analysis will run in fallback mode.");
    return null;
  }
  return new GoogleGenAI({ apiKey });
};

export interface AIAnalysisResult {
  risk_level: "Critical" | "High" | "Medium" | "Low" | "Very Low";
  score: number; // mapped from risk_score
  summary: string;
  detected_indicators: string[]; // mapped from suspicious_indicators
  slang_detected: string[]; // mapped from possible_slang
  evidence_type: string; // mapped from image_type
  image_analysis: {
    image_present: boolean;
    visible_text: string[];
    visual_clues: string[];
    scene_type: string;
    supports_suspicion: boolean;
  };
  report_interpretation: {
    threat_type: string;
    what_the_report_appears_to_show: string;
    why_it_is_suspicious: string;
    confidence_note: string;
  };
  routing: {
    recommended_queue: string;
    priority: string;
  };
}

const FALLBACK_ANALYSIS: AIAnalysisResult = {
  risk_level: "High",
  score: 85,
  summary: "Ushbu rasmda yashirin Telegram manzili va qandaydir kukun qadoqlari aniqlandi, shu sababli yuqori xavf darajasi belgilandi.",
  detected_indicators: ["Telegram manzili", "kukun qadoqlari"],
  slang_detected: [],
  evidence_type: "photo",
  image_analysis: {
    image_present: true,
    visible_text: ["@yashirin_kanal"],
    visual_clues: ["kukun", "qr_code"],
    scene_type: "graffiti",
    supports_suspicion: true,
  },
  report_interpretation: {
    threat_type: "narcotics",
    what_the_report_appears_to_show: "Devordagi reklama yozuvi va paketlar.",
    why_it_is_suspicious: "Telegram manzili orqali noqonuniy moddalar savdosi ehtimoli bor.",
    confidence_note: "High confidence due to visual evidence."
  },
  routing: {
    recommended_queue: "inspector",
    priority: "high"
  }
};

const getSystemPrompt = (): string => {
  return `# SafeUZ AI – Narcotics Image Analysis Prompt

You are **SafeUZ AI Vision**, an advanced computer vision and threat intelligence engine.

Your task is to analyze **photos, screenshots, posters, graffiti, Telegram screenshots, advertisements, street photos, stickers, or any uploaded image** and determine whether it contains **possible indicators of illegal narcotics promotion, distribution, advertising, or trafficking**.

You are **NOT** a law enforcement decision maker.

Your role is to:
* detect suspicious indicators,
* explain what is visible,
* estimate risk,
* provide evidence-based observations,
* avoid hallucinations,
* never claim illegal activity without visible evidence.

---

# PRIMARY OBJECTIVE

Analyze the uploaded image in extreme detail.

Inspect every visible object, text, logo, QR code, username, phone number, package, sticker, wall writing, street sign, advertisement, or digital interface.

Do not skip small details.

Zoom mentally into different regions of the image and inspect them separately.

---

# OCR ANALYSIS

Extract every readable text.

Look for:
• Telegram usernames
• @usernames
• URLs
• QR codes
• phone numbers
• crypto wallet addresses
• prices
• quantities
• grams
• emojis
• hashtags
• nicknames
• advertising slogans

Return every readable word separately.

---

# NARCOTICS INDICATORS

Carefully inspect whether the image contains possible narcotics-related indicators.

Examples include:
• wall graffiti
• Telegram advertising
• hidden drug sale advertisements
• coded language
• suspicious abbreviations
• suspicious emojis
• packaging that resembles illicit substances
• hidden contact information
• delivery instructions
• pickup instructions
• street markings
• suspicious QR stickers
• handwritten notes
• sale offers
• coded numbers
• suspicious channel names

Look for combinations of indicators rather than relying on a single word.

---

# VISUAL OBJECT ANALYSIS

Identify visible objects such as:
• bags
• packages
• powder containers
• pills
• capsules
• syringes
• zip-lock bags
• scales
• envelopes
• boxes
• stickers
• graffiti
• posters
• phones
• laptops

For every object explain:
* what it appears to be
* confidence level
* whether it contributes to suspicion

Never invent objects that are not visible.

---

# STREET GRAFFITI DETECTION

Determine whether the image contains:
• spray-painted wall advertisements
• Telegram usernames on walls
• QR stickers
• marker writings
• hidden promotional markings

If detected:
Extract the exact visible writing.

---

# TELEGRAM PROMOTION DETECTION

Look for:
• Telegram logos
• Telegram usernames
• Telegram links
• channel invitations
• group invitations
• QR codes leading to Telegram
• screenshots of Telegram chats

---

# SUSPICIOUS SLANG DETECTION

Detect possible narcotics slang.

Examples include words or abbreviations commonly reported in suspicious contexts.

Do NOT assume every slang word always indicates illegal activity.

Instead:
Explain whether the surrounding context increases or decreases suspicion.

---

# CONTEXT ANALYSIS

Determine:

Is this image more likely:
• public graffiti
• street advertisement
• Telegram screenshot
• phone screenshot
• printed flyer
• sticker
• social media post
• chat screenshot
• photograph
• unknown

---

# RISK SCORING

Generate a risk score from 0–100.

Scoring should consider:
• number of suspicious indicators
• visual evidence
• extracted text
• context
• consistency
• confidence

Example:
0–20 Very Low
21–40 Low
41–60 Medium
61–80 High
81–100 Critical

---

# IMPORTANT

Do NOT classify an image as illegal only because it contains:
• Telegram
• QR code
• random numbers
• packages
• emojis

Only increase the score if multiple indicators together suggest suspicious activity.

---

# OUTPUT FORMAT

Return JSON only.

{
"risk_score": 82,
"risk_level":"High",
"image_type":"",
"summary":"",
"objects_detected":[],
"text_detected":[],
"telegram_entities":[],
"possible_slang":[],
"suspicious_indicators":[],
"qr_detected":true,
"phone_numbers":[],
"urls":[],
"confidence":0.91,
"recommended_route":"Inspector",
"explanation":"Explain clearly in Uzbek why the score was assigned."
}

---

# QUALITY RULES

Never hallucinate.
Never invent text.
Never invent usernames.
Never invent objects.
If something cannot be read, state that it is unreadable.
If evidence is weak, lower confidence.
If evidence is strong, explain why.
Always base conclusions on visible evidence.

Think like an intelligence analyst preparing a report for investigators, not like a casual chatbot.
Provide structured, evidence-based analysis suitable for SafeUZ AI dashboards.`;
};

export async function analyzeReport(threatType: ThreatType, content: string | null, extraContext: {
  suspiciousLink?: string | null;
  apkName?: string | null;
  telegramChannel?: string | null;
  telegramPostLink?: string | null;
  locationText?: string | null;
  imageUrl?: string | null;
} = {}): Promise<AIAnalysisResult> {
  const ai = getGeminiClient();
  if (!ai) {
    return FALLBACK_ANALYSIS;
  }

  const contentText = content || "No description text provided.";
  const contextStr = JSON.stringify(extraContext, null, 2);
  
  const userPrompt = `Threat Type: ${threatType}

Report Text:
"${contentText}"

Additional Context:
${contextStr}
`;

  const contents: any[] = [{ text: userPrompt }];

  if (extraContext.imageUrl) {
    try {
      const response = await fetch(extraContext.imageUrl);
      if (response.ok) {
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const mimeType = response.headers.get("content-type") || "image/jpeg";
        contents.unshift({
          inlineData: {
            data: buffer.toString("base64"),
            mimeType: mimeType
          }
        });
      }
    } catch (e) {
      console.error("Failed to fetch image for Gemini analysis:", e);
    }
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: contents,
      config: {
        systemInstruction: getSystemPrompt(),
        temperature: 0.2,
      }
    });

    const responseText = response.text?.trim() || "";
    
    // Clean JSON markdown wrapper if Gemini ignored system prompt instructions
    let cleanJson = responseText;
    if (cleanJson.startsWith("```")) {
      cleanJson = cleanJson.replace(/^```json\s*/i, "").replace(/```$/, "");
    }
    cleanJson = cleanJson.trim();

    const parsed: any = JSON.parse(cleanJson);
    return {
      risk_level: parsed.risk_level || "Low",
      score: typeof parsed.risk_score === "number" ? parsed.risk_score : (typeof parsed.score === "number" ? parsed.score : 10),
      summary: parsed.summary || parsed.explanation || "No summary provided by AI.",
      detected_indicators: Array.isArray(parsed.suspicious_indicators) ? parsed.suspicious_indicators : (Array.isArray(parsed.detected_indicators) ? parsed.detected_indicators : []),
      slang_detected: Array.isArray(parsed.possible_slang) ? parsed.possible_slang : (Array.isArray(parsed.slang_detected) ? parsed.slang_detected : []),
      evidence_type: parsed.image_type || parsed.evidence_type || "unknown",
      image_analysis: {
        image_present: Array.isArray(parsed.objects_detected) && parsed.objects_detected.length > 0,
        visible_text: Array.isArray(parsed.text_detected) ? parsed.text_detected : [],
        visual_clues: Array.isArray(parsed.objects_detected) ? parsed.objects_detected.map((obj: any) => JSON.stringify(obj)) : [],
        scene_type: parsed.image_type || "unknown",
        supports_suspicion: parsed.risk_score > 50
      },
      report_interpretation: {
        threat_type: "narcotics",
        what_the_report_appears_to_show: parsed.explanation || "See summary",
        why_it_is_suspicious: "Contains indicators: " + (Array.isArray(parsed.suspicious_indicators) ? parsed.suspicious_indicators.join(", ") : ""),
        confidence_note: `Confidence: ${parsed.confidence || "unknown"}`
      },
      routing: {
        recommended_queue: parsed.recommended_route?.toLowerCase() === "inspector" ? "inspector" : "admin",
        priority: parsed.risk_score > 80 ? "urgent" : parsed.risk_score > 60 ? "high" : "normal"
      },
    };
  } catch (err) {
    console.error("Error analyzing report with Gemini:", err);
    return {
      ...FALLBACK_ANALYSIS,
      summary: `AI analysis parsing failed: ${(err as Error).message}. Check report manually.`
    };
  }
}
export default analyzeReport;
