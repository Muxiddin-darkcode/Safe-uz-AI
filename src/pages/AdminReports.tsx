import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../firebase';
import { Report, AppUser, ReportEvent } from '../types';
import Navbar from '../components/Navbar';
import axios from 'axios';
import { useLoading } from '../context/LoadingContext';
import { ArrowLeft, Shield, AlertTriangle, Search, Filter, X, UserCheck, CheckCircle2, Terminal } from 'lucide-react';

export default function AdminReports() {
  const [reports, setReports] = useState<Report[]>([]);
  const [inspectors, setInspectors] = useState<AppUser[]>([]);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [events, setEvents] = useState<ReportEvent[]>([]);
  
  // Filters
  const [threatTypeFilter, setThreatTypeFilter] = useState("");
  const [riskLevelFilter, setRiskLevelFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  
  // Inspector assign state
  const [selectedInspectorId, setSelectedInspectorId] = useState("");
  
  // Status note state
  const [actionNote, setActionNote] = useState("");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();
  const { showLoading, hideLoading } = useLoading();

  const fetchReportsData = async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;
    try {
      const idToken = await currentUser.getIdToken();
      const config = { headers: { Authorization: `Bearer ${idToken}` } };

      const response = await axios.get("/api/reports", {
        headers: { Authorization: `Bearer ${idToken}` },
        params: {
          threatType: threatTypeFilter || undefined,
          riskLevel: riskLevelFilter || undefined,
          status: statusFilter || undefined,
          search: searchQuery || undefined
        }
      });
      setReports(response.data.reports || []);

      const responseUsers = await axios.get("/api/users", config);
      const allUsers: AppUser[] = responseUsers.data.users || [];
      setInspectors(allUsers.filter(u => u.role === "inspector"));

    } catch (err) {
      console.error("Error fetching reports/inspectors:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportsData();
  }, [threatTypeFilter, riskLevelFilter, statusFilter, searchQuery]);

  const handleSelectReport = async (rep: Report) => {
    setSelectedReport(rep);
    setSelectedInspectorId(rep.assignedInspectorId || "");
    try {
      const response = await axios.get(`/api/reports/${rep.id}`);
      setEvents(response.data.events || []);
    } catch (err) {
      console.error("Error fetching report events:", err);
    }
  };

  const handleUpdateStatus = async (status: Report['status']) => {
    if (!selectedReport) return;
    setActionLoading(true);
    showLoading(`Xabar holati o'zgartirilmoqda...`);
    setError(null);

    try {
      const currentUser = auth.currentUser;
      if (!currentUser) return;
      const idToken = await currentUser.getIdToken();

      const response = await axios.patch(`/api/reports/${selectedReport.id}/status`, {
        status,
        note: actionNote || `Admin xabar holatini "${status}" qilib yangiladi.`
      }, {
        headers: { Authorization: `Bearer ${idToken}` }
      });

      if (response.data.success) {
        setActionNote("");
        await handleSelectReport({ ...selectedReport, status });
        await fetchReportsData();
      }
    } catch (err: any) {
      console.error("Error updating status:", err);
      setError(err.response?.data?.error || "Xabar holatini yangilashda xatolik yuz berdi.");
    } finally {
      setActionLoading(false);
      hideLoading();
    }
  };

  const handleAssignInspector = async () => {
    if (!selectedReport) return;
    setActionLoading(true);
    showLoading("Mas'ul xodim biriktirilmoqda...");
    setError(null);

    const inspectorObj = inspectors.find(i => i.uid === selectedInspectorId);
    const inspectorName = inspectorObj ? inspectorObj.fullName : "";

    try {
      const currentUser = auth.currentUser;
      if (!currentUser) return;
      const idToken = await currentUser.getIdToken();

      const response = await axios.patch(`/api/reports/${selectedReport.id}/assign`, {
        inspectorId: selectedInspectorId || null,
        inspectorName
      }, {
        headers: { Authorization: `Bearer ${idToken}` }
      });

      if (response.data.success) {
        await handleSelectReport({ 
          ...selectedReport, 
          assignedInspectorId: selectedInspectorId || null,
          assignedToRole: selectedInspectorId ? "inspector" : "admin",
          status: "under_review"
        });
        await fetchReportsData();
      }
    } catch (err: any) {
      console.error("Error assigning inspector:", err);
      setError(err.response?.data?.error || "Inspektorni biriktirishda xatolik yuz berdi.");
    } finally {
      setActionLoading(false);
      hideLoading();
    }
  };

  return (
    <div className="min-h-screen bg-[#060813] text-slate-100 flex flex-col relative overflow-hidden" id="admin_reports_root">
      
      {/* Background Grids */}
      <div className="absolute inset-0 cyber-grid pointer-events-none opacity-20"></div>
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-[100px] pointer-events-none"></div>

      <Navbar role="admin" fullName="Admin" />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 flex-grow relative z-10">
        
        {/* Navigation & Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-6">
          <div className="space-y-1">
            <button
              onClick={() => navigate("/admin/dashboard")}
              className="inline-flex items-center gap-1.5 text-slate-400 hover:text-white text-xs font-mono uppercase tracking-widest transition-colors group"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-rose-500 group-hover:-translate-x-0.5 transition-transform" /> ORTGA QAYTISH
            </button>
            <h1 className="font-sans font-black text-white text-2xl uppercase tracking-tight">KIBERXAVF VA XABARLAR JURNALI</h1>
            <p className="font-mono text-[10px] text-slate-500 uppercase tracking-wider">Kelib tushgan barcha shubhali holatlar va xabarlarni boshqarish</p>
          </div>
        </div>

        {/* Filter Bar with Cyber Styling */}
        <div className="bg-[#090d16] border border-slate-800 rounded-xl p-5 flex flex-wrap gap-4 items-center glow-cyan">
          
          {/* Search Input */}
          <div className="relative flex-grow min-w-[240px]">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
              <Search className="w-4 h-4 text-cyan-500" />
            </span>
            <input
              type="text"
              placeholder="ID, havola (link) yoki kalit so'zlar bo'yicha qidirish..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#060813] border border-slate-800 rounded-lg pl-10 pr-4 py-2.5 text-xs font-mono text-slate-200 placeholder-slate-700 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/20"
            />
          </div>

          {/* Threat Type Selector */}
          <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
            <Filter className="w-4 h-4 text-slate-500" />
            <select
              value={threatTypeFilter}
              onChange={(e) => setThreatTypeFilter(e.target.value)}
              className="bg-[#060813] border border-slate-800 rounded-lg px-3.5 py-2.5 text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500"
            >
              <option value="">Barcha toifalar</option>
              <option value="narcotics">🚭 Giyohvandlik xabarlari</option>
              <option value="phishing">🎣 Fishing saytlar</option>
              <option value="malicious_apk">📱 Zararli APK</option>
              <option value="telegram_scam">💬 Telegram firibgarliklari</option>
              <option value="other">🛡️ Boshqa xabarlar</option>
            </select>
          </div>

          {/* Risk Level Selector */}
          <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
            <select
              value={riskLevelFilter}
              onChange={(e) => setRiskLevelFilter(e.target.value)}
              className="bg-[#060813] border border-slate-800 rounded-lg px-3.5 py-2.5 text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500"
            >
              <option value="">Barcha xavf darajalari</option>
              <option value="Critical">O'ta yuqori (Critical)</option>
              <option value="High">Yuqori (High)</option>
              <option value="Medium">O'rta (Medium)</option>
              <option value="Low">Past (Low)</option>
            </select>
          </div>

          {/* Status Selector */}
          <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-[#060813] border border-slate-800 rounded-lg px-3.5 py-2.5 text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500"
            >
              <option value="">Barcha holatlar</option>
              <option value="new">Yangi (new)</option>
              <option value="queued_for_inspector">Inspektor navbatida (queued)</option>
              <option value="under_review">Ko'rilmoqda (under_review)</option>
              <option value="resolved">Hal etilgan (resolved)</option>
              <option value="false_positive">Rad etilgan (false_positive)</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <div className="w-8 h-8 border-3 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-xs font-mono uppercase tracking-widest text-cyan-400">Xabarlar saralanmoqda...</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Incident Table List */}
            <div className="lg:col-span-2 bg-[#090d16] border border-slate-800 rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-800/80 text-xs text-left">
                  <thead className="bg-slate-950 text-slate-400 text-[10px] font-mono uppercase tracking-wider">
                    <tr>
                      <th className="px-5 py-3.5">XABAR ID / SANA</th>
                      <th className="px-5 py-3.5">XAVF TOIFASI / MANBA</th>
                      <th className="px-5 py-3.5">AI TAHLILI</th>
                      <th className="px-5 py-3.5">HUDUD</th>
                      <th className="px-5 py-3.5">HOLATI</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/40 text-slate-300 font-mono text-xs">
                    {reports.map((rep) => {
                      let statusBadge = "bg-slate-900 border-slate-800 text-slate-400";
                      let statusStr = rep.status;
                      if (rep.status === "new") {
                        statusBadge = "bg-cyan-950/20 border-cyan-800/60 text-cyan-400";
                        statusStr = "YANGI";
                      } else if (rep.status === "queued_for_inspector") {
                        statusBadge = "bg-rose-950/20 border-rose-800/60 text-rose-400";
                        statusStr = "INSPEKTOR NAVBATI";
                      } else if (rep.status === "under_review") {
                        statusBadge = "bg-amber-950/20 border-amber-800/60 text-amber-400";
                        statusStr = "KO'RILMOQDA";
                      } else if (rep.status === "resolved") {
                        statusBadge = "bg-emerald-950/20 border-emerald-800/60 text-emerald-400";
                        statusStr = "HAL ETILGAN";
                      } else if (rep.status === "false_positive") {
                        statusBadge = "bg-slate-950 border-slate-900 text-slate-500";
                        statusStr = "RAD ETILGAN";
                      }

                      let riskBadge = "text-slate-400";
                      let riskStr = "PAST";
                      if (rep.aiRiskLevel === "Critical") {
                        riskBadge = "text-rose-500 font-black animate-pulse";
                        riskStr = "O'TA YUQORI";
                      } else if (rep.aiRiskLevel === "High") {
                        riskBadge = "text-rose-400 font-bold";
                        riskStr = "YUQORI";
                      } else if (rep.aiRiskLevel === "Medium") {
                        riskBadge = "text-amber-400";
                        riskStr = "O'RTA";
                      }

                      let typeStr = rep.threatType.replace("_", " ").toUpperCase();
                      if (rep.threatType === "narcotics") typeStr = "GIYOHVANDLIK";
                      else if (rep.threatType === "phishing") typeStr = "FISHING SAYT";
                      else if (rep.threatType === "apk_analysis") typeStr = "ZARARLI APK";
                      else if (rep.threatType === "scam") typeStr = "FIRIBGARLIK";

                      const isSelected = selectedReport?.id === rep.id;

                      return (
                        <tr
                          key={rep.id}
                          onClick={() => handleSelectReport(rep)}
                          className={`cursor-pointer transition-colors ${
                            isSelected ? "bg-slate-950/60" : "hover:bg-slate-950/20"
                          }`}
                        >
                          <td className="px-5 py-4">
                            <span className="font-bold text-white block">#{rep.id.substring(4, 11).toUpperCase()}</span>
                            <span className="text-[10px] text-slate-500 block mt-0.5">{new Date(rep.createdAt).toLocaleDateString()}</span>
                          </td>
                          <td className="px-5 py-4">
                            <span className="font-sans font-bold text-slate-200 block uppercase text-xs">{typeStr}</span>
                            <span className="text-[10px] text-cyan-400">MANBA: {rep.source.toUpperCase()}</span>
                          </td>
                          <td className="px-5 py-4">
                            <span className={`text-[11px] font-mono uppercase tracking-wide ${riskBadge}`}>
                              {riskStr} ({rep.aiScore}%)
                            </span>
                          </td>
                          <td className="px-5 py-4">
                            <span className="font-bold text-slate-300 block">{rep.regionName.toUpperCase()}</span>
                          </td>
                          <td className="px-5 py-4">
                            <span className={`text-[9px] font-bold px-2 py-0.5 rounded border tracking-wider uppercase ${statusBadge}`}>
                              {statusStr}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Case File Sidebar (1 col) */}
            <div className="bg-[#090d16] border border-slate-800 rounded-xl p-5 shadow-2xs space-y-6 h-fit sticky top-20 glow-cyan">
              {selectedReport ? (
                <>
                  <div className="flex justify-between items-start border-b border-slate-800/80 pb-4">
                    <div>
                      <span className="text-[10px] font-mono uppercase tracking-widest text-slate-500">XABAR TAFSILOTLARI</span>
                      <h3 className="font-mono font-black text-white text-sm">XABAR #{selectedReport.id.toUpperCase()}</h3>
                    </div>
                    <button
                      onClick={() => setSelectedReport(null)}
                      className="text-slate-500 hover:text-slate-300 p-1 bg-slate-950 rounded border border-slate-800 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {error && (
                    <div className="bg-rose-950/40 border border-rose-800 text-rose-300 p-3 rounded-lg text-xs flex gap-2 items-center">
                      <AlertTriangle className="w-4 h-4 flex-shrink-0 text-rose-500" />
                      <span className="font-mono">{error}</span>
                    </div>
                  )}

                  <div className="space-y-4 font-mono text-xs">
                    {/* Content text */}
                    <div>
                      <span className="text-[9px] uppercase text-slate-500 tracking-wider font-bold">YUBORILGAN MA'LUMOT MATNI</span>
                      <p className="bg-slate-950/60 p-3 rounded border border-slate-800 text-slate-300 mt-1.5 leading-relaxed max-h-32 overflow-y-auto whitespace-pre-wrap">
                        {selectedReport.content || "Hech qanday izoh yozilmagan."}
                      </p>
                    </div>

                    {/* Threat metadata values */}
                    {selectedReport.suspiciousLink && (
                      <div>
                        <span className="text-[9px] uppercase text-slate-500 tracking-wider font-bold">SHUBHALI INTERNET HAVOLASI (LINK)</span>
                        <p className="bg-amber-950/20 border border-amber-800 p-2 rounded text-amber-300 break-all mt-1 leading-relaxed">
                          {selectedReport.suspiciousLink}
                        </p>
                      </div>
                    )}

                    {selectedReport.apkName && (
                      <div>
                        <span className="text-[9px] uppercase text-slate-500 tracking-wider font-bold">ZARARLI APK PAKETI</span>
                        <p className="font-bold text-cyan-400 mt-1">{selectedReport.apkName}</p>
                      </div>
                    )}

                    {selectedReport.telegramChannel && (
                      <div>
                        <span className="text-[9px] uppercase text-slate-500 tracking-wider font-bold">TELEGRAM SOURCE</span>
                        <p className="font-bold text-rose-400 mt-1">{selectedReport.telegramChannel}</p>
                      </div>
                    )}

                    {/* Location */}
                    <div>
                      <span className="text-[9px] uppercase text-slate-500 tracking-wider font-bold">HUDUDIY SEKTOR</span>
                      <p className="font-bold text-slate-200 mt-1">{selectedReport.regionName.toUpperCase()} HUDUDI</p>
                      {selectedReport.locationText && (
                        <p className="text-slate-500 mt-1 text-[11px] leading-relaxed">{selectedReport.locationText}</p>
                      )}
                    </div>

                    {/* AI Insights Display */}
                    <div className="bg-slate-950 border border-slate-800 rounded p-4 space-y-1 glow-cyan">
                      <div className="flex items-center gap-1">
                        <Shield className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                        <span className="text-[9px] font-mono font-black text-cyan-400 uppercase tracking-widest">SafeUZ AI Tahlili</span>
                      </div>
                      <p className="italic text-slate-400 text-[11px] leading-relaxed mt-1">"{selectedReport.aiSummary}"</p>
                    </div>

                    {/* Inspector assignment control */}
                    {selectedReport.threatType === "narcotics" && (
                      <div className="border-t border-slate-800/80 pt-4 space-y-2">
                        <span className="text-[9px] uppercase text-slate-500 tracking-wider block font-bold">Xabarni mas'ul inspektorga biriktirish</span>
                        <div className="flex gap-2">
                          <select
                            value={selectedInspectorId}
                            onChange={(e) => setSelectedInspectorId(e.target.value)}
                            className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-2 text-xs font-mono text-slate-200 flex-grow focus:outline-none focus:border-cyan-500"
                          >
                            <option value="">Admin nazoratida qoldirish</option>
                            {inspectors.map(ins => (
                              <option key={ins.uid} value={ins.uid}>
                                {ins.fullName.toUpperCase()} ({ins.assignedRegion || "Sirdaryo"})
                              </option>
                            ))}
                          </select>
                          <button
                            onClick={handleAssignInspector}
                            disabled={actionLoading}
                            className="bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-mono font-black px-4 rounded text-xs flex items-center gap-1 uppercase tracking-wider transition-colors"
                          >
                            BIRIKTIRISH
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Direct Admin Action Panel */}
                    <div className="border-t border-slate-800/80 pt-4 space-y-3">
                      <span className="text-[9px] uppercase text-slate-500 tracking-wider block font-bold">JAVOB XABARI / TEZKOR CHORA IZOHI</span>
                      <textarea
                        rows={2}
                        placeholder="Ushbu xabar bo'yicha ko'rilgan chora yoki yakuniy izohni yozing..."
                        value={actionNote}
                        onChange={(e) => setActionNote(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded p-2.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/20"
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => handleUpdateStatus("resolved")}
                          disabled={actionLoading}
                          className="bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-mono font-black py-2.5 rounded text-[10px] uppercase tracking-wider transition-colors flex items-center justify-center gap-1"
                        >
                          HAL ETILDI ✅
                        </button>
                        <button
                          onClick={() => handleUpdateStatus("false_positive")}
                          disabled={actionLoading}
                          className="bg-rose-950/20 hover:bg-rose-950/40 border border-rose-800 text-rose-400 font-mono font-black py-2.5 rounded text-[10px] uppercase tracking-wider transition-colors flex items-center justify-center gap-1"
                        >
                          RAD ETISH ❌
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-24 text-slate-500 space-y-2 font-mono">
                  <Terminal className="w-8 h-8 mx-auto text-slate-700 animate-pulse" />
                  <p className="text-xs uppercase font-bold text-slate-400">XABARNI TANLANG</p>
                  <p className="text-[10px] text-slate-600 leading-relaxed">Tafsilotlarni va AI tahlilini ko'rish uchun chap tomondagi xabarlardan birini tanlang.</p>
                </div>
              )}
            </div>

          </div>
        )}
      </main>
    </div>
  );
}
