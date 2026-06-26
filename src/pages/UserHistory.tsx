import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { auth } from '../firebase';
import { Report } from '../types';
import axios from 'axios';
import { ArrowLeft, Clock, Shield, AlertTriangle, ChevronRight, X, FileText, Calendar } from 'lucide-react';

export default function UserHistory() {
  const [reports, setReports] = useState<Report[]>([]);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>("all");
  const navigate = useNavigate();

  const email = auth.currentUser?.email || "";
  const name = auth.currentUser?.displayName || email.split("@")[0] || "Foydalanuvchi";

  useEffect(() => {
    const fetchReports = async () => {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        navigate("/login");
        return;
      }

      try {
        const idToken = await currentUser.getIdToken();
        const response = await axios.get("/api/reports/my", {
          headers: { Authorization: `Bearer ${idToken}` }
        });
        setReports(response.data.reports || []);
      } catch (err) {
        console.error("Error fetching user reports:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, [navigate]);

  const filteredReports = reports.filter(r => {
    if (filterType === "all") return true;
    return r.threatType === filterType;
  });

  return (
    <div className="min-h-screen bg-[#060813] text-slate-100 flex flex-col relative overflow-hidden" id="user_history_root">
      
      {/* Background visual details */}
      <div className="absolute inset-0 cyber-grid pointer-events-none opacity-20"></div>
      <div className="absolute top-1/4 right-1/4 w-[400px] h-[400px] bg-cyan-500/5 rounded-full blur-[120px] pointer-events-none"></div>

      <Navbar role="user" fullName={name} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 flex-grow relative z-10">
        
        {/* Header Block */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-6">
          <div className="space-y-1">
            <button
              onClick={() => navigate("/user/dashboard")}
              className="inline-flex items-center gap-1.5 text-slate-400 hover:text-white text-xs font-mono uppercase tracking-widest transition-colors group"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-cyan-500 group-hover:-translate-x-0.5 transition-transform" /> BOSH SAHIFAGA QAYTISH
            </button>
            <h1 className="font-sans font-black text-white text-2xl uppercase tracking-tight">XABARLAR ARXIVI</h1>
            <p className="text-xs text-slate-500">Yuborilgan xabarlarning umumiy tarixi</p>
          </div>

          {/* Filtering Pills */}
          <div className="flex flex-wrap gap-2">
            {[
              { id: "all", label: "BARCHASI" },
              { id: "narcotics", label: "Giyohvandlik" },
              { id: "phishing", label: "Fishing" },
              { id: "malicious_apk", label: "APK" },
              { id: "telegram_scam", label: "Firibgarlik" }
            ].map(pill => (
              <button
                key={pill.id}
                onClick={() => setFilterType(pill.id)}
                className={`text-[10px] font-mono uppercase px-3.5 py-2 rounded-lg border tracking-wider transition-all ${
                  filterType === pill.id
                    ? "bg-cyan-600 border-cyan-500 text-slate-950 font-black shadow-[0_0_15px_rgba(6,182,212,0.3)]"
                    : "bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700"
                }`}
              >
                {pill.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <div className="w-8 h-8 border-3 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-xs font-mono uppercase tracking-widest text-cyan-400">Yuklanmoqda...</span>
          </div>
        ) : filteredReports.length === 0 ? (
          <div className="bg-[#090d16]/80 border border-slate-800 rounded-xl p-16 text-center space-y-4 max-w-2xl mx-auto">
            <FileText className="w-12 h-12 text-slate-700 mx-auto" />
            <div className="space-y-1">
              <p className="font-mono font-bold text-slate-300 text-sm uppercase">XABARLAR TOPILMADI</p>
              <p className="text-xs text-slate-500">Shubhali holat haqida xabar yuboring yoki filtrlash parametrlarini o'zgartiring.</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Table Listing */}
            <div className="lg:col-span-2 bg-[#090d16] border border-slate-800 rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-800/60 text-sm text-left">
                  <thead className="bg-slate-950 text-slate-400 text-[10px] font-mono uppercase tracking-wider">
                    <tr>
                      <th className="px-5 py-3.5">ID</th>
                      <th className="px-5 py-3.5">TOIFA / SANA</th>
                      <th className="px-5 py-3.5">XAVF DARAJASI (AI)</th>
                      <th className="px-5 py-3.5">HOLATI</th>
                      <th className="px-5 py-3.5 text-right">Batafsil</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/40 text-slate-300 font-mono text-xs">
                    {filteredReports.map((rep) => {
                      let statusBadge = "bg-slate-900 border-slate-800 text-slate-400";
                      let statusLabel = rep.status;
                      
                      if (rep.status === "new") {
                        statusBadge = "bg-cyan-950/20 border-cyan-800/60 text-cyan-400";
                        statusLabel = "Yangi";
                      } else if (rep.status === "queued_for_inspector") {
                        statusBadge = "bg-rose-950/20 border-rose-800/60 text-rose-400";
                        statusLabel = "Inspektorga yuborilgan";
                      } else if (rep.status === "under_review") {
                        statusBadge = "bg-amber-950/20 border-amber-800/60 text-amber-400";
                        statusLabel = "Ko'rib chiqilmoqda";
                      } else if (rep.status === "resolved") {
                        statusBadge = "bg-emerald-950/20 border-emerald-800/60 text-emerald-400";
                        statusLabel = "Hal etilgan";
                      } else if (rep.status === "false_positive") {
                        statusBadge = "bg-slate-950 border-slate-900 text-slate-600";
                        statusLabel = "Rad etilgan";
                      }

                      let riskStyle = "text-slate-400";
                      if (rep.aiRiskLevel === "Critical") riskStyle = "text-rose-500 font-black";
                      else if (rep.aiRiskLevel === "High") riskStyle = "text-rose-400 font-bold";
                      else if (rep.aiRiskLevel === "Medium") riskStyle = "text-amber-400";
                      else if (rep.aiRiskLevel === "Low") riskStyle = "text-emerald-400";

                      const isSelected = selectedReport?.id === rep.id;

                      return (
                        <tr
                          key={rep.id}
                          className={`cursor-pointer transition-colors ${
                            isSelected ? "bg-slate-950/60" : "hover:bg-slate-950/25"
                          }`}
                          onClick={() => setSelectedReport(rep)}
                        >
                          <td className="px-5 py-4">
                            <span className="font-bold text-white block">#{rep.id.substring(4, 10).toUpperCase()}</span>
                          </td>
                          <td className="px-5 py-4 font-sans text-xs">
                            <span className="block font-bold text-slate-300">
                              {rep.threatType === "narcotics" && "🚭 Giyohvandlik"}
                              {rep.threatType === "phishing" && "🎣 Fishing"}
                              {rep.threatType === "malicious_apk" && "📱 APK"}
                              {rep.threatType === "telegram_scam" && "💬 Firibgarlik"}
                              {rep.threatType === "other" && "🛡️ Boshqa holat"}
                            </span>
                            <span className="text-[10px] font-mono text-slate-500 flex items-center gap-1 mt-1">
                              <Calendar className="w-3.5 h-3.5" /> {new Date(rep.createdAt).toLocaleDateString()}
                            </span>
                          </td>
                          <td className="px-5 py-4">
                            <span className={`text-[11px] font-mono uppercase tracking-wide ${riskStyle}`}>
                              {rep.aiRiskLevel === "Critical" ? "O'TA YUQORI" : rep.aiRiskLevel === "High" ? "YUQORI" : rep.aiRiskLevel === "Medium" ? "O'RTA" : "PAST"} ({rep.aiScore}%)
                            </span>
                          </td>
                          <td className="px-5 py-4">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${statusBadge}`}>
                              {statusLabel}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-right">
                            <ChevronRight className="w-4 h-4 text-slate-500 inline-block" />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Selected Case detail panel (1 col) */}
            <div className="bg-[#090d16] border border-slate-800 rounded-xl p-5 shadow-2xs space-y-6 h-fit sticky top-20">
              {selectedReport ? (
                <>
                  <div className="flex justify-between items-start border-b border-slate-800/80 pb-4">
                    <div>
                      <span className="text-[10px] uppercase tracking-wider text-slate-500">XABAR TAFSILOTLARI</span>
                      <h3 className="font-mono font-black text-white text-base">XABAR #{selectedReport.id.substring(4, 11).toUpperCase()}</h3>
                    </div>
                    <button
                      onClick={() => setSelectedReport(null)}
                      className="text-slate-500 hover:text-slate-300 p-1 bg-slate-950 rounded border border-slate-800 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="space-y-4 font-mono text-xs">
                    {/* Sector details */}
                    <div>
                      <span className="text-[9px] uppercase text-slate-500 tracking-wider">HUDUD VA JOYLAShUV</span>
                      <p className="text-xs font-bold text-white mt-1">{selectedReport.regionName.toUpperCase()} TUMANI/SHAHRI</p>
                      {selectedReport.locationText && (
                        <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">{selectedReport.locationText}</p>
                      )}
                    </div>

                    {/* Content text */}
                    <div>
                      <span className="text-[9px] uppercase text-slate-500 tracking-wider">XABAR TAFSILOTI MATNI</span>
                      <p className="text-xs bg-slate-950/60 p-3 rounded border border-slate-800 text-slate-300 mt-1.5 leading-relaxed max-h-40 overflow-y-auto">
                        {selectedReport.content || "Tafsilot yozilmagan."}
                      </p>
                    </div>

                    {/* Threat Type specific values */}
                    {selectedReport.suspiciousLink && (
                      <div>
                        <span className="text-[9px] uppercase text-slate-500 tracking-wider font-bold">SHUBHALI HAVOLA (URL)</span>
                        <p className="text-[11px] bg-amber-950/20 border border-amber-800 p-2 rounded text-amber-300 break-all font-mono mt-1.5">
                          {selectedReport.suspiciousLink}
                        </p>
                      </div>
                    )}

                    {selectedReport.telegramChannel && (
                      <div>
                        <span className="text-[9px] uppercase text-slate-500 tracking-wider">TELEGRAM MANZILI</span>
                        <p className="text-xs font-bold text-cyan-400 mt-1">
                          {selectedReport.telegramChannel}
                        </p>
                      </div>
                    )}

                    {/* AI tahlili summary */}
                    <div className="border-t border-slate-800/80 pt-4 space-y-3">
                      <div className="flex items-center gap-1.5">
                        <Shield className="w-4 h-4 text-cyan-400" />
                        <span className="text-[10px] font-black text-white uppercase tracking-wider">SafeUZ AI TAHLILI</span>
                      </div>

                      <div className="bg-slate-950 border border-slate-800 rounded p-4 space-y-2.5">
                        <div className="flex justify-between items-center border-b border-slate-800/80 pb-2 text-[10px] uppercase font-bold text-slate-400">
                          <span>Xavf tahlili</span>
                          <span className={selectedReport.aiRiskLevel === "Critical" ? "text-rose-500" : selectedReport.aiRiskLevel === "High" ? "text-rose-400" : "text-cyan-400"}>
                            {selectedReport.aiRiskLevel === "Critical" ? "O'TA YUQORI" : selectedReport.aiRiskLevel === "High" ? "YUQORI" : selectedReport.aiRiskLevel === "Medium" ? "O'RTA" : "PAST"} ({selectedReport.aiScore}%)
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 italic leading-relaxed">
                          "{selectedReport.aiSummary}"
                        </p>
                      </div>
                    </div>

                    {/* Emojis & Slangs */}
                    {selectedReport.aiSlangDetected && selectedReport.aiSlangDetected.length > 0 && (
                      <div>
                        <span className="text-[9px] uppercase text-slate-500 tracking-wider">ANIQLANGAN SHUBHALI SO'ZLAR</span>
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {selectedReport.aiSlangDetected.map(slug => (
                            <span key={slug} className="text-[10px] font-bold bg-rose-950/20 text-rose-400 border border-rose-800/60 px-2 py-0.5 rounded uppercase">
                              {slug}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Evidence image preview */}
                    {selectedReport.imageUrl && (
                      <div className="border-t border-slate-800/80 pt-4">
                        <span className="text-[9px] uppercase text-slate-500 tracking-wider block mb-1.5">YUKLANGAN EKRAM RASMI</span>
                        <img
                          referrerPolicy="no-referrer"
                          src={selectedReport.imageUrl}
                          alt="Isbot rasm"
                          className="w-full h-auto rounded border border-slate-800 shadow-2xs max-h-48 object-cover"
                        />
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="text-center py-20 text-slate-500 space-y-2 font-mono">
                  <FileText className="w-8 h-8 mx-auto text-slate-700" />
                  <p className="text-xs uppercase font-bold text-slate-400">XABARNI TANLANG</p>
                  <p className="text-[10px] text-slate-600 leading-relaxed">Batafsil ma'lumotlarni ko'rish va AI tahlili bilan tanishish uchun chap tomondagi ro'yxatdan xabarni tanlang.</p>
                </div>
              )}
            </div>

          </div>
        )}
      </main>
    </div>
  );
}
