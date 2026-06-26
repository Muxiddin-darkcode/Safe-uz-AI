import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { auth } from '../firebase';
import { Report, AppUser } from '../types';
import Navbar from '../components/Navbar';
import axios from 'axios';
import { Shield, AlertTriangle, Database, BarChart3, CheckCircle, Terminal, Radio, Activity } from 'lucide-react';

export default function AdminDashboard() {
  const [reports, setReports] = useState<Report[]>([]);
  const [userProfile, setUserProfile] = useState<AppUser | null>(null);
  const [overview, setOverview] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAdminData = async () => {
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

        const responseReports = await axios.get("/api/reports", config);
        setReports(responseReports.data.reports || []);

        const responseOverview = await axios.get("/api/analytics/overview", config);
        setOverview(responseOverview.data);

      } catch (err) {
        console.error("Error loading admin data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAdminData();
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#060813] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs font-mono uppercase tracking-widest text-cyan-400">Boshqaruv paneli yuklanmoqda...</span>
        </div>
      </div>
    );
  }

  const name = userProfile?.fullName || "Tizim Administratori";

  const totalReports = overview?.totalReports || reports.length;
  const urgentReports = overview?.urgentCount || reports.filter(r => r.isUrgent).length;
  const highRiskReports = overview?.highRiskCount || reports.filter(r => r.aiRiskLevel === "High").length;
  const resolvedCount = overview?.resolvedCount || reports.filter(r => r.status === "resolved").length;

  return (
    <div className="min-h-screen bg-[#060813] text-slate-100 flex flex-col relative overflow-hidden" id="admin_dashboard_root">
      
      {/* Background aesthetics */}
      <div className="absolute inset-0 cyber-grid pointer-events-none opacity-20"></div>
      <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-cyan-500/5 rounded-full blur-[150px] pointer-events-none"></div>

      <Navbar role="admin" fullName={name} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 flex-grow relative z-10">
        
        {/* Banner with Sirdaryo Global Monitor Details */}
        <div className="relative border border-slate-800 rounded-2xl bg-[#090d16]/90 p-6 md:p-8 overflow-hidden glow-cyan">
          <div className="absolute inset-y-0 right-0 w-1/3 bg-gradient-to-l from-cyan-500/5 to-transparent pointer-events-none"></div>
          
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
            <div className="space-y-2 text-center md:text-left">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[9px] font-mono bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 uppercase tracking-widest font-black">
                <Radio className="w-3.5 h-3.5 animate-pulse" /> GLOBAL NAZORAT TIZIMI SHIFRLANGAN
              </span>
              <h1 className="font-sans font-black text-white text-2xl md:text-3xl uppercase tracking-tight">
                TIZIM ADMINISTRATORI: {name.toUpperCase()}
              </h1>
              <p className="text-slate-400 text-xs md:text-sm max-w-2xl leading-relaxed font-sans">
                SafeUZ AI kiberxavflar va jamoat xavfsizligini ta'minlash bo'yicha boshqaruv konsoli. Sirdaryo viloyatidagi shubhali holatlar va fishing xabarlarni tahlil qilish tizimi.
              </p>
            </div>
            
            <div className="flex gap-4">
              <Link
                to="/admin/analytics"
                className="bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-mono font-black uppercase tracking-wider text-xs px-5 py-3.5 rounded border border-cyan-400/30 shadow-[0_0_15px_rgba(6,182,212,0.3)] transition-all duration-300 flex items-center gap-2 hover:-translate-y-0.5"
              >
                <BarChart3 className="w-4 h-4 text-slate-950" /> INTEGRATSIYALASHGAN TAHLIL XARITASI
              </Link>
            </div>
          </div>
        </div>

        {/* Global Metric Widgets */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          
          <div className="bg-[#090d16] border border-slate-800 p-5 rounded-xl flex items-center gap-4 hover:border-slate-700 transition-all">
            <div className="w-12 h-12 rounded bg-slate-950 border border-slate-800 flex items-center justify-center text-slate-300">
              <Database className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <p className="text-2xl font-mono font-black text-white">{totalReports}</p>
              <p className="text-[9px] font-mono uppercase text-slate-500 tracking-wider font-bold">Kelib tushgan xabarlar</p>
            </div>
          </div>

          <div className="bg-[#090d16] border border-slate-800 p-5 rounded-xl flex items-center gap-4 hover:border-slate-700 transition-all">
            <div className="w-12 h-12 rounded bg-slate-950 border border-rose-500/20 flex items-center justify-center text-rose-500 animate-pulse">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-mono font-black text-rose-500">{urgentReports}</p>
              <p className="text-[9px] font-mono uppercase text-slate-500 tracking-wider font-bold">Kechiktirib bo'lmas holatlar</p>
            </div>
          </div>

          <div className="bg-[#090d16] border border-slate-800 p-5 rounded-xl flex items-center gap-4 hover:border-slate-700 transition-all">
            <div className="w-12 h-12 rounded bg-slate-950 border border-amber-500/20 flex items-center justify-center text-amber-500">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-mono font-black text-amber-400">{highRiskReports}</p>
              <p className="text-[9px] font-mono uppercase text-slate-500 tracking-wider font-bold font-mono">Yuqori xavf darajasi</p>
            </div>
          </div>

          <div className="bg-[#090d16] border border-slate-800 p-5 rounded-xl flex items-center gap-4 hover:border-slate-700 transition-all">
            <div className="w-12 h-12 rounded bg-slate-950 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <CheckCircle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-mono font-black text-emerald-400">{resolvedCount}</p>
              <p className="text-[9px] font-mono uppercase text-slate-500 tracking-wider font-bold">Hal etilgan kiberxavflar</p>
            </div>
          </div>

        </div>

        {/* Quick-Nav Command Controls */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          <Link
            to="/admin/reports"
            id="admin_nav_reports"
            className="bg-[#090d16] border border-slate-800 p-6 rounded-xl hover:border-slate-700 hover:shadow-[0_0_20px_rgba(6,182,212,0.05)] transition-all space-y-4 flex flex-col justify-between"
          >
            <div className="space-y-2">
              <span className="text-2xl">📋</span>
              <h3 className="font-mono font-bold text-white text-sm uppercase tracking-wide">Kelib tushgan barcha xabarlar</h3>
              <p className="text-slate-400 text-xs leading-relaxed font-sans">
                Sirdaryo viloyati bo'yicha barcha fishing, giyohvandlik va zararli dasturlar xabarlarini ko'rib chiqish va boshqarish.
              </p>
            </div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-cyan-400 flex items-center gap-1">KO'RIB CHIQISH &rarr;</span>
          </Link>

          <Link
            to="/admin/sources"
            id="admin_nav_sources"
            className="bg-[#090d16] border border-slate-800 p-6 rounded-xl hover:border-slate-700 hover:shadow-[0_0_20px_rgba(6,182,212,0.05)] transition-all space-y-4 flex flex-col justify-between"
          >
            <div className="space-y-2">
              <span className="text-2xl">📡</span>
              <h3 className="font-mono font-bold text-white text-sm uppercase tracking-wide">Telegram kanallar va manbalar</h3>
              <p className="text-slate-400 text-xs leading-relaxed font-sans">
                Kiberxavflarni monitoring qilish uchun Telegram kanallarini va tahlil qilinadigan manbalarni sozlash.
              </p>
            </div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-cyan-400 flex items-center gap-1">MANBALARNI SOZLASH &rarr;</span>
          </Link>

          <Link
            to="/admin/settings"
            id="admin_nav_settings"
            className="bg-[#090d16] border border-slate-800 p-6 rounded-xl hover:border-slate-700 hover:shadow-[0_0_20px_rgba(6,182,212,0.05)] transition-all space-y-4 flex flex-col justify-between"
          >
            <div className="space-y-2">
              <span className="text-2xl">⚙️</span>
              <h3 className="font-mono font-bold text-white text-sm uppercase tracking-wide">Tizim asosiy sozlamalari</h3>
              <p className="text-slate-400 text-xs leading-relaxed font-sans">
                AI tahlil parametrlari, avtomatik baholash chegaralari va boshqa asosiy funksiyalarni sozlash.
              </p>
            </div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-cyan-400 flex items-center gap-1">SOZLAMALARNI O'ZGARTIRISH &rarr;</span>
          </Link>

        </div>

        {/* Recent Admin Reports Log */}
        <div className="space-y-4 bg-[#090d16] border border-slate-800 rounded-xl p-6">
          <div className="flex justify-between items-center border-b border-slate-800 pb-3">
            <h3 className="font-mono font-black text-white text-sm uppercase tracking-wider flex items-center gap-2">
              <Terminal className="w-4 h-4 text-rose-500 animate-pulse" /> YANGI KELIB TUSHGAN XABARLAR OQIMI
            </h3>
            <Link to="/admin/reports" className="text-xs font-mono uppercase tracking-widest text-cyan-400 hover:underline">Barcha xabarlarni ko'rish &rarr;</Link>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-800/80 text-xs text-left">
              <thead className="bg-slate-950 text-slate-400 text-[10px] font-mono uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3">XABAR ID</th>
                  <th className="px-5 py-3">XAVF TOIFASI</th>
                  <th className="px-5 py-3">HUDUD</th>
                  <th className="px-5 py-3">AI TAHLIL NATIJASI</th>
                  <th className="px-5 py-3">YUBORILGAN VAQT</th>
                  <th className="px-5 py-3">HOLATI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40 text-slate-300 font-mono text-xs">
                {reports.slice(0, 10).map((rep) => {
                  let badge = "bg-slate-900 border-slate-800 text-slate-400";
                  let statusStr = "YANGI";
                  if (rep.status === "new") {
                    badge = "bg-cyan-950/20 border-cyan-800/60 text-cyan-400";
                    statusStr = "YANGI";
                  } else if (rep.status === "queued_for_inspector") {
                    badge = "bg-rose-950/20 border-rose-800/60 text-rose-400";
                    statusStr = "INSPEKTOR NAVBATI";
                  } else if (rep.status === "under_review") {
                    badge = "bg-amber-950/20 border-amber-800/60 text-amber-400";
                    statusStr = "KO'RILMOQDA";
                  } else if (rep.status === "resolved") {
                    badge = "bg-emerald-950/20 border-emerald-800/60 text-emerald-400";
                    statusStr = "HAL ETILGAN";
                  } else if (rep.status === "false_positive") {
                    badge = "bg-slate-950 text-slate-500 border-slate-900";
                    statusStr = "RAD ETILGAN";
                  }

                  let risk = "text-slate-400";
                  let riskStr = "PAST";
                  if (rep.aiRiskLevel === "Critical") {
                    risk = "text-rose-500 font-black animate-pulse";
                    riskStr = "O'TA YUQORI";
                  } else if (rep.aiRiskLevel === "High") {
                    risk = "text-rose-400 font-bold";
                    riskStr = "YUQORI";
                  } else if (rep.aiRiskLevel === "Medium") {
                    risk = "text-amber-400 font-medium";
                    riskStr = "O'RTA";
                  }

                  let typeStr = rep.threatType.replace("_", " ").toUpperCase();
                  if (rep.threatType === "narcotics") typeStr = "GIYOHVANDLIK";
                  else if (rep.threatType === "phishing") typeStr = "FISHING SAYT";
                  else if (rep.threatType === "apk_analysis") typeStr = "ZARARLI APK";
                  else if (rep.threatType === "scam") typeStr = "FIRIBGARLIK";

                  return (
                    <tr key={rep.id} className="hover:bg-slate-950/40 transition-colors">
                      <td className="px-5 py-3.5 font-bold text-white">#{rep.id.substring(4, 11).toUpperCase()}</td>
                      <td className="px-5 py-3.5 font-sans text-xs font-bold text-slate-300">{typeStr}</td>
                      <td className="px-5 py-3.5">{rep.regionName.toUpperCase()} HUDUDI</td>
                      <td className="px-5 py-3.5">
                        <span className={`text-[11px] font-mono tracking-wide ${risk}`}>
                          {riskStr} ({rep.aiScore}%)
                        </span>
                      </td>
                      <td className="px-5 py-3.5">{new Date(rep.createdAt).toLocaleDateString()}</td>
                      <td className="px-5 py-3.5">
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded border tracking-wider uppercase ${badge}`}>
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
      </main>
    </div>
  );
}
