import { Telegraf, Markup } from 'telegraf';
import { adminDb } from './firebaseAdmin';
import { analyzeReport } from './geminiService';
import { Report, ThreatType, ReportEvent } from '../types';

let bot: Telegraf | null = null;

// Simple in-memory session for the hackathon prototype
type UserSession = {
  step: string;
  threatType?: ThreatType;
  content?: string;
  telegramPostLink?: string;
  locationText?: string;
  imageUrl?: string;
  latitude?: number;
  longitude?: number;
  suspiciousLink?: string;
  apkName?: string;
};

const sessions = new Map<number, UserSession>();

const getMainMenuKeyboard = () => {
  return Markup.keyboard([
    ['📝 Report yuborish', '📂 Mening reportlarim'],
    ['ℹ️ Bot haqida', '🆘 Yordam'],
    ['🌐 SafeUZ AI sayti']
  ]).resize();
};

const getThreatTypeKeyboard = () => {
  return Markup.keyboard([
    ['🚨 Narkotik tahdid', '🎣 Phishing link'],
    ['📦 Shubhali APK', '📲 Telegram scam'],
    ['⚠️ Boshqa tahdid', '🔙 Orqaga']
  ]).resize();
};

const getCancelKeyboard = () => {
  return Markup.keyboard([['❌ Bekor qilish']]).resize();
};

const getSkipCancelKeyboard = () => {
  return Markup.keyboard([['⏭ O\'tkazib yuborish', '❌ Bekor qilish']]).resize();
};

const getConfirmKeyboard = () => {
  return Markup.keyboard([
    ['✅ Yuborish', '❌ Bekor qilish']
  ]).resize();
};

export async function initTelegramBot(tokenOverride?: string): Promise<Telegraf | null> {
  if (bot) {
    console.log("Stopping old Telegram Bot instance before dynamic reload...");
    try {
      bot.stop("SIGTERM");
    } catch (e) {
      console.error("Error stopping Telegraf bot during reload:", e);
    }
    bot = null;
  }

  let token = tokenOverride || process.env.TELEGRAM_BOT_TOKEN;

  if (!token) {
    try {
      const settingsDoc = await adminDb.collection("system_settings").doc("default").get();
      if (settingsDoc.exists) {
        const data = settingsDoc.data();
        token = data?.telegramBotToken || "";
      }
    } catch (dbErr) {
      console.error("Failed to read telegram bot token from Firestore:", dbErr);
    }
  }

  if (!token) {
    console.warn("TELEGRAM_BOT_TOKEN is not set in environment or database. Telegram bot integration is deactivated.");
    return null;
  }

  try {
    bot = new Telegraf(token);

    bot.start((ctx) => {
      sessions.set(ctx.from.id, { step: 'idle' });
      ctx.reply(
        "Xush kelibsiz! Men **SafeUZ AI** botiman 🇺🇿\n\n" +
        "Siz bu yerda shubhali xavflar, narkotik savdosi, phishing va firibgarlik haqida xabar berishingiz mumkin.\n" +
        "Barcha xabarlar AI orqali tahlil qilinadi va xavfsiz tarzda saqlanadi.",
        { parse_mode: 'Markdown', ...getMainMenuKeyboard() }
      );
    });

    bot.hears('🌐 SafeUZ AI sayti', (ctx) => {
      ctx.reply("Platformamiz bilan tanishing:\n\n🌐 https://safeuz-ai.uz", getMainMenuKeyboard());
    });

    bot.hears('ℹ️ Bot haqida', (ctx) => {
      ctx.reply(
        "🤖 *SafeUZ AI* — bu sun'iy intellektga asoslangan tahdidlarni aniqlash va monitoring qilish platformasi.\n\n" +
        "Biz nimalarni tahlil qilamiz?\n" +
        "🚭 Narkotik reklama va savdosi\n" +
        "🎣 Phishing linklar va scam\n" +
        "📦 Shubhali zararli APK fayllar\n" +
        "📲 Telegramdagi turli xil firibgarliklar\n\n" +
        "Yuborilgan reportlar avtomatik tarzda xavf darajasiga ko'ra Admin va Inspektorlarga yo'naltiriladi.",
        { parse_mode: 'Markdown', ...getMainMenuKeyboard() }
      );
    });

    bot.hears('🆘 Yordam', (ctx) => {
      ctx.reply(
        "📋 *Qanday qilib report yuborish mumkin?*\n\n" +
        "1. Pastdagi *📝 Report yuborish* tugmasini bosing.\n" +
        "2. Tahdid turini tanlang (masalan, Narkotik tahdid).\n" +
        "3. Bot so'ragan ma'lumotlarni (matn, rasm, lokatsiya) yuboring.\n" +
        "4. Ma'lumotlarni tasdiqlab yuboring.\n\n" +
        "💡 *Eslatma:* Ixtiyoriy qadamlarni '⏭ O'tkazib yuborish' orqali chetlab o'tish mumkin.",
        { parse_mode: 'Markdown', ...getMainMenuKeyboard() }
      );
    });

    bot.hears('🔙 Orqaga', (ctx) => {
      sessions.set(ctx.from.id, { step: 'idle' });
      ctx.reply("Asosiy menyuga qaytdingiz.", getMainMenuKeyboard());
    });

    bot.hears('❌ Bekor qilish', (ctx) => {
      sessions.set(ctx.from.id, { step: 'idle' });
      ctx.reply("Amaliyot bekor qilindi. Asosiy menyuga qaytdingiz.", getMainMenuKeyboard());
    });

    bot.hears('📂 Mening reportlarim', async (ctx) => {
      const userId = `telegram_${ctx.from.id}`;
      try {
        const snapshot = await adminDb.collection("reports")
          .where("reporterId", "==", userId)
          .orderBy("createdAt", "desc")
          .limit(5)
          .get();
        
        if (snapshot.empty) {
          return ctx.reply("Sizda hozircha yuborilgan reportlar yo'q.", getMainMenuKeyboard());
        }

        let msg = "📂 *Sizning oxirgi reportlaringiz:*\n\n";
        snapshot.forEach(doc => {
          const data = doc.data() as Report;
          msg += `🆔 ID: \`${data.id}\`\n`;
          msg += `🚨 Tur: ${data.threatType.toUpperCase()}\n`;
          msg += `📊 Xavf: ${data.aiRiskLevel || 'Kutilmoqda'}\n`;
          msg += `⏳ Holat: ${data.status.replace(/_/g, ' ')}\n`;
          msg += `📅 Sana: ${new Date(data.createdAt).toLocaleDateString()}\n\n`;
        });

        ctx.reply(msg, { parse_mode: 'Markdown', ...getMainMenuKeyboard() });
      } catch (err) {
        console.error("Error fetching reports:", err);
        ctx.reply("Reportlarni yuklashda xatolik yuz berdi. Tizim to'liq integratsiya qilinmoqda.", getMainMenuKeyboard());
      }
    });

    bot.hears('📝 Report yuborish', (ctx) => {
      sessions.set(ctx.from.id, { step: 'select_threat' });
      ctx.reply("Qanday turdagi xavf haqida xabar bermoqchisiz? Kategoriyani tanlang:", getThreatTypeKeyboard());
    });

    bot.hears('🚨 Narkotik tahdid', (ctx) => {
      const session = sessions.get(ctx.from.id);
      if (session?.step === 'select_threat') {
        session.threatType = 'narcotics';
        session.step = 'narcotics_text';
        ctx.reply("Shubhali matn yoki izohni yuboring (zakladka, narkotik savdosi va h.k):", getCancelKeyboard());
      }
    });

    bot.hears('🎣 Phishing link', (ctx) => {
      const session = sessions.get(ctx.from.id);
      if (session?.step === 'select_threat') {
        session.threatType = 'phishing';
        session.step = 'phishing_link';
        ctx.reply("Shubhali fishing yoki scam linkni yuboring:", getCancelKeyboard());
      }
    });

    bot.hears('📦 Shubhali APK', (ctx) => {
      const session = sessions.get(ctx.from.id);
      if (session?.step === 'select_threat') {
        session.threatType = 'malicious_apk';
        session.step = 'apk_file';
        ctx.reply("APK fayl nomini yoki qayerdan yuklab olinganligini yozing (faylni uzatishingiz ham mumkin):", getCancelKeyboard());
      }
    });

    bot.hears('📲 Telegram scam', (ctx) => {
      const session = sessions.get(ctx.from.id);
      if (session?.step === 'select_threat') {
        session.threatType = 'telegram_scam';
        session.step = 'scam_link';
        ctx.reply("Scam kanal usernameni yoki post linkini yuboring:", getCancelKeyboard());
      }
    });

    bot.hears('⚠️ Boshqa tahdid', (ctx) => {
      const session = sessions.get(ctx.from.id);
      if (session?.step === 'select_threat') {
        session.threatType = 'other';
        session.step = 'other_text';
        ctx.reply("Tahdid haqida batafsil matn yozing:", getCancelKeyboard());
      }
    });

    bot.hears('⏭ O\'tkazib yuborish', (ctx) => {
      const session = sessions.get(ctx.from.id);
      if (!session) return;
      
      switch (session.step) {
        case 'narcotics_photo':
          session.step = 'narcotics_location';
          ctx.reply("Lokatsiyani yuboring (Location jo'natishingiz mumkin):", getSkipCancelKeyboard());
          break;
        case 'narcotics_location':
          session.step = 'confirm';
          showConfirmation(ctx, session);
          break;
        case 'phishing_photo':
          session.step = 'confirm';
          showConfirmation(ctx, session);
          break;
        case 'apk_photo':
          session.step = 'confirm';
          showConfirmation(ctx, session);
          break;
        case 'scam_photo':
          session.step = 'confirm';
          showConfirmation(ctx, session);
          break;
        case 'other_photo':
          session.step = 'confirm';
          showConfirmation(ctx, session);
          break;
        default:
          ctx.reply("Bu qadamni o'tkazib bo'lmaydi.");
      }
    });

    // Handle generic text/media messages
    bot.on('message', async (ctx: any) => {
      let session = sessions.get(ctx.from.id);
      
      const text = ctx.message.text || ctx.message.caption || '';
      const isSystemCommand = text && ['📝 Report yuborish', '📂 Mening reportlarim', 'ℹ️ Bot haqida', '🆘 Yordam', '🌐 SafeUZ AI sayti', '❌ Bekor qilish', '🔙 Orqaga', '✅ Yuborish', '⏭ O\'tkazib yuborish'].includes(text);

      if (!session || session.step === 'idle' || session.step === 'select_threat') {
        if (!isSystemCommand) {
          // Implicitly start a fast-track report
          session = { step: 'confirm', threatType: 'other' };
          sessions.set(ctx.from.id, session);
          
          // Capture the text and photo directly
          if (text) session.content = text;
          
          if (ctx.message.photo && ctx.message.photo.length > 0) {
            const largestPhoto = ctx.message.photo[ctx.message.photo.length - 1];
            try {
              const link = await ctx.telegram.getFileLink(largestPhoto.file_id);
              session.imageUrl = link.href;
            } catch (e) {
              console.error("Error getting photo link", e);
            }
          }

          if (ctx.message.location) {
            session.latitude = ctx.message.location.latitude;
            session.longitude = ctx.message.location.longitude;
            session.locationText = `Lat: ${session.latitude}, Lon: ${session.longitude}`;
          }

          if (ctx.message.forward_from_chat && ctx.message.forward_from_chat.username) {
            session.telegramPostLink = `https://t.me/${ctx.message.forward_from_chat.username}/${ctx.message.forward_from_message_id || ''}`;
          }

          showConfirmation(ctx, session);
          return;
        } else if (isSystemCommand && !['📝 Report yuborish', '📂 Mening reportlarim', 'ℹ️ Bot haqida', '🆘 Yordam', '🌐 SafeUZ AI sayti'].includes(text)) {
           return;
        }
      }

      // Handling confirmation
      if (ctx.message.text === '✅ Yuborish' && session.step === 'confirm') {
        await handleSubmission(ctx, session);
        return;
      }

      // Extract details
      let photoUrl: string | null = null;
      let latitude: number | null = null;
      let longitude: number | null = null;
      
      if (ctx.message.photo && ctx.message.photo.length > 0) {
        const largestPhoto = ctx.message.photo[ctx.message.photo.length - 1];
        try {
          const link = await ctx.telegram.getFileLink(largestPhoto.file_id);
          photoUrl = link.href;
        } catch (e) {
          console.error("Error getting photo link", e);
        }
      }
      
      if (ctx.message.location) {
        latitude = ctx.message.location.latitude;
        longitude = ctx.message.location.longitude;
      }

      // State machine logic
      switch (session.step) {
        // NARCOTICS
        case 'narcotics_text':
          session.content = text;
          session.step = 'narcotics_photo';
          ctx.reply("Juda yaxshi. Agar dalil sifatida screenshot yoki rasm bo'lsa, uni yuboring:", getSkipCancelKeyboard());
          break;
        case 'narcotics_photo':
          if (photoUrl) session.imageUrl = photoUrl;
          session.step = 'narcotics_location';
          ctx.reply("Lokatsiyani (joylashuvni) yuboring (Agar mavjud bo'lsa):", getSkipCancelKeyboard());
          break;
        case 'narcotics_location':
          if (latitude && longitude) {
            session.latitude = latitude;
            session.longitude = longitude;
            session.locationText = `Lat: ${latitude}, Lon: ${longitude}`;
          } else if (text) {
            session.locationText = text;
          }
          session.step = 'confirm';
          showConfirmation(ctx, session);
          break;

        // PHISHING
        case 'phishing_link':
          session.suspiciousLink = text;
          session.step = 'phishing_text';
          ctx.reply("Bu link haqida qisqacha izoh yozing:", getCancelKeyboard());
          break;
        case 'phishing_text':
          session.content = text;
          session.step = 'phishing_photo';
          ctx.reply("Dalil sifatida rasm / screenshot yuboring:", getSkipCancelKeyboard());
          break;
        case 'phishing_photo':
          if (photoUrl) session.imageUrl = photoUrl;
          session.step = 'confirm';
          showConfirmation(ctx, session);
          break;

        // APK
        case 'apk_file':
          session.apkName = text || (ctx.message.document ? ctx.message.document.file_name : 'Noma\'lum APK');
          session.step = 'apk_text';
          ctx.reply("Bu ilovani qayerdan topdingiz va nima uchun shubhali deb hisoblaysiz?", getCancelKeyboard());
          break;
        case 'apk_text':
          session.content = text;
          session.step = 'apk_photo';
          ctx.reply("Dalil sifatida rasm / screenshot yuboring:", getSkipCancelKeyboard());
          break;
        case 'apk_photo':
          if (photoUrl) session.imageUrl = photoUrl;
          session.step = 'confirm';
          showConfirmation(ctx, session);
          break;

        // TELEGRAM SCAM
        case 'scam_link':
          session.telegramPostLink = text;
          session.step = 'scam_text';
          ctx.reply("Scam mazmunini qisqacha tushuntirib yozing:", getCancelKeyboard());
          break;
        case 'scam_text':
          session.content = text;
          session.step = 'scam_photo';
          ctx.reply("Dalil sifatida screenshot yuboring:", getSkipCancelKeyboard());
          break;
        case 'scam_photo':
          if (photoUrl) session.imageUrl = photoUrl;
          session.step = 'confirm';
          showConfirmation(ctx, session);
          break;

        // OTHER
        case 'other_text':
          session.content = text;
          session.step = 'other_photo';
          ctx.reply("Dalil sifatida rasm yuboring:", getSkipCancelKeyboard());
          break;
        case 'other_photo':
          if (photoUrl) session.imageUrl = photoUrl;
          session.step = 'confirm';
          showConfirmation(ctx, session);
          break;

        default:
          if (session.step !== 'confirm') {
             ctx.reply("Iltimos, so'ralgan ma'lumotni kiriting yoki bekor qiling.");
          }
      }
    });

    const escapeHtml = (unsafe: string) => unsafe.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

    const showConfirmation = (ctx: any, session: UserSession) => {
      let msg = "📝 <b>Ma'lumotlaringizni tasdiqlang:</b>\n\n";
      msg += `🚨 Tur: <b>${session.threatType}</b>\n`;
      if (session.content) msg += `📄 Matn: ${escapeHtml(session.content)}\n`;
      if (session.suspiciousLink) msg += `🔗 Link: ${escapeHtml(session.suspiciousLink)}\n`;
      if (session.telegramPostLink) msg += `📲 Telegram Post: ${escapeHtml(session.telegramPostLink)}\n`;
      if (session.apkName) msg += `📦 APK Nomi: ${escapeHtml(session.apkName)}\n`;
      if (session.locationText) msg += `📍 Lokatsiya: ${escapeHtml(session.locationText)}\n`;
      if (session.imageUrl) msg += `🖼️ Rasm biriktirildi.\n`;
      
      msg += "\nBarchasi to'g'rimi? Yuborishni tasdiqlaysizmi?";
      ctx.reply(msg, { parse_mode: 'HTML', ...getConfirmKeyboard() });
    };

    const handleSubmission = async (ctx: any, session: UserSession) => {
      ctx.reply("📥 Ma'lumot qabul qilindi! SafeUZ AI tahlil qilmoqda. Iltimos, kuting...", Markup.removeKeyboard());

      try {
        const userId = ctx.from?.id.toString() || 'unknown_telegram_user';
        const userName = ctx.from?.username ? `@${ctx.from.username}` : (ctx.from?.first_name || 'Anonymous Telegram User');
        
        const contentStr = session.content || "Fayl/Rasm/Link yuborilgan";
        
        // Run AI analysis
        const aiResult = await analyzeReport(session.threatType || "other", contentStr, {
          locationText: session.locationText,
          telegramChannel: userName,
          imageUrl: session.imageUrl
        });

        const regionName = "Guliston"; // Sirdaryo regional center default for bot reports
        const reportId = `bot_report_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        
        // Fetch threshold settings from DB or use defaults
        let inspectorThreshold = 75;
        let urgentThreshold = 90;
        try {
          const s = await adminDb.collection("system_settings").doc("default").get();
          if (s.exists) {
            inspectorThreshold = s.data()?.inspectorThreshold || 75;
            urgentThreshold = s.data()?.urgentThreshold || 90;
          }
        } catch(e) {}

        let status: Report['status'] = "new";
        let assignedToRole: Report['assignedToRole'] = "admin";

        if (session.threatType === "narcotics" && aiResult.score >= inspectorThreshold) {
          status = "queued_for_inspector";
          assignedToRole = "inspector";
        }

        const isUrgent = aiResult.score >= urgentThreshold;

        const reportDoc: Report = {
          id: reportId,
          threatType: session.threatType || "other",
          source: "bot",
          content: contentStr,
          imageUrl: session.imageUrl || null,
          fileUrl: null,
          suspiciousLink: session.suspiciousLink || null,
          apkName: session.apkName || null,
          telegramChannel: userName,
          telegramPostLink: session.telegramPostLink || null,
          locationText: session.locationText || "Reported via Telegram",
          latitude: session.latitude || null,
          longitude: session.longitude || null,
          regionName,
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
          reporterId: `telegram_${userId}`,
          reporterRole: "user",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        // Write to Firestore
        await adminDb.collection("reports").doc(reportId).set(reportDoc);

        // Log Event
        const eventId = `event_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        const eventDoc: ReportEvent = {
          id: eventId,
          reportId,
          actorRole: "system",
          actorId: "telegram_bot",
          eventType: "created",
          eventNote: `Report created automatically from Telegram Bot. AI Risk Level: ${aiResult.risk_level} (${aiResult.score}%).`,
          createdAt: new Date().toISOString()
        };
        await adminDb.collection("report_events").doc(eventId).set(eventDoc);

        // Reply to user
        let messageText = `✅ <b>Report muvaffaqiyatli saqlandi va tahlil qilindi!</b>\n\n` +
          `<b>ID:</b> <code>${reportId}</code>\n` +
          `<b>AI Xavf Darajasi:</b> ${aiResult.risk_level} (Score: ${aiResult.score}%)\n\n` +
          `<b>AI Xulosasi:</b> <i>${escapeHtml(aiResult.summary)}</i>\n\n`;

        if (status === "queued_for_inspector") {
          messageText += `🚨 <b>Diqqat!</b> Bu xabar yuqori xavf darajasiga ega deb topildi va zudlik bilan tuman inspektorlariga yuborildi.`;
        } else {
          messageText += `🛡️ Xabar admin dashboard orqali ko'rib chiqish uchun yuborildi.`;
        }

        sessions.set(ctx.from.id, { step: 'idle' });
        ctx.reply(messageText, { parse_mode: 'HTML', ...getMainMenuKeyboard() });

      } catch (err) {
        console.error("Error processing Telegram Bot final submission:", err);
        sessions.set(ctx.from.id, { step: 'idle' });
        ctx.reply("❌ Kechirasiz, xatolik yuz berdi. Tizim vaqtincha ishlamayapti.", getMainMenuKeyboard());
      }
    };

    bot.launch()
      .then(() => console.log("🤖 Telegraf Telegram Bot running successfully!"))
      .catch((err) => console.error("Error launching Telegraf bot:", err));

    return bot;
  } catch (error) {
    console.error("Failed to initialize Telegraf Telegram bot:", error);
    return null;
  }
}

export function stopTelegramBot() {
  if (bot) {
    try {
      bot.stop("SIGTERM");
      console.log("Telegraf Bot stopped.");
    } catch (e) {
      console.error("Error stopping Telegraf bot:", e);
    }
  }
}
export default initTelegramBot;

