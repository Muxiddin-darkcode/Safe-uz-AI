import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../firebase';
import Navbar from '../components/Navbar';
import axios from 'axios';
import { ArrowLeft, Save, Sliders, CheckCircle, RotateCcw } from 'lucide-react';

export default function AdminSettings() {
  const [inspectorThreshold, setInspectorThreshold] = useState("75");
  const [urgentThreshold, setUrgentThreshold] = useState("90");
  const [mediumThreshold, setMediumThreshold] = useState("40");
  const [telegramBotToken, setTelegramBotToken] = useState("");
  const [telegramBotUsername, setTelegramBotUsername] = useState("");
  
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSettings = async () => {
      const currentUser = auth.currentUser;
      if (!currentUser) return;
      try {
        const idToken = await currentUser.getIdToken();
        const response = await axios.get("/api/settings", {
          headers: { Authorization: `Bearer ${idToken}` }
        });
        
        setInspectorThreshold(response.data.inspectorThreshold.toString());
        setUrgentThreshold(response.data.urgentThreshold.toString());
        setMediumThreshold(response.data.mediumThreshold.toString());
        setTelegramBotToken(response.data.telegramBotToken || "");
        setTelegramBotUsername(response.data.telegramBotUsername || "");
      } catch (err) {
        console.error("Error loading settings:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, [navigate]);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitLoading(true);
    setSuccess(false);

    try {
      const currentUser = auth.currentUser;
      if (!currentUser) return;
      const idToken = await currentUser.getIdToken();

      await axios.post("/api/settings", {
        inspectorThreshold: parseInt(inspectorThreshold),
        urgentThreshold: parseInt(urgentThreshold),
        mediumThreshold: parseInt(mediumThreshold),
        telegramBotToken: telegramBotToken.trim(),
        telegramBotUsername: telegramBotUsername.trim()
      }, {
        headers: { Authorization: `Bearer ${idToken}` }
      });

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error("Error saving settings:", err);
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleResetDefaults = () => {
    setInspectorThreshold("75");
    setUrgentThreshold("90");
    setMediumThreshold("40");
    setTelegramBotToken("");
    setTelegramBotUsername("");
  };

  return (
    <div className="min-h-screen bg-[#060813] text-slate-100 flex flex-col relative overflow-hidden" id="admin_settings_root">
      
      {/* Background aesthetics */}
      <div className="absolute inset-0 cyber-grid pointer-events-none opacity-20"></div>
      <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-[100px] pointer-events-none"></div>

      <Navbar role="admin" fullName="Admin" />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 flex-grow relative z-10">
        
        {/* Navigation & Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-6">
          <div className="space-y-1">
            <button
              onClick={() => navigate("/admin/dashboard")}
              className="inline-flex items-center gap-1.5 text-slate-400 hover:text-white text-xs font-mono uppercase tracking-widest transition-colors group"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-rose-500 group-hover:-translate-x-0.5 transition-transform" /> ORTGA QAYTISH
            </button>
            <h1 className="font-sans font-black text-white text-2xl uppercase tracking-tight">AI SENSITIVE SOZLAMALARI</h1>
            <p className="font-mono text-[10px] text-slate-500 uppercase tracking-wider">SafeUZ AI algoritmlari sezgirlik koeffitsiyentlarini va avtomatik biriktirish chegaralarini sozlash</p>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="w-8 h-8 border-3 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-xs font-mono uppercase tracking-widest text-cyan-400">Sozlamalar yuklanmoqda...</span>
          </div>
        ) : (
          <form onSubmit={handleSaveSettings} className="bg-[#090d16] border border-slate-800 rounded-xl p-6 space-y-6 glow-cyan">
            
            <h3 className="font-mono font-black text-white text-xs uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-800 pb-4">
              <Sliders className="w-4 h-4 text-cyan-400" /> SafeUZ AI ALGORITMLARI SEZGIRLIK SOZLAMALARI
            </h3>

            {success && (
              <div className="bg-emerald-950/20 border border-emerald-800 text-emerald-400 p-4 rounded text-xs font-mono flex gap-2 items-center">
                <CheckCircle className="w-4 h-4 text-emerald-400 animate-pulse" />
                <span>MUVAFFAQIYATLI: SafeUZ AI sezgirlik sozlamalari yangilandi!</span>
              </div>
            )}

            <div className="space-y-6 font-mono text-xs">
              
              {/* Inspector Threshold */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                <div className="md:col-span-2 space-y-1">
                  <label className="block text-[10px] font-bold text-slate-200 uppercase tracking-wide">GIYOHVANDLIK HAQIDA AVTOMATIK BIRIKTIRISH CHEGARASI</label>
                  <p className="text-xs text-slate-500 leading-relaxed font-sans">
                    Giyohvandlikka oid xabarlarni avtomatik tarzda tuman inspektorlarining navbatiga yo'naltirish uchun minimal AI tahlil ko'rsatkichi.
                  </p>
                </div>
                <div>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={inspectorThreshold}
                    onChange={(e) => setInspectorThreshold(e.target.value)}
                    className="w-full bg-[#060813] border border-slate-800 rounded px-3 py-2.5 text-sm text-center font-bold font-mono focus:outline-none focus:border-cyan-500 text-cyan-400"
                  />
                </div>
              </div>

              {/* Urgent/Critical Threshold */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center border-t border-slate-850 pt-6">
                <div className="md:col-span-2 space-y-1">
                  <label className="block text-[10px] font-bold text-slate-200 uppercase tracking-wide">O'TA YUQORI (CRITICAL) XAVF DARAJASI CHEGARASI</label>
                  <p className="text-xs text-slate-500 leading-relaxed font-sans">
                    Ushbu foizdan yuqori ball olgan xabarlar favqulodda muhim deb belgilanadi va tizimda o'ta yuqori (Critical) xavf signali sifatida ko'rsatiladi.
                  </p>
                </div>
                <div>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={urgentThreshold}
                    onChange={(e) => setUrgentThreshold(e.target.value)}
                    className="w-full bg-[#060813] border border-slate-800 rounded px-3 py-2.5 text-sm text-center font-bold font-mono focus:outline-none focus:border-cyan-500 text-rose-500"
                  />
                </div>
              </div>

              {/* Medium Threshold */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center border-t border-slate-850 pt-6">
                <div className="md:col-span-2 space-y-1">
                  <label className="block text-[10px] font-bold text-slate-200 uppercase tracking-wide">PAST (LOW) XAVF DARAJASI CHEGARASI</label>
                  <p className="text-xs text-slate-500 leading-relaxed font-sans">
                    Ushbu foizdan past ball olgan xabarlar arxivda oddiy holat (Low risk) sifatida saqlanadi.
                  </p>
                </div>
                <div>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={mediumThreshold}
                    onChange={(e) => setMediumThreshold(e.target.value)}
                    className="w-full bg-[#060813] border border-slate-800 rounded px-3 py-2.5 text-sm text-center font-bold font-mono focus:outline-none focus:border-cyan-500 text-amber-500"
                  />
                </div>
              </div>

              {/* Telegram Bot Settings Section */}
              <div className="border-t border-slate-800 pt-6 space-y-4">
                <h4 className="text-cyan-400 font-sans font-black text-xs uppercase tracking-wider flex items-center gap-1.5">
                  🤖 TELEGRAM BOT INTEGRATSIYASI (TIZIMGA ULASH)
                </h4>
                <p className="text-xs text-slate-500 font-sans leading-relaxed">
                  Fuqarolar xabarlarini bevosita Telegram bot orqali qabul qilish uchun Bot Tokeni va Bot foydalanuvchi nomini kiriting. Botga yuborilgan har bir xabar, rasm, va lokatsiya SafeUZ AI tomonidan avtomatik ravishda tahlil qilinib, tuman inspektorlariga yuboriladi.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-slate-200 uppercase tracking-wide">TELEGRAM BOT TOKEN <span className="text-rose-500">*</span></label>
                    <input
                      type="text"
                      placeholder="Masalan: 1234567890:ABCdefGhIJKlmNoPQRsTUVwxyZ"
                      value={telegramBotToken}
                      onChange={(e) => setTelegramBotToken(e.target.value)}
                      className="w-full bg-[#060813] border border-slate-800 rounded px-3 py-2.5 text-xs font-mono focus:outline-none focus:border-cyan-500 text-slate-100 placeholder-slate-700"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-slate-200 uppercase tracking-wide">TELEGRAM BOT FOYDALANUVCHI NOMI (USERNAME)</label>
                    <input
                      type="text"
                      placeholder="Masalan: @SafeUzSirdaryoBot"
                      value={telegramBotUsername}
                      onChange={(e) => setTelegramBotUsername(e.target.value)}
                      className="w-full bg-[#060813] border border-slate-800 rounded px-3 py-2.5 text-xs font-mono focus:outline-none focus:border-cyan-500 text-slate-100 placeholder-slate-700"
                    />
                  </div>
                </div>

                <div className="bg-slate-950/60 p-4 border border-slate-855 rounded-lg space-y-2 text-[11px] text-slate-400 font-sans leading-relaxed">
                  <p className="font-bold text-slate-200 font-mono uppercase text-[9px] tracking-wider">💡 BOTNI SOZLASh YO'RIQNOMASI:</p>
                  <ol className="list-decimal pl-4 space-y-1 font-mono text-[10px] text-slate-500">
                    <li>Telegramda <a href="https://t.me/BotFather" target="_blank" rel="noreferrer" className="text-cyan-400 underline">@BotFather</a> profiliga kiring va <code className="text-slate-300">/newbot</code> buyrug'ini yuboring.</li>
                    <li>Botga nom va unikal foydalanuvchi nomi berib, uning API Tokenini oling va yuqoridagi maydonga kiriting.</li>
                    <li>Tugmani bosing va sozlamalarni saqlang. SafeUZ AI serveri darhol botingizni ishga tushiradi!</li>
                  </ol>
                </div>
              </div>

            </div>

            <div className="border-t border-slate-800 pt-5 mt-8 flex flex-wrap justify-between gap-4">
              <button
                type="button"
                onClick={handleResetDefaults}
                className="bg-slate-950 hover:bg-slate-900 text-slate-400 font-mono font-bold px-4 py-2.5 rounded border border-slate-800 flex items-center gap-1.5 text-xs transition-all uppercase tracking-wider"
              >
                DIFOLT HOLATGA QAYTARISH
              </button>

              <button
                type="submit"
                disabled={submitLoading}
                className="bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-mono font-black px-5 py-2.5 rounded text-xs flex items-center gap-1.5 shadow-sm uppercase tracking-wider transition-all"
              >
                <Save className="w-3.5 h-3.5" /> SOZLAMALARNI SAQLASH
              </button>
            </div>
          </form>
        )}
      </main>
    </div>
  );
}
