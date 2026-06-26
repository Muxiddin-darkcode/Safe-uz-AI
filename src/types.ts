export interface AppUser {
  uid: string;
  fullName: string;
  email: string;
  username?: string;
  passwordHash?: string;
  role: "user" | "inspector" | "admin";
  isActive: boolean;
  assignedRegion?: string | null;
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
}

export type ThreatType = "narcotics" | "phishing" | "malicious_apk" | "telegram_scam" | "other";

export interface Report {
  id: string;
  threatType: ThreatType;
  source: "web" | "bot" | "telegram_evidence";
  content: string | null;
  imageUrl: string | null;
  fileUrl: string | null;

  suspiciousLink: string | null;
  apkName: string | null;
  telegramChannel: string | null;
  telegramPostLink: string | null;

  locationText: string | null;
  latitude: number | null;
  longitude: number | null;
  regionName: string | null; // Sirdaryo region (Guliston, Yangiyer, Shirin, Sirdaryo, Boyovut, Mirzaobod, Oqoltin, Sardoba, Sayxunobod, Xovos)

  aiRiskLevel: "Critical" | "High" | "Medium" | "Low" | "Unknown";
  aiScore: number | null;
  aiSummary: string | null;
  aiSlangDetected: string[];
  aiReasoningFlags: string[];

  status:
    | "new"
    | "queued_for_inspector"
    | "under_review"
    | "resolved"
    | "false_positive"
    | "archived";

  assignedToRole: "admin" | "inspector" | null;
  assignedInspectorId: string | null;

  isUrgent: boolean;
  priorityRank: number | null;

  reporterId: string | null;
  reporterRole: "user" | "admin" | "inspector" | null;

  createdAt: string; // ISO string
  updatedAt: string; // ISO string
}

export interface ReportEvent {
  id: string;
  reportId: string;
  actorRole: "system" | "admin" | "inspector" | "user";
  actorId: string | null;
  eventType:
    | "created"
    | "ai_analyzed"
    | "queued_for_inspector"
    | "review_started"
    | "marked_resolved"
    | "marked_false_positive"
    | "reassigned";
  eventNote: string | null;
  createdAt: string; // ISO string
}

export interface SystemSettings {
  inspectorThreshold: number; // default 75
  urgentThreshold: number;    // default 90
  mediumThreshold: number;    // default 40
  telegramBotToken?: string;
  telegramBotUsername?: string;
  updatedAt: string; // ISO string
}

export interface MonitoringSource {
  id: string;
  sourceType: "telegram_channel" | "telegram_post" | "website" | "manual_tip";
  title: string;
  url: string | null;
  username: string | null;
  notes: string | null;
  isActive: boolean;
  createdBy: string | null;
  createdAt: string; // ISO string
}

export const SIRDARYO_REGIONS = [
  "Guliston",
  "Yangiyer",
  "Shirin",
  "Sirdaryo",
  "Boyovut",
  "Mirzaobod",
  "Oqoltin",
  "Sardoba",
  "Sayxunobod",
  "Xovos"
] as const;
