import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../firebase';
import Navbar from '../components/Navbar';
import VisualCharts from '../components/VisualCharts';
import axios from 'axios';
import { ArrowLeft, BarChart3, TrendingUp, Compass, Calendar, Activity } from 'lucide-react';

export default function AdminAnalytics() {
  const [regionData, setRegionData] = useState<any[]>([]);
  const [threatTypes, setThreatTypes] = useState<Record<string, number>>({});
  const [topKeywords, setTopKeywords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAnalyticsData = async () => {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        navigate("/login");
        return;
      }

      try {
        const idToken = await currentUser.getIdToken();
        const config = { headers: { Authorization: `Bearer ${idToken}` } };

        const responseRegions = await axios.get("/api/analytics/regions", config);
        setRegionData(responseRegions.data.regions || []);

        const responseThreatTypes = await axios.get("/api/analytics/overview", config);
        setThreatTypes(responseThreatTypes.data.threatTypes || {});

        const responseKeywords = await axios.get("/api/analytics/top-keywords", config);
        setTopKeywords(responseKeywords.data.topKeywords || []);

      } catch (err) {
        console.error("Error fetching analytics data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalyticsData();
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#060813] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs font-mono uppercase tracking-widest text-cyan-400">Tahlillar yuklanmoqda...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#060813] text-slate-100 flex flex-col relative overflow-hidden" id="admin_analytics_root">
      
      {/* Background Grids */}
      <div className="absolute inset-0 cyber-grid pointer-events-none opacity-20"></div>
      <div className="absolute top-1/3 left-1/3 w-[500px] h-[500px] bg-rose-500/5 rounded-full blur-[150px] pointer-events-none"></div>

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
            <h1 className="font-sans font-black text-white text-2xl uppercase tracking-tight flex items-center gap-2">
              <BarChart3 className="w-6 h-6 text-cyan-400 animate-pulse" /> Sirdaryo viloyati kiberxavf tahlili
            </h1>
            <p className="font-mono text-[10px] text-slate-500 uppercase tracking-wider">Xavf tahlili vizualizatsiyasi, xavf ko'rsatkichlari va hududiy statistikalar</p>
          </div>
          <div className="text-xs font-mono text-slate-400 flex items-center gap-2 bg-[#090d16] px-3.5 py-2.5 rounded border border-slate-800 shadow-2xs">
            <Calendar className="w-3.5 h-3.5 text-cyan-400 animate-pulse" /> STATISTIKA: FAOL (LIVE)
          </div>
        </div>

        {/* Real-time stats header banner */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          <div className="bg-[#090d16] border border-slate-800 rounded-xl p-6 flex flex-col justify-between hover:border-slate-750 transition-all">
            <TrendingUp className="w-8 h-8 text-rose-500 animate-pulse" />
            <div className="mt-6">
              <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest block">ENG YUQORI XAVFLI HUDUD (SIRDARYO)</span>
              <span className="text-xl font-mono font-black text-white mt-1 block uppercase">
                {regionData[0]?.regionName || "KUTILMOQDA..."}
              </span>
              <p className="text-[10px] text-slate-400 mt-2 font-mono leading-relaxed">
                Kelib tushgan xabarlarning og'irlik darajasiga qarab hisoblangan eng xavfli hudud.
              </p>
            </div>
          </div>

          <div className="bg-[#090d16] border border-slate-800 rounded-xl p-6 flex flex-col justify-between hover:border-slate-750 transition-all">
            <Compass className="w-8 h-8 text-amber-500" />
            <div className="mt-6">
              <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest block">GIYOHVANDLIK HAQIDAGI XABARLAR</span>
              <span className="text-xl font-mono font-black text-white mt-1 block">
                {threatTypes.narcotics || 0} TA FAOL XABAR
              </span>
              <p className="text-[10px] text-slate-400 mt-2 font-mono leading-relaxed">
                SafeUZ AI tizimi orqali mas'ul inspektorlarga yo'naltirilgan giyohvandlik holatlari soni.
              </p>
            </div>
          </div>

          <div className="bg-[#090d16] border border-slate-800 rounded-xl p-6 flex flex-col justify-between hover:border-slate-750 transition-all">
            <Activity className="w-8 h-8 text-cyan-500 animate-pulse" />
            <div className="mt-6">
              <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest block">KIBERJINOYATLAR KO'RSATKICHI</span>
              <span className="text-xl font-mono font-black text-white mt-1 block">
                {(threatTypes.phishing || 0) + (threatTypes.malicious_apk || 0) + (threatTypes.telegram_scam || 0)} TA TAHDID
              </span>
              <p className="text-[10px] text-slate-400 mt-2 font-mono leading-relaxed">
                Fishing saytlar, zararli dasturlar (APK) va guruh firibgarlik havolalari jami soni.
              </p>
            </div>
          </div>

        </div>

        {/* Premium charts component */}
        <VisualCharts
          regionData={regionData}
          threatTypes={threatTypes}
          topKeywords={topKeywords}
        />
      </main>
    </div>
  );
}
