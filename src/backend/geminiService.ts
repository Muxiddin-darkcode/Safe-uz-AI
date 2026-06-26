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
  risk_level: "Critical" | "High" | "Medium" | "Low";
  score: number;
  summary: string;
  detected_indicators: string[];
  slang_detected: string[];
  evidence_type: "photo" | "screenshot" | "graffiti" | "telegram_post" | "website_screenshot" | "apk_reference" | "mixed" | "unknown";
  image_analysis: {
    image_present: boolean;
    visible_text: string[];
    visual_clues: string[];
    scene_type: "graffiti" | "screenshot" | "poster" | "chat_screenshot" | "street_photo" | "app_screen" | "unknown";
    supports_suspicion: boolean;
  };
  report_interpretation: {
    threat_type: "narcotics" | "phishing" | "malicious_apk" | "telegram_scam" | "other";
    what_the_report_appears_to_show: string;
    why_it_is_suspicious: string;
    confidence_note: string;
  };
  routing: {
    recommended_queue: "inspector" | "admin";
    priority: "urgent" | "high" | "normal" | "low";
  };
}

const FALLBACK_ANALYSIS: AIAnalysisResult = {
  risk_level: "Low",
  score: 10,
  summary: "AI analysis unavailable (Using standard safety fallback). Check evidence details manually.",
  detected_indicators: [],
  slang_detected: [],
  evidence_type: "unknown",
  image_analysis: {
    image_present: false,
    visible_text: [],
    visual_clues: [],
    scene_type: "unknown",
    supports_suspicion: false,
  },
  report_interpretation: {
    threat_type: "other",
    what_the_report_appears_to_show: "Fallback analysis.",
    why_it_is_suspicious: "Unknown, AI offline.",
    confidence_note: "Low confidence, automated fallback."
  },
  routing: {
    recommended_queue: "admin",
    priority: "low"
  }
};

const getSystemPrompt = (): string => {
  return `You are the AI analysis engine for SafeUZ AI, an Uzbek threat-reporting and intelligence platform.

Your task is to analyze user-submitted reports that may include text, images / screenshots / photos, links, Telegram usernames, APK-related descriptions, and location information.

# VERY IMPORTANT BEHAVIOR RULES
1) DO NOT GIVE A GENERIC ANSWER. Perform a structured threat analysis and give a useful operational result.
2) IF AN IMAGE IS PROVIDED, YOU MUST ANALYZE THE IMAGE CAREFULLY. Extract OCR visible text, visual threat clues (graffiti, phishing forms, apk installs, slang), and scene clues.
3) MULTI-MODAL ANALYSIS RULE: If the report includes both text and image, analyze them together.

# THREAT ANALYSIS LOGIC
A) IF threatType = narcotics: Analyze for drug sale slang (sk, kristal, mef, klad, zakladka, skorost), delivery hints, contact instructions, pricing, and graffiti / wall ads.
B) IF threatType = phishing: Analyze for suspicious/fake URLs, fake login pages, brand impersonation, shortened links.
C) IF threatType = malicious_apk: Analyze for unofficial download context, cracked app language, suspicious package hints.
D) IF threatType = telegram_scam: Analyze for fake support, money transfer bait, giveaways, credential requests.
E) IF threatType = other: General suspicious-content risk analysis.

# REQUIRED ANALYSIS OUTPUT STYLE
You must think like an operational analyst preparing a case for an admin or inspector dashboard.

# STRICT JSON OUTPUT
You MUST return ONLY valid JSON. Do not include markdown. Do not include explanations outside JSON. Do not wrap it in triple backticks.

Use exactly this schema:
{
"risk_level": "Critical | High | Medium | Low",
"score": 0,
"summary": "Short operational summary in Uzbek",
"detected_indicators": [
"indicator 1",
"indicator 2"
],
"slang_detected": [
"word1",
"word2"
],
"evidence_type": "photo | screenshot | graffiti | telegram_post | website_screenshot | apk_reference | mixed | unknown",
"image_analysis": {
"image_present": true,
"visible_text": [
"text found in image"
],
"visual_clues": [
"clue 1",
"clue 2"
],
"scene_type": "graffiti | screenshot | poster | chat_screenshot | street_photo | app_screen | unknown",
"supports_suspicion": true
},
"report_interpretation": {
"threat_type": "narcotics | phishing | malicious_apk | telegram_scam | other",
"what_the_report_appears_to_show": "Detailed Uzbek explanation",
"why_it_is_suspicious": "Detailed Uzbek explanation",
"confidence_note": "Uzbek explanation of confidence level based on visible evidence"
},
"routing": {
"recommended_queue": "inspector | admin",
"priority": "urgent | high | normal | low"
}
}`;
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

    const parsed: AIAnalysisResult = JSON.parse(cleanJson);
    return {
      risk_level: parsed.risk_level || "Low",
      score: typeof parsed.score === "number" ? parsed.score : 10,
      summary: parsed.summary || "No summary provided by AI.",
      detected_indicators: Array.isArray(parsed.detected_indicators) ? parsed.detected_indicators : [],
      slang_detected: Array.isArray(parsed.slang_detected) ? parsed.slang_detected : [],
      evidence_type: parsed.evidence_type || "unknown",
      image_analysis: parsed.image_analysis || FALLBACK_ANALYSIS.image_analysis,
      report_interpretation: parsed.report_interpretation || FALLBACK_ANALYSIS.report_interpretation,
      routing: parsed.routing || FALLBACK_ANALYSIS.routing,
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
