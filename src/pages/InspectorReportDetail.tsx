import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { auth } from '../firebase';
import { Report, ReportEvent, AppUser } from '../types';
import Navbar from '../components/Navbar';
import axios from 'axios';
import { ArrowLeft, Shield, AlertTriangle, Clock, CheckCircle2, MapPin, Calendar, AlertCircle } from 'lucide-react';

export default function InspectorReportDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [report, setReport] = useState<Report | null>(null);
  const [events, setEvents] = useState<ReportEvent[]>([]);
  const [userProfile, setUserProfile] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [reviewNote, setReviewNote] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCaseData = async () => {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        navigate("/login");
        return;
      }

      try {
        const idToken = await currentUser.getIdToken();
        const config = {
          headers: { Authorization: `Bearer ${idToken}` }
        };

        const responseUser = await axios.get("/api/users/profile", config);
        setUserProfile(responseUser.data.user);

        const responseReport = await axios.get(`/api/reports/${id}`);
        setReport(responseReport.data.report);
        setEvents(responseReport.data.events || []);

      } catch (err) {
        console.error("Error loading case detail:", err);
        setError("Xabar topilmadi yoki sizda ko'rish uchun ruxsat yo'q.");
      } finally {
        setLoading(false);
      }
    };

    fetchCaseData();
  }, [id, navigate]);

  const handleUpdateStatus = async (status: Report['status']) => {
    if (!report) return;
    setError(null);
    setActionLoading(true);

    try {
      const currentUser = auth.currentUser;
      if (!currentUser) return;
      const idToken = await currentUser.getIdToken();

      const response = await axios.patch(`/api/reports/${report.id}/status`, {
        status,
        note: reviewNote || `Inspektor xabar holatini "${status}" qilib yangiladi.`
      }, {
        headers: { Authorization: `Bearer ${idToken}` }
      });

      if (response.data.success) {
        setReport(prev => prev ? { ...prev, status } : null);
        setReviewNote("");
        
        const responseReport = await axios.get(`/api/reports/${id}`);
        setEvents(responseReport.data.events || []);
      }
    } catch (err: any) {
      console.error("Error updating status:", err);
      setError(err.response?.data?.error || "Xabar holatini o'zgartirishda xatolik yuz berdi.");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#060813] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-rose-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs font-mono uppercase tracking-widest text-rose-400">Xabar ma'lumotlari yuklanmoqda...</span>
        </div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="min-h-screen bg-[#060813] flex items-center justify-center p-4">
        <div className="bg-[#090d16] p-8 rounded-2xl border border-rose-500/30 max-w-md text-center space-y-4 glow-rose">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
          <h3 className="font-mono font-black text-white text-lg uppercase">XATOLIK</h3>
          <p className="text-xs text-slate-500 leading-relaxed">{error || "So'ralgan xabar topilmadi yoki sizda ko'rish uchun ruxsat yo'q."}</p>
          <button
            onClick={() => navigate("/inspector/dashboard")}
            className="w-full bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-200 text-xs font-mono uppercase py-2.5 rounded transition-colors"
          >
            &larr; Boshqaruv paneliga qaytish
          </button>
        </div>
      </div>
    );
  }

  const name = userProfile?.fullName || "Inspektor";

  let statusBadge = "bg-slate-950 border-slate-850 text-slate-400";
  let statusText = report.status;
  if (report.status === "queued_for_inspector") {
    statusBadge = "bg-rose-950/20 text-rose-400 border-rose-800/60 animate-pulse";
    statusText = "YANGI NAVBAT";
  } else if (report.status === "under_review") {
    statusBadge = "bg-amber-950/20 text-amber-400 border-amber-800/60";
    statusText = "KO'RIB CHIQILMOQDA";
  } else if (report.status === "resolved") {
    statusBadge = "bg-emerald-950/20 text-emerald-400 border-emerald-800/60";
    statusText = "HAL ETILGAN / YOPILGAN";
  } else if (report.status === "false_positive") {
    statusBadge = "bg-slate-950 text-slate-500 border-slate-900";
    statusText = "RAD ETILGAN (ASOSSIZ)";
  }

  return (
    <div className="min-h-screen bg-[#060813] text-slate-100 flex flex-col relative overflow-hidden" id="inspector_report_detail_root">
      
      {/* Background aesthetics */}
      <div className="absolute inset-0 cyber-grid pointer-events-none opacity-20"></div>
      <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-rose-500/5 rounded-full blur-[100px] pointer-events-none"></div>

      <Navbar role="inspector" fullName={name} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 flex-grow relative z-10">
        
        {/* Header HUD Navigation */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-6">
          <button
            onClick={() => navigate("/inspector/dashboard")}
            className="inline-flex items-center gap-1.5 text-slate-400 hover:text-white text-xs font-mono uppercase tracking-widest transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 text-rose-500 group-hover:-translate-x-0.5 transition-transform" /> BARCHA XABARLARGA QAYTISH
          </button>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider bg-slate-950 px-2 py-1 rounded border border-slate-850">
              XABAR ID: #{report.id.toUpperCase()}
            </span>
            <span className={`text-[10px] font-mono font-bold px-3 py-1 rounded border uppercase tracking-wider ${statusBadge}`}>
              {statusText}
            </span>
          </div>
        </div>

        {error && (
          <div className="bg-rose-950/40 border border-rose-800 text-rose-300 p-4 rounded-lg text-xs flex gap-2.5 items-center">
            <AlertTriangle className="w-5 h-5 flex-shrink-0 text-rose-500" />
            <span className="font-mono">{error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Case Intel Core */}
            <div className="bg-[#090d16] border border-slate-800 rounded-xl p-6 space-y-6 shadow-2xs">
              <div>
                <span className="text-[9px] font-mono uppercase tracking-widest text-slate-500 block mb-1">TIZIMGA KELIB TUSHGAN MA'LUMOT</span>
                <h2 className="text-base font-mono font-black text-white uppercase tracking-wider flex items-center gap-2">
                  🛡️ SHUBHALI XABAR BATAFSIL TAHSILOTI
                </h2>
              </div>

              {/* Submitted Content */}
              <div className="space-y-2">
                <span className="text-[9px] font-mono uppercase tracking-wider text-slate-400">YUBORILGAN MA'LUMOT MATNI</span>
                <div className="bg-slate-950 border border-slate-850 rounded-lg p-4 font-mono text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">
                  {report.content || "Hech qanday matn yozilmagan."}
                </div>
              </div>

              {/* Coordinates / Map Section */}
              <div className="border-t border-slate-800/80 pt-5 space-y-3">
                <span className="text-[9px] font-mono uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-rose-500 animate-pulse" /> Hududiy joylashuv (Koordinata)
                </span>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
                  <div className="bg-slate-950 p-3 rounded border border-slate-850">
                    <span className="text-slate-500 block text-[9px]">TUMAN / SHAHAR</span>
                    <span className="font-bold text-slate-200 text-xs mt-1 block">{report.regionName.toUpperCase()}</span>
                  </div>
                  <div className="bg-slate-950 p-3 rounded border border-slate-850">
                    <span className="text-slate-500 block text-[9px]">KENGLIK (LATITUDE)</span>
                    <span className="font-bold text-slate-200 text-xs mt-1 block">{report.latitude || "Koordinatalarsiz"}</span>
                  </div>
                  <div className="bg-slate-950 p-3 rounded border border-slate-850">
                    <span className="text-slate-500 block text-[9px]">BO'YLIK (LONGITUDE)</span>
                    <span className="font-bold text-slate-200 text-xs mt-1 block">{report.longitude || "Koordinatalarsiz"}</span>
                  </div>
                </div>
                {report.locationText && (
                  <p className="text-xs font-mono text-slate-400 bg-slate-950/40 p-3 rounded border border-slate-850/60 leading-relaxed">
                    <span className="font-bold text-slate-300 uppercase block text-[9px] mb-1">ANIQ MANZIL (MO'LJAL)</span> {report.locationText}
                  </p>
                )}
              </div>

              {/* Extra evidence metadata */}
              {(report.telegramChannel || report.telegramPostLink) && (
                <div className="border-t border-slate-800/80 pt-5 grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-xs">
                  {report.telegramChannel && (
                    <div className="bg-rose-950/10 p-3 rounded border border-rose-800/30">
                      <span className="text-[9px] text-rose-400 uppercase tracking-widest">TELEGRAM MANBA/BOT</span>
                      <span className="font-bold text-slate-200 block mt-1">{report.telegramChannel}</span>
                    </div>
                  )}
                  {report.telegramPostLink && (
                    <div className="bg-rose-950/10 p-3 rounded border border-rose-800/30">
                      <span className="text-[9px] text-rose-400 uppercase tracking-widest">TELEGRAM POST HAVOLASI</span>
                      <a href={report.telegramPostLink} target="_blank" rel="noopener noreferrer" className="font-bold text-cyan-400 hover:underline block mt-1 truncate">
                        {report.telegramPostLink}
                      </a>
                    </div>
                  )}
                </div>
              )}

              {/* Evidence image display */}
              {report.imageUrl && (
                <div className="border-t border-slate-800/80 pt-5 space-y-2">
                  <span className="text-[9px] font-mono uppercase tracking-widest text-slate-400 block mb-1">ISBOTLOVCHI EKRAM RASMI</span>
                  <div className="max-w-xl mx-auto border border-slate-800 rounded overflow-hidden shadow-2xs">
                    <img
                      referrerPolicy="no-referrer"
                      src={report.imageUrl}
                      alt="Isbotlovchi rasm"
                      className="w-full h-auto object-contain max-h-[500px]"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Case Event Timeline */}
            <div className="bg-[#090d16] border border-slate-800 rounded-xl p-6 space-y-4">
              <h3 className="font-mono font-black text-white text-xs uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-cyan-400 animate-pulse" /> HARAKATLAR VA O'ZGARIŞLAR JURNALI
              </h3>

              <div className="flow-root font-mono">
                <ul className="-mb-8">
                  {events.map((evt, idx) => {
                    const isLast = idx === events.length - 1;
                    return (
                      <li key={evt.id}>
                        <div className="relative pb-8">
                          {!isLast && (
                            <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-slate-800" aria-hidden="true" />
                          )}
                          <div className="relative flex space-x-3 items-start">
                            <div>
                              <span className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold border ${
                                evt.eventType === "created" 
                                  ? "bg-cyan-950/40 text-cyan-400 border-cyan-800"
                                  : evt.eventType === "marked_resolved"
                                  ? "bg-emerald-950/40 text-emerald-400 border-emerald-800"
                                  : evt.eventType === "marked_false_positive"
                                  ? "bg-rose-950/40 text-rose-400 border-rose-850"
                                  : "bg-amber-950/40 text-amber-400 border-amber-800"
                              }`}>
                                {idx + 1}
                              </span>
                            </div>
                            <div className="flex-grow min-w-0 pt-1.5">
                              <p className="text-xs font-bold text-slate-200 leading-relaxed">
                                {evt.eventNote}
                              </p>
                              <div className="text-[9px] text-slate-500 flex items-center gap-2 mt-1">
                                <span className="font-bold uppercase text-slate-400">{evt.actorRole === "admin" ? "Admin" : "Inspektor"} • {evt.actorId?.substring(0, 10).toUpperCase()}</span>
                                <span>&bull;</span>
                                <span className="flex items-center gap-0.5"><Calendar className="w-3.5 h-3.5" /> {new Date(evt.createdAt).toLocaleString()}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>

          </div>

          {/* Right Column */}
          <div className="space-y-6">
            
            {/* AI Analyzer Block */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 shadow-2xs space-y-4 glow-rose">
              <div className="flex items-center gap-2 border-b border-slate-800/80 pb-3">
                <Shield className="w-4 h-4 text-rose-500 animate-pulse" />
                <h3 className="font-mono font-black text-xs text-white uppercase tracking-wider">SafeUZ AI TAHLIL NATIJASI</h3>
              </div>

              <div className="space-y-4 font-mono text-xs">
                <div className="flex justify-between items-center text-[9px] font-bold uppercase tracking-widest text-slate-400">
                  <span>XAVF DARAJASI</span>
                  <span className={report.aiRiskLevel === "Critical" ? "text-rose-500 font-black animate-pulse" : report.aiRiskLevel === "High" ? "text-rose-400 font-black" : "text-emerald-400 font-black"}>
                    {report.aiRiskLevel === "Critical" ? "O'TA YUQORI" : report.aiRiskLevel === "High" ? "YUQORI" : report.aiRiskLevel === "Medium" ? "O'RTA" : "PAST"} ({report.aiScore}%)
                  </span>
                </div>

                {/* AI Summary */}
                <p className="text-[11px] text-slate-400 italic leading-relaxed bg-[#060813] p-3.5 rounded border border-slate-800/80">
                  "{report.aiSummary}"
                </p>

                {/* Detected slang list */}
                {report.aiSlangDetected && report.aiSlangDetected.length > 0 && (
                  <div className="space-y-1.5">
                    <span className="text-[9px] font-bold uppercase text-slate-500">ANIQLANGAN SHUBHALI SO'ZLAR</span>
                    <div className="flex flex-wrap gap-1">
                      {report.aiSlangDetected.map(slug => (
                        <span key={slug} className="text-[10px] bg-rose-950/20 text-rose-400 px-2 py-0.5 rounded font-bold border border-rose-800/40 uppercase">
                          {slug}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Reasoning flags */}
                {report.aiReasoningFlags && report.aiReasoningFlags.length > 0 && (
                  <div className="space-y-1.5">
                    <span className="text-[9px] font-bold uppercase text-slate-500">XAVF OMILLARI</span>
                    <div className="flex flex-wrap gap-1">
                      {report.aiReasoningFlags.map(flag => (
                        <span key={flag} className="text-[9px] bg-cyan-950/20 text-cyan-300 px-2 py-0.5 rounded border border-cyan-800/40 uppercase">
                          {flag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Officer Actions Panel */}
            <div className="bg-[#090d16] border border-slate-800 rounded-xl p-5 space-y-4">
              <h3 className="font-mono font-black text-white text-xs uppercase tracking-wider">XODIM CHORALARI VA JAVOB MA'LUMOTI</h3>

              <div className="space-y-4 font-mono">
                <textarea
                  rows={3}
                  placeholder="Xabarga oid ko'rilgan tezkor choralar va izohlaringizni kiriting..."
                  value={reviewNote}
                  onChange={(e) => setReviewNote(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded p-3 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/20"
                />

                <div className="grid grid-cols-1 gap-2">
                  <button
                    onClick={() => handleUpdateStatus("under_review")}
                    disabled={actionLoading || report.status === "under_review"}
                    className="w-full bg-amber-600 hover:bg-amber-500 text-slate-950 font-mono font-black py-2.5 rounded text-[10px] uppercase tracking-wider transition-all"
                  >
                    TEKSHIRUV JARAYONINI BOSHLASH
                  </button>

                  <button
                    onClick={() => handleUpdateStatus("resolved")}
                    disabled={actionLoading || report.status === "resolved"}
                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-mono font-black py-2.5 rounded text-[10px] uppercase tracking-wider transition-all"
                  >
                    HOLAT HAL ETILDI / YOPILDI ✅
                  </button>

                  <button
                    onClick={() => handleUpdateStatus("false_positive")}
                    disabled={actionLoading || report.status === "false_positive"}
                    className="w-full bg-rose-950/20 border border-rose-800 text-rose-400 hover:bg-rose-950/40 font-mono font-black py-2.5 rounded text-[10px] uppercase tracking-wider transition-all"
                  >
                    ASOSSIZ XABAR SIFATIDA RAD ETISH ❌
                  </button>
                </div>
              </div>
            </div>

          </div>

        </div>
      </main>
    </div>
  );
}
