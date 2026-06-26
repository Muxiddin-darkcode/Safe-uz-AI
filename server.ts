import express from 'express';
import path from 'path';
import multer from 'multer';
import crypto from 'crypto';
import { createServer as createViteServer } from 'vite';
import { adminAuth, adminDb, adminStorage } from './src/backend/firebaseAdmin';
import { analyzeReport } from './src/backend/geminiService';
import { initTelegramBot } from './src/backend/telegramBot';
import { Report, ReportEvent, ThreatType, AppUser, SystemSettings, MonitoringSource, SIRDARYO_REGIONS } from './src/types';

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Multer for standard file uploads (memory storage)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // Limit to 10MB
  }
});

// Helper to hash password securely without bcrypt dependency
function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

// Helper to extract bearer token and verify Auth status with Firestore User context
const requireAuth = async (req: express.Request, res: express.Response, next: express.NextFunction): Promise<any> => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized. Missing bearer token." });
  }

  const token = authHeader.split(" ")[1];
  try {
    let uid = "";
    let email = "";
    let fullName = "User";
    let userRole: AppUser['role'] = "user";

    // 1. Try custom session token lookup in Firestore
    const sessionDocRef = adminDb.collection("sessions").doc(token);
    const sessionSnapshot = await sessionDocRef.get();

    if (sessionSnapshot.exists) {
      const sessionData = sessionSnapshot.data();
      uid = sessionData?.uid || "";
      
      const userDocRef = adminDb.collection("users").doc(uid);
      const userDocSnapshot = await userDocRef.get();
      if (!userDocSnapshot.exists) {
        return res.status(401).json({ error: "Unauthorized. User profile not found." });
      }
      const userData = userDocSnapshot.data() as AppUser;
      userRole = userData.role;
      fullName = userData.fullName || "User";
      email = userData.email || "";
    } else {
      // 2. Fallback to standard Firebase ID Token verification
      try {
        const decodedToken = await adminAuth.verifyIdToken(token);
        uid = decodedToken.uid;
        email = decodedToken.email || "";

        // Fetch user profile from Firestore to find the role
        const userDocRef = adminDb.collection("users").doc(uid);
        const userDocSnapshot = await userDocRef.get();

        fullName = decodedToken.name || email?.split("@")[0] || "User";

        if (userDocSnapshot.exists) {
          const userData = userDocSnapshot.data() as AppUser;
          userRole = userData.role;
          fullName = userData.fullName || fullName;
        } else {
          // Create lazy profile if not exists
          const newProfile: AppUser = {
            uid,
            fullName,
            email: email || "",
            role: "user",
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          await userDocRef.set(newProfile);
        }
      } catch (fbError) {
        console.error("Firebase Auth fallback failed, invalid token:", fbError);
        return res.status(401).json({ error: "Unauthorized. Invalid token." });
      }
    }

    // Attach user information to request object
    (req as any).user = {
      uid,
      email,
      fullName,
      role: userRole
    };

    next();
  } catch (error) {
    console.error("Authentication error inside requireAuth:", error);
    return res.status(401).json({ error: "Unauthorized. Invalid token." });
  }
};

// Helper function to upload file to local storage (or fallback)
async function uploadToStorage(file: Express.Multer.File): Promise<string> {
  const bucket = adminStorage.bucket();
  const fileExtension = path.extname(file.originalname);
  const fileName = `uploads/${Date.now()}_${Math.random().toString(36).substring(2, 7)}${fileExtension}`;
  const fileUpload = bucket.file(fileName);

  await fileUpload.save(file.buffer, {
    metadata: {
      contentType: file.mimetype,
    },
    public: true, // Make file public
  });

  // Return local static path for serving media files
  return `/uploads/${path.basename(fileName)}`;
}

// -------------------------------------------------------------
// API ENDPOINTS
// -------------------------------------------------------------

// Custom Register without email
app.post("/api/auth/register", async (req: express.Request, res: express.Response): Promise<any> => {
  const { username, password, fullName } = req.body;

  if (!username || !password || !fullName) {
    return res.status(400).json({ error: "Foydalanuvchi nomi, parol va to'liq ism kiritilishi shart." });
  }

  try {
    const usersRef = adminDb.collection("users");
    // Check if user already exists
    const existing = await usersRef.where("username", "==", username.trim().toLowerCase()).limit(1).get();
    if (!existing.empty) {
      return res.status(400).json({ error: "Ushbu foydalanuvchi nomi band! Iltimos, boshqasini tanlang." });
    }

    const uid = "user_u_" + crypto.randomBytes(8).toString('hex');
    const newUser: AppUser = {
      uid,
      fullName: fullName.trim(),
      email: "", // Custom username users do not require an email
      username: username.trim().toLowerCase(),
      passwordHash: hashPassword(password),
      role: "user",
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await usersRef.doc(uid).set(newUser);

    // Create a Firebase custom token
    const firebaseCustomToken = await adminAuth.createCustomToken(uid);

    // Create a custom session token as fallback
    await adminDb.collection("sessions").doc(firebaseCustomToken).set({
      uid,
      createdAt: new Date().toISOString()
    });

    return res.json({
      token: firebaseCustomToken,
      user: {
        uid,
        username: newUser.username,
        fullName: newUser.fullName,
        role: newUser.role
      }
    });
  } catch (err) {
    console.error("Custom registration error:", err);
    return res.status(500).json({ error: (err as Error).message });
  }
});

// Custom Login without email
app.post("/api/auth/login", async (req: express.Request, res: express.Response): Promise<any> => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: "Foydalanuvchi nomi va parolni kiriting." });
  }

  const normalizedUsername = username.trim().toLowerCase();

  try {
    const usersRef = adminDb.collection("users");
    let snapshot = await usersRef.where("username", "==", normalizedUsername).limit(1).get();

    // Auto-seed demo accounts if they don't exist yet
    if (snapshot.empty && ["admin", "inspector", "user"].includes(normalizedUsername)) {
      console.log(`Auto-seeding demo account for: ${normalizedUsername}`);
      const uid = "demo_" + normalizedUsername + "_" + crypto.randomBytes(4).toString('hex');
      const demoUser: AppUser = {
        uid,
        fullName: normalizedUsername === "admin" 
          ? "Sirdaryo Admin" 
          : normalizedUsername === "inspector" 
          ? "Sirdaryo Inspector" 
          : "Fuqaro (User)",
        email: `${normalizedUsername}@safeuz.ai`,
        username: normalizedUsername,
        passwordHash: hashPassword(normalizedUsername + "123"), // admin123, inspector123, user123
        role: normalizedUsername as "admin" | "inspector" | "user",
        isActive: true,
        assignedRegion: normalizedUsername === "inspector" ? "Guliston" : null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      await usersRef.doc(uid).set(demoUser);
      // Re-fetch snapshot to include the newly created user
      snapshot = await usersRef.where("username", "==", normalizedUsername).limit(1).get();
    }

    if (snapshot.empty) {
      return res.status(400).json({ error: "Foydalanuvchi nomi yoki parol xato!" });
    }

    const userDoc = snapshot.docs[0];
    const userData = userDoc.data() as AppUser;

    if (!userData.passwordHash || userData.passwordHash !== hashPassword(password)) {
      return res.status(400).json({ error: "Foydalanuvchi nomi yoki parol xato!" });
    }

    if (!userData.isActive) {
      return res.status(403).json({ error: "Hisobingiz bloklangan. Administratorga murojaat qiling." });
    }

    // Create a Firebase custom token
    const firebaseCustomToken = await adminAuth.createCustomToken(userData.uid);

    // Create a custom session token as fallback
    await adminDb.collection("sessions").doc(firebaseCustomToken).set({
      uid: userData.uid,
      createdAt: new Date().toISOString()
    });

    return res.json({
      token: firebaseCustomToken,
      user: {
        uid: userData.uid,
        username: userData.username,
        fullName: userData.fullName,
        role: userData.role,
        assignedRegion: userData.assignedRegion
      }
    });
  } catch (err) {
    console.error("Custom login error:", err);
    return res.status(500).json({ error: (err as Error).message });
  }
});

// Custom Logout
app.post("/api/auth/logout", async (req: express.Request, res: express.Response): Promise<any> => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.json({ success: true });
  }

  const token = authHeader.split(" ")[1];
  try {
    await adminDb.collection("sessions").doc(token).delete();
    return res.json({ success: true });
  } catch (err) {
    return res.json({ success: true }); // Always succeed silently on logout
  }
});

// Create a Report (Unified, Variant B)
app.post("/api/reports", upload.single("evidenceFile"), async (req: express.Request, res: express.Response): Promise<any> => {
  try {
    const {
      threatType,
      content,
      suspiciousLink,
      apkName,
      telegramChannel,
      telegramPostLink,
      locationText,
      latitude,
      longitude,
      regionName,
      reporterId,
      reporterRole
    } = req.body;

    if (!threatType) {
      return res.status(400).json({ error: "Missing required field: threatType" });
    }

    // Prepare files if uploaded
    let imageUrl: string | null = null;
    let fileUrl: string | null = null;

    if (req.file) {
      const fileUrlResult = await uploadToStorage(req.file);
      if (req.file.mimetype.startsWith("image/")) {
        imageUrl = fileUrlResult;
      } else {
        fileUrl = fileUrlResult;
      }
    }

    // Run AI Analysis using Google Gemini
    const aiResult = await analyzeReport(threatType as ThreatType, content || "", {
      suspiciousLink,
      apkName,
      telegramChannel,
      telegramPostLink,
      locationText,
      imageUrl
    });

    // Load custom System settings for thresholds
    let inspectorThreshold = 75;
    let urgentThreshold = 90;

    const settingsDoc = await adminDb.collection("system_settings").doc("default").get();
    if (settingsDoc.exists) {
      const set = settingsDoc.data() as SystemSettings;
      inspectorThreshold = set.inspectorThreshold;
      urgentThreshold = set.urgentThreshold;
    }

    // Determine Status & Role queues based on routing logic
    let status: Report['status'] = "new";
    let assignedToRole: Report['assignedToRole'] = "admin";

    if (threatType === "narcotics" && aiResult.score >= inspectorThreshold) {
      status = "queued_for_inspector";
      assignedToRole = "inspector";
    }

    const isUrgent = aiResult.score >= urgentThreshold;

    const reportId = `rep_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const reportDoc: Report = {
      id: reportId,
      threatType: threatType as ThreatType,
      source: "web",
      content: content || null,
      imageUrl,
      fileUrl,
      suspiciousLink: suspiciousLink || null,
      apkName: apkName || null,
      telegramChannel: telegramChannel || null,
      telegramPostLink: telegramPostLink || null,
      locationText: locationText || null,
      latitude: latitude ? parseFloat(latitude) : null,
      longitude: longitude ? parseFloat(longitude) : null,
      regionName: regionName || "Guliston", // Default to Sirdaryo regional center

      aiRiskLevel: aiResult.risk_level,
      aiScore: aiResult.score,
      aiSummary: aiResult.summary,
      aiSlangDetected: aiResult.slang_detected,
      aiReasoningFlags: aiResult.detected_indicators,

      status,
      assignedToRole,
      assignedInspectorId: null,
      isUrgent,
      priorityRank: Math.floor(aiResult.score),
      reporterId: reporterId || null,
      reporterRole: reporterRole || "user",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Save report to Firestore
    await adminDb.collection("reports").doc(reportId).set(reportDoc);

    // Save report event
    const eventId = `evt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const eventDoc: ReportEvent = {
      id: eventId,
      reportId,
      actorRole: "system",
      actorId: "ai_pipeline",
      eventType: "created",
      eventNote: `Report received. Gemini AI assessed as ${aiResult.risk_level} (${aiResult.score}%). Status is "${status}".`,
      createdAt: new Date().toISOString()
    };
    await adminDb.collection("report_events").doc(eventId).set(eventDoc);

    return res.status(201).json({ report: reportDoc, event: eventDoc });
  } catch (err) {
    console.error("Error creating report:", err);
    return res.status(500).json({ error: (err as Error).message });
  }
});

// Admin gets all reports with filtering
app.get("/api/reports", requireAuth, async (req: express.Request, res: express.Response): Promise<any> => {
  const { role } = (req as any).user;
  if (role !== "admin") {
    return res.status(403).json({ error: "Access denied. Admin role required." });
  }

  try {
    const { threatType, riskLevel, status, assignedRole, region, search } = req.query;
    let queryRef: any = adminDb.collection("reports");

    // Apply basic firestore filters or do client side filter to support text search
    // Since we're on Firestore, we'll retrieve all and filter to make it robust and easy,
    // which is excellent for a hackathon MVP.
    const snapshot = await queryRef.orderBy("createdAt", "desc").get();
    let reports = snapshot.docs.map(doc => doc.data() as Report);

    if (threatType) {
      reports = reports.filter(r => r.threatType === threatType);
    }
    if (riskLevel) {
      reports = reports.filter(r => r.aiRiskLevel.toLowerCase() === (riskLevel as string).toLowerCase());
    }
    if (status) {
      reports = reports.filter(r => r.status === status);
    }
    if (assignedRole) {
      reports = reports.filter(r => r.assignedToRole === assignedRole);
    }
    if (region) {
      reports = reports.filter(r => r.regionName?.toLowerCase() === (region as string).toLowerCase());
    }
    if (search) {
      const s = (search as string).toLowerCase();
      reports = reports.filter(r => 
        (r.content?.toLowerCase().includes(s)) ||
        (r.aiSummary?.toLowerCase().includes(s)) ||
        (r.id.toLowerCase().includes(s)) ||
        (r.suspiciousLink?.toLowerCase().includes(s))
      );
    }

    return res.json({ reports });
  } catch (err) {
    console.error("Error fetching reports:", err);
    return res.status(500).json({ error: (err as Error).message });
  }
});

// User retrieves their own reports
app.get("/api/reports/my", requireAuth, async (req: express.Request, res: express.Response): Promise<any> => {
  const { uid } = (req as any).user;
  try {
    const snapshot = await adminDb.collection("reports")
      .where("reporterId", "==", uid)
      .get();
    const reports = snapshot.docs.map(doc => doc.data() as Report)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return res.json({ reports });
  } catch (err) {
    console.error("Error fetching user reports:", err);
    return res.status(500).json({ error: (err as Error).message });
  }
});

// Inspector retrieves escalated or assigned narcotics reports
app.get("/api/reports/inspector", requireAuth, async (req: express.Request, res: express.Response): Promise<any> => {
  const { role, uid } = (req as any).user;
  if (role !== "inspector") {
    return res.status(403).json({ error: "Access denied. Inspector role required." });
  }

  try {
    // Narcotics reports that are assigned to inspector role generally, or assigned to this specific inspector ID
    const snapshot = await adminDb.collection("reports")
      .where("threatType", "==", "narcotics")
      .get();
    
    let reports = snapshot.docs.map(doc => doc.data() as Report);
    
    // Filter client side to include either queued for inspector generally, or assigned to this inspector
    reports = reports.filter(r => 
      r.status === "queued_for_inspector" || 
      r.assignedInspectorId === uid || 
      r.assignedToRole === "inspector"
    ).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return res.json({ reports });
  } catch (err) {
    console.error("Error fetching inspector reports:", err);
    return res.status(500).json({ error: (err as Error).message });
  }
});

// Get detailed report
app.get("/api/reports/:id", async (req: express.Request, res: express.Response): Promise<any> => {
  const { id } = req.params;
  try {
    const doc = await adminDb.collection("reports").doc(id).get();
    if (!doc.exists) {
      return res.status(404).json({ error: "Report not found" });
    }

    const report = doc.data() as Report;

    // Load related report events
    const eventsSnapshot = await adminDb.collection("report_events")
      .where("reportId", "==", id)
      .get();
    const events = eventsSnapshot.docs.map(d => d.data() as ReportEvent)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    return res.json({ report, events });
  } catch (err) {
    console.error("Error fetching report detail:", err);
    return res.status(500).json({ error: (err as Error).message });
  }
});

// Update Report Status
app.patch("/api/reports/:id/status", requireAuth, async (req: express.Request, res: express.Response): Promise<any> => {
  const { id } = req.params;
  const { status, note } = req.body;
  const { uid, role } = (req as any).user;

  if (!status) {
    return res.status(400).json({ error: "Missing status field" });
  }

  try {
    const docRef = adminDb.collection("reports").doc(id);
    const doc = await docRef.get();
    if (!doc.exists) {
      return res.status(404).json({ error: "Report not found" });
    }

    const report = doc.data() as Report;

    // Check permissions
    if (role === "inspector" && report.threatType !== "narcotics") {
      return res.status(403).json({ error: "Access denied. Inspectors can only process narcotics reports." });
    }

    await docRef.update({
      status,
      updatedAt: new Date().toISOString()
    });

    // Write Event Log
    let eventType: ReportEvent['eventType'] = "review_started";
    if (status === "under_review") eventType = "review_started";
    else if (status === "resolved") eventType = "marked_resolved";
    else if (status === "false_positive") eventType = "marked_false_positive";

    const eventId = `evt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const eventDoc: ReportEvent = {
      id: eventId,
      reportId: id,
      actorRole: role,
      actorId: uid,
      eventType,
      eventNote: note || `Report status updated to "${status}".`,
      createdAt: new Date().toISOString()
    };
    await adminDb.collection("report_events").doc(eventId).set(eventDoc);

    return res.json({ success: true, status, event: eventDoc });
  } catch (err) {
    console.error("Error updating report status:", err);
    return res.status(500).json({ error: (err as Error).message });
  }
});

// Assign Report to Inspector (Admin only)
app.patch("/api/reports/:id/assign", requireAuth, async (req: express.Request, res: express.Response): Promise<any> => {
  const { id } = req.params;
  const { inspectorId, inspectorName } = req.body;
  const { uid, role } = (req as any).user;

  if (role !== "admin") {
    return res.status(403).json({ error: "Access denied. Admin role required." });
  }

  try {
    const docRef = adminDb.collection("reports").doc(id);
    const doc = await docRef.get();
    if (!doc.exists) {
      return res.status(404).json({ error: "Report not found" });
    }

    await docRef.update({
      assignedInspectorId: inspectorId || null,
      assignedToRole: inspectorId ? "inspector" : "admin",
      status: "under_review",
      updatedAt: new Date().toISOString()
    });

    const eventId = `evt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const eventDoc: ReportEvent = {
      id: eventId,
      reportId: id,
      actorRole: "admin",
      actorId: uid,
      eventType: "reassigned",
      eventNote: inspectorId ? `Report assigned to inspector "${inspectorName || inspectorId}". Status moved to "under_review".` : "Report reassigned to Admin queue.",
      createdAt: new Date().toISOString()
    };
    await adminDb.collection("report_events").doc(eventId).set(eventDoc);

    return res.json({ success: true, assignedInspectorId: inspectorId });
  } catch (err) {
    console.error("Error assigning report:", err);
    return res.status(500).json({ error: (err as Error).message });
  }
});

// -------------------------------------------------------------
// ANALYTICS ENDPOINTS
// -------------------------------------------------------------

// Analytics overview
app.get("/api/analytics/overview", async (req: express.Request, res: express.Response): Promise<any> => {
  try {
    const snapshot = await adminDb.collection("reports").get();
    const reports = snapshot.docs.map(doc => doc.data() as Report);

    const total = reports.length;
    const highRisk = reports.filter(r => r.aiRiskLevel === "High").length;
    const critical = reports.filter(r => r.aiRiskLevel === "Critical").length;
    const urgent = reports.filter(r => r.isUrgent).length;
    const resolved = reports.filter(r => r.status === "resolved").length;
    const falsePositive = reports.filter(r => r.status === "false_positive").length;

    // Threat Type distribution
    const threatTypes: Record<string, number> = {
      narcotics: 0,
      phishing: 0,
      malicious_apk: 0,
      telegram_scam: 0,
      other: 0
    };
    reports.forEach(r => {
      if (threatTypes[r.threatType] !== undefined) {
        threatTypes[r.threatType]++;
      }
    });

    return res.json({
      totalReports: total,
      highRiskCount: highRisk,
      criticalCount: critical,
      urgentCount: urgent,
      resolvedCount: resolved,
      falsePositiveCount: falsePositive,
      threatTypes
    });
  } catch (err) {
    console.error("Error computing analytics overview:", err);
    return res.status(500).json({ error: (err as Error).message });
  }
});

// Sirdaryo regional analytics
app.get("/api/analytics/regions", async (req: express.Request, res: express.Response): Promise<any> => {
  try {
    const snapshot = await adminDb.collection("reports").get();
    const reports = snapshot.docs.map(doc => doc.data() as Report);

    // Group by region
    const regionMetrics: Record<string, {
      regionName: string;
      totalReports: number;
      highRiskCount: number;
      criticalCount: number;
      threatScore: number;
    }> = {};

    SIRDARYO_REGIONS.forEach(region => {
      regionMetrics[region] = {
        regionName: region,
        totalReports: 0,
        highRiskCount: 0,
        criticalCount: 0,
        threatScore: 0
      };
    });

    reports.forEach(r => {
      const region = r.regionName || "Guliston";
      if (!regionMetrics[region]) {
        regionMetrics[region] = {
          regionName: region,
          totalReports: 0,
          highRiskCount: 0,
          criticalCount: 0,
          threatScore: 0
        };
      }

      regionMetrics[region].totalReports++;

      if (r.aiRiskLevel === "High") {
        regionMetrics[region].highRiskCount++;
      } else if (r.aiRiskLevel === "Critical") {
        regionMetrics[region].criticalCount++;
      }

      // Weight calculation: Low = 1, Medium = 3, High = 7, Critical = 10
      let weight = 1;
      if (r.aiRiskLevel === "Medium") weight = 3;
      else if (r.aiRiskLevel === "High") weight = 7;
      else if (r.aiRiskLevel === "Critical") weight = 10;

      regionMetrics[region].threatScore += weight;
    });

    return res.json({
      regions: Object.values(regionMetrics).sort((a, b) => b.threatScore - a.threatScore)
    });
  } catch (err) {
    console.error("Error computing regional analytics:", err);
    return res.status(500).json({ error: (err as Error).message });
  }
});

// Threat Type Breakdowns
app.get("/api/analytics/threat-types", async (req: express.Request, res: express.Response): Promise<any> => {
  try {
    const snapshot = await adminDb.collection("reports").get();
    const reports = snapshot.docs.map(doc => doc.data() as Report);

    const counts: Record<string, number> = {};
    reports.forEach(r => {
      counts[r.threatType] = (counts[r.threatType] || 0) + 1;
    });

    return res.json({ threatTypes: counts });
  } catch (err) {
    return res.status(500).json({ error: (err as Error).message });
  }
});

// Top slang keywords
app.get("/api/analytics/top-keywords", async (req: express.Request, res: express.Response): Promise<any> => {
  try {
    const snapshot = await adminDb.collection("reports").get();
    const reports = snapshot.docs.map(doc => doc.data() as Report);

    const keywords: Record<string, number> = {};
    reports.forEach(r => {
      r.aiSlangDetected?.forEach(kw => {
        const cleanKw = kw.toLowerCase().trim();
        if (cleanKw) {
          keywords[cleanKw] = (keywords[cleanKw] || 0) + 1;
        }
      });
    });

    const topKeywords = Object.entries(keywords)
      .map(([keyword, count]) => ({ keyword, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 15);

    return res.json({ topKeywords });
  } catch (err) {
    return res.status(500).json({ error: (err as Error).message });
  }
});

// Retrieve system settings
app.get("/api/settings", async (req: express.Request, res: express.Response): Promise<any> => {
  try {
    const doc = await adminDb.collection("system_settings").doc("default").get();
    if (doc.exists) {
      return res.json(doc.data());
    }
    const defaultSettings: SystemSettings = {
      inspectorThreshold: 75,
      urgentThreshold: 90,
      mediumThreshold: 40,
      telegramBotToken: "",
      telegramBotUsername: "",
      updatedAt: new Date().toISOString()
    };
    await adminDb.collection("system_settings").doc("default").set(defaultSettings);
    return res.json(defaultSettings);
  } catch (err) {
    return res.status(500).json({ error: (err as Error).message });
  }
});

// Update system settings (Admin only)
app.post("/api/settings", requireAuth, async (req: express.Request, res: express.Response): Promise<any> => {
  const { role } = (req as any).user;
  if (role !== "admin") {
    return res.status(403).json({ error: "Access denied. Admin role required." });
  }

  const { inspectorThreshold, urgentThreshold, mediumThreshold, telegramBotToken, telegramBotUsername } = req.body;

  try {
    const newSettings: SystemSettings = {
      inspectorThreshold: parseInt(inspectorThreshold) || 75,
      urgentThreshold: parseInt(urgentThreshold) || 90,
      mediumThreshold: parseInt(mediumThreshold) || 40,
      telegramBotToken: telegramBotToken || "",
      telegramBotUsername: telegramBotUsername || "",
      updatedAt: new Date().toISOString()
    };

    await adminDb.collection("system_settings").doc("default").set(newSettings);

    // Dynamically reinitialize or stop/start the Telegram Bot with the new Token
    console.log("Dynamically reloading Telegram Bot with token provided via Admin settings...");
    await initTelegramBot(telegramBotToken);

    return res.json({ success: true, settings: newSettings });
  } catch (err) {
    return res.status(500).json({ error: (err as Error).message });
  }
});

// -------------------------------------------------------------
// USER MANAGEMENT & OTHER UTILS
// -------------------------------------------------------------

// Fetch profile detail of a user
app.get("/api/users/profile", requireAuth, async (req: express.Request, res: express.Response): Promise<any> => {
  return res.json({ user: (req as any).user });
});

// Retrieve list of all users (Admin only)
app.get("/api/users", requireAuth, async (req: express.Request, res: express.Response): Promise<any> => {
  const { role } = (req as any).user;
  if (role !== "admin") {
    return res.status(403).json({ error: "Access denied. Admin role required." });
  }

  try {
    const snapshot = await adminDb.collection("users").get();
    const users = snapshot.docs.map(doc => doc.data() as AppUser);
    return res.json({ users });
  } catch (err) {
    return res.status(500).json({ error: (err as Error).message });
  }
});

// Create/Update user roles (Admin only, with demo self-override)
app.post("/api/users/:uid/role", requireAuth, async (req: express.Request, res: express.Response): Promise<any> => {
  const { role, email: authEmail, uid: authUid } = (req as any).user;
  const { uid } = req.params;

  const isDemoSelfUpdate = (uid === authUid) && authEmail && authEmail.endsWith("@safeuz.ai");

  if (role !== "admin" && !isDemoSelfUpdate) {
    return res.status(403).json({ error: "Access denied. Admin role required." });
  }

  const { role: newRole, fullName, email, assignedRegion } = req.body;

  try {
    const userDocRef = adminDb.collection("users").doc(uid);
    const existing = await userDocRef.get();

    const updatedUser: Partial<AppUser> = {
      role: newRole || "user",
      fullName: fullName || (existing.exists ? existing.data()?.fullName : ""),
      email: email || (existing.exists ? existing.data()?.email : ""),
      assignedRegion: assignedRegion || null,
      isActive: true,
      updatedAt: new Date().toISOString()
    };

    if (!existing.exists) {
      updatedUser.uid = uid;
      updatedUser.createdAt = new Date().toISOString();
    }

    await userDocRef.set(updatedUser, { merge: true });
    return res.json({ success: true, user: updatedUser });
  } catch (err) {
    return res.status(500).json({ error: (err as Error).message });
  }
});

// Monitoring sources collection management
app.get("/api/sources", requireAuth, async (req: express.Request, res: express.Response): Promise<any> => {
  try {
    const snapshot = await adminDb.collection("monitoring_sources").get();
    const sources = snapshot.docs.map(doc => doc.data() as MonitoringSource);
    return res.json({ sources });
  } catch (err) {
    return res.status(500).json({ error: (err as Error).message });
  }
});

app.post("/api/sources", requireAuth, async (req: express.Request, res: express.Response): Promise<any> => {
  const { role, uid } = (req as any).user;
  if (role !== "admin") {
    return res.status(403).json({ error: "Access denied. Admin role required." });
  }

  const { sourceType, title, url, username, notes } = req.body;

  try {
    const sourceId = `src_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const newSource: MonitoringSource = {
      id: sourceId,
      sourceType: sourceType || "telegram_channel",
      title: title || "New Source",
      url: url || null,
      username: username || null,
      notes: notes || null,
      isActive: true,
      createdBy: uid,
      createdAt: new Date().toISOString()
    };

    await adminDb.collection("monitoring_sources").doc(sourceId).set(newSource);
    return res.json({ success: true, source: newSource });
  } catch (err) {
    return res.status(500).json({ error: (err as Error).message });
  }
});

app.delete("/api/sources/:id", requireAuth, async (req: express.Request, res: express.Response): Promise<any> => {
  const { role } = (req as any).user;
  if (role !== "admin") {
    return res.status(403).json({ error: "Access denied. Admin role required." });
  }

  const { id } = req.params;

  try {
    await adminDb.collection("monitoring_sources").doc(id).delete();
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: (err as Error).message });
  }
});

// Seed Initial Admin User if needed (mock auth fallback helper)
app.post("/api/seed/admin", async (req, res) => {
  const { uid, email, fullName } = req.body;
  if (!uid || !email) {
    return res.status(400).json({ error: "Missing uid or email" });
  }
  try {
    const adminUser: AppUser = {
      uid,
      fullName: fullName || "System Administrator",
      email,
      role: "admin",
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    await adminDb.collection("users").doc(uid).set(adminUser);
    return res.json({ success: true, user: adminUser });
  } catch (err) {
    return res.status(500).json({ error: (err as Error).message });
  }
});

// -------------------------------------------------------------
// VITE OR STATIC BUILD MIDDLEWARE Setup
// -------------------------------------------------------------
async function startServer() {
  // Serve uploaded media files statically
  app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

  // Start Telegram bot if token is configured
  await initTelegramBot();

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
