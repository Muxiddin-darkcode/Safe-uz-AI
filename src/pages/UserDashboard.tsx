import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { db, auth } from '../firebase';
import { Report, AppUser } from '../types';
import Navbar from '../components/Navbar';
import { Shield, AlertTriangle, Clock, ListFilter, Plus, FileText, ExternalLink, ArrowRight, CheckCircle2 } from 'lucide-react';
import axios from 'axios';

export default function UserDashboard() {
  const [userProfile, setUserProfile] = useState<AppUser | null>(null);
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserData = async () => {
      const token = localStorage.getItem("safeuz_token");
      const storedUser = localStorage.getItem("safeuz_user");
      
      if (!token || !storedUser) {
        navigate("/login");
        return;
      }

      try {
        const parsedUser = JSON.parse(storedUser);
        setUserProfile(parsedUser);

        const config = {
          headers: { Authorization: `Bearer ${token}` }
        };

        const response = await axios.get("/api/reports/my", config);
        setReports(response.data.reports || []);

      } catch (err) {
        console.error("Error fetching user dashboard data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#060813] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs font-mono uppercase tracking-widest text-cyan-400">Yuklanmoqda...</span>
        </div>
      </div>
    );
  }

  const name = userProfile?.fullName || auth.currentUser?.email?.split("@")[0] || "Foydalanuvchi";

  return (
    <div className="min-h-screen bg-[#060813] text-slate-100 flex flex-col relative overflow-hidden" id="user_dashboard_root">
      
      {/* Background elements */}
      <div className="absolute inset-0 cyber-grid pointer-events-none opacity-20"></div>
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-[120px] pointer-events-none"></div>

      <Navbar role="user" fullName={name} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 flex-grow relative z-10">
        
        {/* Welcome Panel */}
        <div className="relative border border-slate-800 rounded-2xl bg-[#090d16]/90 p-6 md:p-8 overflow-hidden">
          <div className="absolute inset-y-0 right-0 w-1/3 bg-gradient-to-l from-cyan-500/5 to-transparent pointer-events-none"></div>
          
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
            <div className="space-y-2 text-center md:text-left max-w-xl">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[9px] font-mono bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 uppercase tracking-widest font-black">
                TIZIM FAOL
              </span>
              <h1 className="font-sans font-black text-2xl md:text-3xl uppercase tracking-tight text-white">
                XUSH KELIBSIZ, {name}
              </h1>
              <p className="text-slate-400 text-xs leading-relaxed">
                SafeUZ xavfsizlik portaliga xush kelibsiz. Sirdaryo viloyati bo'yicha har qanday shubhali xabarlar, giyohvand moddalar tarqatilishi yoki fishing saytlar haqidagi ma'lumotlarni xavfsiz va anonim ravishda yuborishingiz mumkin. Yuborilgan xabarlar tahlil qilinib, tuman mas'ullariga yo'naltiriladi.
              </p>
            </div>
            
            <Link
              to="/user/report"
              id="btn_new_report_cta"
              className="flex-shrink-0 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-mono font-black uppercase tracking-wider text-xs px-5 py-3.5 rounded-lg border border-cyan-400/30 shadow-[0_0_15px_rgba(6,182,212,0.3)] transition-all duration-300 flex items-center gap-2 hover:-translate-y-0.5"
            >
              <Plus className="w-4 h-4 text-slate-950" /> XABAR YUBORISH
            </Link>
          </div>
        </div>

        {/* Counters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          <div className="bg-[#090d16] border border-slate-800 p-5 rounded-xl flex items-center gap-4 hover:border-slate-700 transition-all">
            <div className="w-12 h-12 rounded bg-slate-950 border border-slate-800 flex items-center justify-center text-slate-300">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-mono font-black text-white">{reports.length}</p>
              <p className="text-[10px] font-mono uppercase text-slate-500 tracking-wider">Yuborilgan xabarlar</p>
            </div>
          </div>

          <div className="bg-[#090d16] border border-slate-800 p-5 rounded-xl flex items-center gap-4 hover:border-slate-700 transition-all">
            <div className="w-12 h-12 rounded bg-slate-950 border border-amber-500/20 flex items-center justify-center text-amber-500">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-mono font-black text-amber-400">
                {reports.filter(r => r.status === "new" || r.status === "queued_for_inspector" || r.status === "under_review").length}
              </p>
              <p className="text-[10px] font-mono uppercase text-slate-500 tracking-wider">Tahlildagi xabarlar</p>
            </div>
          </div>

          <div className="bg-[#090d16] border border-slate-800 p-5 rounded-xl flex items-center gap-4 hover:border-slate-700 transition-all">
            <div className="w-12 h-12 rounded bg-slate-950 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-mono font-black text-emerald-400">
                {reports.filter(r => r.status === "resolved").length}
              </p>
              <p className="text-[10px] font-mono uppercase text-slate-500 tracking-wider">Hal etilgan xabarlar</p>
            </div>
          </div>

        </div>

        {/* Content Zone */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main recent reports table (2 cols) */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-mono font-black text-white text-sm uppercase tracking-wider flex items-center gap-2">
                YUBORILGAN XABARLAR RO'YXATI
              </h2>
              <Link to="/user/history" className="text-xs font-mono uppercase tracking-widest text-cyan-400 hover:underline">Barchasini ko'rish &rarr;</Link>
            </div>

            {reports.length === 0 ? (
              <div className="bg-[#090d16]/60 rounded-xl border border-slate-800 p-12 text-center space-y-4">
                <FileText className="w-12 h-12 text-slate-700 mx-auto" />
                <div className="space-y-1">
                  <p className="font-mono font-bold text-slate-300 text-sm uppercase tracking-wide">SIZ TOMONDAN HECH QANDAY XABAR YUBORILMAGAN</p>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                    Siz hali hech qanday xabar yubormadingiz. Sirdaryo xavfsizligiga o'z hissangizni qo'shing va yuqoridagi tugma orqali shubhali holat haqida xabar bering.
                  </p>
                </div>
              </div>
            ) : (
              <div className="bg-[#090d16] border border-slate-800 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-800/80 text-sm text-left">
                    <thead className="bg-slate-950/80 text-slate-400 text-[10px] font-mono uppercase tracking-wider">
                      <tr>
                        <th className="px-5 py-3.5">ID / SANA</th>
                        <th className="px-5 py-3.5">XAVF TOIFASI</th>
                        <th className="px-5 py-3.5">XAVF DARAJASI (AI)</th>
                        <th className="px-5 py-3.5">HOLATI</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 text-slate-300 font-mono text-xs">
                      {reports.slice(0, 5).map((rep) => {
                        let statusBadge = "bg-slate-900 border-slate-800 text-slate-400";
                        let statusText = rep.status;
                        
                        if (rep.status === "new") {
                          statusBadge = "bg-cyan-950/20 border-cyan-800/60 text-cyan-400";
                          statusText = "Yangi";
                        } else if (rep.status === "queued_for_inspector") {
                          statusBadge = "bg-rose-950/20 border-rose-800/60 text-rose-400";
                          statusText = "Inspektorga yuborilgan";
                        } else if (rep.status === "under_review") {
                          statusBadge = "bg-amber-950/20 border-amber-800/60 text-amber-400";
                          statusText = "Ko'rib chiqilmoqda";
                        } else if (rep.status === "resolved") {
                          statusBadge = "bg-emerald-950/20 border-emerald-800/60 text-emerald-400";
                          statusText = "Hal etilgan";
                        } else if (rep.status === "false_positive") {
                          statusBadge = "bg-slate-950 border-slate-900 text-slate-600";
                          statusText = "Rad etilgan";
                        }

                        let riskBadge = "text-slate-400";
                        if (rep.aiRiskLevel === "Critical") riskBadge = "text-rose-500 font-black";
                        else if (rep.aiRiskLevel === "High") riskBadge = "text-rose-400 font-bold";
                        else if (rep.aiRiskLevel === "Medium") riskBadge = "text-amber-400";
                        else if (rep.aiRiskLevel === "Low") riskBadge = "text-emerald-400";

                        return (
                          <tr key={rep.id} className="hover:bg-slate-950/40 transition-colors">
                            <td className="px-5 py-4">
                              <span className="font-bold text-white block">#{rep.id.substring(4, 10).toUpperCase()}</span>
                              <span className="text-[10px] text-slate-500 block mt-0.5">{new Date(rep.createdAt).toLocaleDateString()}</span>
                            </td>
                            <td className="px-5 py-4 font-sans text-xs text-slate-300">
                              {rep.threatType === "narcotics" && "🚭 Giyohvandlik faoliyati"}
                              {rep.threatType === "phishing" && "🎣 Fishing sayti"}
                              {rep.threatType === "malicious_apk" && "📱 Zararli ilova (APK)"}
                              {rep.threatType === "telegram_scam" && "💬 Telegram firibgarligi"}
                              {rep.threatType === "other" && "🛡️ Boshqa holat"}
                            </td>
                            <td className="px-5 py-4">
                              <span className={`text-[11px] font-mono tracking-wider block ${riskBadge}`}>
                                {rep.aiRiskLevel === "Critical" ? "O'TA YUQORI" : rep.aiRiskLevel === "High" ? "YUQORI" : rep.aiRiskLevel === "Medium" ? "O'RTA" : "PAST"} ({rep.aiScore}%)
                              </span>
                            </td>
                            <td className="px-5 py-4">
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${statusBadge}`}>
                                {statusText}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* Guidelines Sidebar */}
          <div className="space-y-4">
            <h2 className="font-mono font-black text-white text-sm uppercase tracking-wider flex items-center gap-2">
              FOYDALI MA'LUMOTLAR
            </h2>
            <div className="bg-[#090d16] border border-slate-800 rounded-xl p-5 space-y-5">
              <div className="border-b border-slate-800/80 pb-4">
                <h4 className="font-mono font-black text-rose-400 text-xs uppercase tracking-wider">
                  Giyohvandlik belgilari
                </h4>
                <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">
                  Ko'chalarda yoki internetda tarqatiladigan giyohvand moddalar (masalan, "mef", "sol", "lyrika", "gash", "zakladka") va ularning koordinatalari yoki suratlarini yuboring.
                </p>
              </div>

              <div className="border-b border-slate-800/80 pb-4">
                <h4 className="font-mono font-black text-amber-400 text-xs uppercase tracking-wider">
                  Fishing saytlar
                </h4>
                <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">
                  Click, Uzum, Payme nomidan soxta yutuq yoki bonuslar taklif etuvchi shubhali havola va sayt manzillarini yuboring.
                </p>
              </div>

              <div>
                <h4 className="font-mono font-black text-cyan-400 text-xs uppercase tracking-wider">
                  Telegram firibgarligi
                </h4>
                <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">
                  Odamlarni aldab, pul yoki shaxsiy ma'lumotlarini o'g'irlashga qaratilgan shubhali guruh va kanallarni xabar qiling.
                </p>
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
