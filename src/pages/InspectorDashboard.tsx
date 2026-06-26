import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { auth, db } from '../firebase';
import { Report, AppUser } from '../types';
import Navbar from '../components/Navbar';
import axios from 'axios';
import { useLoading } from '../context/LoadingContext';
import { Shield, AlertTriangle, Clock, ListFilter, FileText, CheckCircle2, MapPin, ChevronRight, Terminal, Radio } from 'lucide-react';

export default function InspectorDashboard() {
  const [reports, setReports] = useState<Report[]>([]);
  const [userProfile, setUserProfile] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { showLoading, hideLoading } = useLoading();

  useEffect(() => {
    const fetchInspectorData = async () => {
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

        const responseReports = await axios.get("/api/reports/inspector", config);
        setReports(responseReports.data.reports || []);

      } catch (err) {
        console.error("Error loading inspector dashboard:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchInspectorData();
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#060813] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-rose-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs font-mono uppercase tracking-widest text-rose-400">Navbat yuklanmoqda...</span>
        </div>
      </div>
    );
  }

  const name = userProfile?.fullName || "Inspektor";

  const urgentCount = reports.filter(r => r.isUrgent && r.status !== "resolved").length;
  const queuedCount = reports.filter(r => r.status === "queued_for_inspector").length;
  const underReviewCount = reports.filter(r => r.status === "under_review").length;
  const resolvedCount = reports.filter(r => r.status === "resolved").length;

  return (
    <div className="min-h-screen bg-[#060813] text-slate-100 flex flex-col relative overflow-hidden" id="inspector_dashboard_root">
      
      {/* Background Grids */}
      <div className="absolute inset-0 cyber-grid pointer-events-none opacity-20"></div>
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-rose-500/5 rounded-full blur-[100px] pointer-events-none"></div>

      <Navbar role="inspector" fullName={name} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 flex-grow relative z-10">
        
        {/* Banner header for Inspector Panel */}
        <div className="relative border border-slate-800 rounded-2xl bg-[#090d16]/90 p-6 md:p-8 overflow-hidden glow-rose">
          <div className="absolute inset-y-0 right-0 w-1/3 bg-gradient-to-l from-rose-500/5 to-transparent pointer-events-none"></div>
          
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
            <div className="space-y-2 text-center md:text-left">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[9px] font-mono bg-rose-500/10 text-rose-400 border border-rose-500/20 uppercase tracking-widest font-black">
                <Radio className="w-3.5 h-3.5 animate-pulse" /> SIRDARYO VILOYATI NAZORAT TIZIMI
              </span>
              <h1 className="font-sans font-black text-white text-2xl md:text-3xl uppercase tracking-tight">
                INSPEKTOR: {name.toUpperCase()}
              </h1>
              <p className="text-slate-400 text-xs md:text-sm max-w-2xl leading-relaxed">
                SafeUZ AI tahlil tizimi. Quyida Sirdaryo viloyati hududlaridan yuborilgan va tahlil qilingan shubhali holatlar (giyohvandlik, firibgarlik va fishing saytlar) bo'yicha xabarlar ro'yxati keltirilgan.
              </p>
            </div>
            
            <div className="bg-slate-950 border border-slate-800 px-5 py-4 rounded-xl text-center min-w-[140px] shadow-[0_0_15px_rgba(239,68,68,0.1)]">
              <span className="block text-3xl font-mono font-black text-rose-500">{queuedCount}</span>
              <span className="text-[9px] font-mono text-slate-400 uppercase tracking-wider block mt-1">Yangi xabarlar</span>
            </div>
          </div>
        </div>

        {/* Operational Grid Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          
          <div className="bg-[#090d16] border border-slate-800 p-5 rounded-xl hover:border-slate-700 transition-all">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded bg-slate-950 border border-rose-500/30 text-rose-400 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xl font-mono font-black text-rose-500">{urgentCount}</p>
                <p className="text-[9px] font-mono uppercase text-slate-500 tracking-wider mt-0.5">SHOSHILINCH</p>
              </div>
            </div>
          </div>

          <div className="bg-[#090d16] border border-slate-800 p-5 rounded-xl hover:border-slate-700 transition-all">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded bg-slate-950 border border-cyan-500/30 text-cyan-400 flex items-center justify-center flex-shrink-0">
                <Clock className="w-4 h-4 animate-pulse" />
              </div>
              <div>
                <p className="text-xl font-mono font-black text-cyan-400">{queuedCount}</p>
                <p className="text-[9px] font-mono uppercase text-slate-500 tracking-wider mt-0.5">KUTILAYOTGAN</p>
              </div>
            </div>
          </div>

          <div className="bg-[#090d16] border border-slate-800 p-5 rounded-xl hover:border-slate-700 transition-all">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded bg-slate-950 border border-amber-500/30 text-amber-400 flex items-center justify-center flex-shrink-0">
                <ListFilter className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xl font-mono font-black text-amber-400">{underReviewCount}</p>
                <p className="text-[9px] font-mono uppercase text-slate-500 tracking-wider mt-0.5">JARAYONDA</p>
              </div>
            </div>
          </div>

          <div className="bg-[#090d16] border border-slate-800 p-5 rounded-xl hover:border-slate-700 transition-all">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded bg-slate-950 border border-emerald-500/30 text-emerald-400 flex items-center justify-center flex-shrink-0">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xl font-mono font-black text-emerald-400">{resolvedCount}</p>
                <p className="text-[9px] font-mono uppercase text-slate-500 tracking-wider mt-0.5">HAL ETILGAN</p>
              </div>
            </div>
          </div>

        </div>

        {/* Table Operations */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h2 className="font-mono font-black text-white text-sm uppercase tracking-wider flex items-center gap-2">
                <Terminal className="w-4 h-4 text-rose-500" /> KELIB TUSHGAN XABARLAR NAVBATI
              </h2>
              <p className="text-[11px] text-slate-500 mt-0.5">Giyohvandlik va boshqa kiberxavflar bo'yicha kelib tushgan xabarlar</p>
            </div>
            
            <Link
              to="/inspector/reports"
              className="text-[10px] font-mono uppercase tracking-widest bg-slate-950 hover:bg-slate-900 text-cyan-400 px-4 py-2 rounded border border-slate-800 transition-colors"
            >
              To'liq ro'yxat &rarr;
            </Link>
          </div>

          {reports.length === 0 ? (
            <div className="bg-[#090d16]/80 border border-slate-800 rounded-xl p-16 text-center space-y-4">
              <Shield className="w-12 h-12 text-slate-700 mx-auto" />
              <div className="space-y-1">
                <p className="font-mono font-bold text-slate-300 text-sm uppercase">YANGI XABARLAR MAVJUD EMAS</p>
                <p className="text-xs text-slate-500">Tizimda hozirda yangi kelib tushgan yoki ko'rib chiqilishi kerak bo'javob xabarlar mavjud emas.</p>
              </div>
            </div>
          ) : (
            <div className="bg-[#090d16] border border-slate-800 rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-800/80 text-sm text-left">
                  <thead className="bg-slate-950 text-slate-400 text-[10px] font-mono uppercase tracking-wider">
                    <tr>
                      <th className="px-5 py-3.5">XABAR ID</th>
                      <th className="px-5 py-3.5">HUDUD (SIRDARYO)</th>
                      <th className="px-5 py-3.5">XAVF DARAJASI (AI)</th>
                      <th className="px-5 py-3.5">ANIQLANGAN SHUBHALI SO'ZLAR</th>
                      <th className="px-5 py-3.5">HOLATI</th>
                      <th className="px-5 py-3.5 text-right">Amal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/40 text-slate-300 font-mono text-xs">
                    {reports.map((rep) => {
                      let statusBadge = "bg-slate-900 border-slate-800 text-slate-400";
                      let statusText = rep.status;
                      
                      if (rep.status === "queued_for_inspector") {
                        statusBadge = "bg-rose-950/20 border-rose-800/60 text-rose-400 animate-pulse";
                        statusText = "YANGI";
                      } else if (rep.status === "under_review") {
                        statusBadge = "bg-amber-950/20 border-amber-800/60 text-amber-400";
                        statusText = "JARAYONDA";
                      } else if (rep.status === "resolved") {
                        statusBadge = "bg-emerald-950/20 border-emerald-800/60 text-emerald-400";
                        statusText = "HAL ETILGAN";
                      } else if (rep.status === "false_positive") {
                        statusBadge = "bg-slate-950 border-slate-900 text-slate-650";
                        statusText = "RAD ETILGAN";
                      }

                      let riskStyle = "text-rose-400";
                      if (rep.aiRiskLevel === "Critical") riskStyle = "text-rose-500 font-black animate-pulse";

                      return (
                        <tr key={rep.id} className="hover:bg-slate-950/40 transition-colors">
                          <td className="px-5 py-4">
                            <span className="font-bold text-white block">#{rep.id.substring(4, 11).toUpperCase()}</span>
                            <span className="text-[10px] text-slate-500 block mt-0.5">{new Date(rep.createdAt).toLocaleDateString()}</span>
                          </td>
                          <td className="px-5 py-4">
                            <span className="font-bold text-slate-200 block">{rep.regionName.toUpperCase()}</span>
                            <span className="text-[10px] text-slate-400 flex items-center gap-1 mt-1 leading-relaxed">
                              <MapPin className="w-3.5 h-3.5 text-rose-500" /> {rep.locationText || "GPS koordinatalarsiz"}
                            </span>
                          </td>
                          <td className="px-5 py-4">
                            <span className={`text-[11px] font-mono uppercase tracking-wider block ${riskStyle}`}>
                              {rep.aiRiskLevel === "Critical" ? "O'TA YUQORI" : rep.aiRiskLevel === "High" ? "YUQORI" : rep.aiRiskLevel === "Medium" ? "O'RTA" : "PAST"} ({rep.aiScore}%)
                            </span>
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex flex-wrap gap-1 max-w-xs">
                              {rep.aiSlangDetected?.slice(0, 3).map(slug => (
                                <span key={slug} className="text-[10px] bg-rose-950/20 text-rose-400 px-2 py-0.5 rounded font-bold border border-rose-800/40 uppercase tracking-wide">
                                  {slug}
                                </span>
                              ))}
                              {rep.aiSlangDetected?.length > 3 && (
                                <span className="text-[9px] text-slate-500">+{rep.aiSlangDetected.length - 3} ta</span>
                              )}
                            </div>
                          </td>
                          <td className="px-5 py-4">
                            <span className={`text-[9px] font-bold px-2 py-0.5 rounded border tracking-wider uppercase ${statusBadge}`}>
                              {statusText}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-right">
                            <Link
                              to={`/inspector/report/${rep.id}`}
                              className="inline-flex items-center gap-1 text-[10px] font-mono uppercase tracking-widest bg-rose-650/80 hover:bg-rose-600 text-slate-950 font-black px-3 py-2 rounded transition-colors shadow-2xs"
                            >
                              KO'RIB CHIQISH <ChevronRight className="w-3.5 h-3.5" />
                            </Link>
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
      </main>
    </div>
  );
}
