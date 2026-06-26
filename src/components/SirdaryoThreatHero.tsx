import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Activity, AlertTriangle, Info, TrendingUp, TrendingDown, Minus, MapPin, Fingerprint, BarChart3 } from 'lucide-react';
import { Link } from 'react-router-dom';
import SirdaryoThreatMap, { sirdaryoDistricts } from './SirdaryoThreatMap';

type RiskLevel = "juda_yuqori" | "yuqori" | "orta" | "past" | "juda_past";

export interface DistrictRisk {
  id: string;
  name: string;
  riskScore: number;
  riskLevel: RiskLevel;
  trend: "up" | "down" | "stable";
  cx: number;
  cy: number;
}

export const sirdaryoMapData: DistrictRisk[] = [
  { id: "guliston", name: "Guliston", riskScore: 92, riskLevel: "juda_yuqori", trend: "up", cx: 650, cy: 400 },
  { id: "yangiyer", name: "Yangiyer", riskScore: 78, riskLevel: "yuqori", trend: "stable", cx: 450, cy: 700 },
  { id: "boyovut", name: "Boyovut", riskScore: 66, riskLevel: "yuqori", trend: "up", cx: 600, cy: 600 },
  { id: "sardoba", name: "Sardoba", riskScore: 54, riskLevel: "orta", trend: "down", cx: 250, cy: 600 },
  { id: "mirzaobod", name: "Mirzaobod", riskScore: 45, riskLevel: "orta", trend: "stable", cx: 400, cy: 400 },
  { id: "shirin", name: "Shirin", riskScore: 42, riskLevel: "orta", trend: "stable", cx: 650, cy: 800 },
  { id: "sayxunobod", name: "Sayxunobod", riskScore: 36, riskLevel: "past", trend: "down", cx: 550, cy: 200 },
  { id: "sirdaryo", name: "Sirdaryo", riskScore: 32, riskLevel: "past", trend: "stable", cx: 250, cy: 200 },
  { id: "oqoltin", name: "Oqoltin", riskScore: 28, riskLevel: "past", trend: "down", cx: 150, cy: 400 },
  { id: "xovos", name: "Xovos", riskScore: 18, riskLevel: "juda_past", trend: "stable", cx: 350, cy: 850 },
];

const sirdaryoConnections = [
  ['sirdaryo', 'sayxunobod'],
  ['sirdaryo', 'oqoltin'],
  ['sirdaryo', 'mirzaobod'],
  ['oqoltin', 'sardoba'],
  ['oqoltin', 'mirzaobod'],
  ['sayxunobod', 'guliston'],
  ['mirzaobod', 'guliston'],
  ['mirzaobod', 'sardoba'],
  ['mirzaobod', 'boyovut'],
  ['guliston', 'boyovut'],
  ['sardoba', 'yangiyer'],
  ['boyovut', 'yangiyer'],
  ['yangiyer', 'xovos'],
  ['yangiyer', 'shirin'],
  ['xovos', 'shirin'],
  ['boyovut', 'shirin']
];

const riskColors = {
  juda_yuqori: "text-rose-500",
  yuqori: "text-orange-500",
  orta: "text-amber-400",
  past: "text-emerald-400",
  juda_past: "text-cyan-400"
};

const riskBgColors = {
  juda_yuqori: "bg-rose-500",
  yuqori: "bg-orange-500",
  orta: "bg-amber-400",
  past: "bg-emerald-400",
  juda_past: "bg-cyan-400"
};

const getRiskHexColor = (level: RiskLevel) => {
  switch(level) {
    case 'juda_yuqori': return '#f43f5e';
    case 'yuqori': return '#f97316';
    case 'orta': return '#fbbf24';
    case 'past': return '#34d399';
    case 'juda_past': return '#06b6d4';
    default: return '#334155';
  }
}

const getRiskLabel = (level: RiskLevel) => {
  switch (level) {
    case "juda_yuqori": return "Juda Yuqori";
    case "yuqori": return "Yuqori";
    case "orta": return "O'rta";
    case "past": return "Past";
    case "juda_past": return "Juda Past";
  }
};

export default function SirdaryoThreatHero() {
  const [hoveredDistrict, setHoveredDistrict] = useState<string | null>(null);
  const [activeDistrict, setActiveDistrict] = useState<string | null>(null);
  const [data, setData] = useState<DistrictRisk[]>([]);

  useEffect(() => {
    setData([...sirdaryoMapData].sort((a, b) => b.riskScore - a.riskScore));
  }, []);

  return (
    <section className="relative pt-24 pb-16 overflow-hidden bg-[#04060b] min-h-screen flex flex-col justify-center border-b border-slate-800/50">
      {/* Background ambient grid */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTYwIDBMMCAwaDB2NjBoNjBWMHptLTU5IDU5VjFoNTh2NThIMXoiIGZpbGw9InJnYmEoNiwgMTgyLCAyMTIsIDAuMDUpIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiLz48L3N2Zz4=')] opacity-50"></div>
      
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 w-full relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
           
           {/* LEFT COLUMN: HERO TEXT */}
           <div className="lg:col-span-4 flex flex-col justify-center space-y-8 mt-10 lg:mt-0">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 w-max">
                <Shield className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider">AI Threat Intelligence</span>
              </div>
              
              <h1 className="text-5xl sm:text-6xl lg:text-5xl xl:text-6xl font-black text-white font-sans tracking-tight uppercase leading-[1.1]">
                SafeUZ AI <br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-emerald-400">Platformasi</span>
              </h1>
              
              <p className="text-slate-400 text-lg max-w-lg leading-relaxed">
                Shubhali tahdidlar, fishing linklar, zararli APK va narkotik savdosi bilan bog'liq jinoyatlarni aniqlash hamda monitoring qilish markazi.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Link to="/report" className="px-6 py-4 bg-rose-600 hover:bg-rose-500 text-white font-mono font-bold uppercase rounded flex items-center justify-center gap-2 transition-colors shadow-[0_0_20px_rgba(225,29,72,0.3)]">
                  <AlertTriangle className="w-5 h-5" />
                  Report yuborish
                </Link>
                <Link to="/login" className="px-6 py-4 bg-slate-900 hover:bg-slate-800 text-white font-mono font-bold uppercase rounded flex items-center justify-center gap-2 transition-colors border border-slate-700">
                  <Fingerprint className="w-5 h-5 text-cyan-500" />
                  Kirish
                </Link>
              </div>

              {/* Stats row */}
              <div className="grid grid-cols-2 gap-4 pt-8 border-t border-slate-800/50">
                <div>
                  <div className="text-3xl font-black text-white font-mono mb-1">98.5%</div>
                  <div className="text-xs text-slate-500 font-mono uppercase tracking-wider">AI tahlil aniqligi</div>
                </div>
                <div>
                  <div className="text-3xl font-black text-rose-400 font-mono mb-1">24/7</div>
                  <div className="text-xs text-slate-500 font-mono uppercase tracking-wider">Live Monitoring</div>
                </div>
              </div>
           </div>

           {/* MIDDLE COLUMN: 3D MAP */}
           <div className="lg:col-span-5 relative min-h-[500px] lg:min-h-0 rounded-2xl border border-slate-800 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-900 via-[#04060b] to-[#04060b] overflow-hidden flex items-center justify-center shadow-2xl">
              {/* Map UI overlays */}
              <div className="absolute top-4 left-4 z-20 flex items-center gap-2">
                <Activity className="w-5 h-5 text-rose-500 animate-pulse" />
                <span className="text-xs font-mono font-bold text-white uppercase tracking-widest">Live Region Map</span>
              </div>
              
              {/* Scale Wrapper / 3D MAP EXTRACTED COMPONENT */}
              <div className="absolute inset-0 flex items-center justify-center">
                 <SirdaryoThreatMap 
                    onDistrictSelect={setActiveDistrict} 
                    hoveredDistrictId={activeDistrict || hoveredDistrict} 
                 />
              </div>
           </div>

           {/* RIGHT COLUMN: RANKING PANEL */}
           <div className="lg:col-span-3 flex flex-col min-h-[500px] lg:min-h-0 bg-slate-900/40 border border-slate-800 rounded-2xl overflow-hidden backdrop-blur">
             <div className="p-5 border-b border-slate-800 bg-slate-900/80">
                <h3 className="font-sans font-black text-white text-xl uppercase tracking-tight flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-cyan-500" />
                  Sirdaryo Tumanlari
                </h3>
                <p className="text-xs font-mono text-slate-400 mt-1">Xavf darajasi bo'yicha reyting</p>
             </div>

             <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
                <div className="flex flex-col gap-1">
                  {data.map((district, idx) => {
                    const isHovered = hoveredDistrict === district.id;
                    const isActive = activeDistrict === district.id;
                    
                    return (
                      <div 
                        key={district.id}
                        onMouseEnter={() => setHoveredDistrict(district.id)}
                        onMouseLeave={() => setHoveredDistrict(null)}
                        onClick={() => setActiveDistrict(isActive ? null : district.id)}
                        className={`
                          relative p-3 rounded-lg flex items-center justify-between cursor-pointer transition-all duration-200
                          ${isHovered || isActive ? 'bg-slate-800/80 border-slate-700 shadow-lg' : 'bg-transparent border-transparent hover:bg-slate-800/40'}
                          border
                        `}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-mono font-bold text-slate-500 w-4 text-center">
                            {idx + 1}
                          </span>
                          <div className="flex flex-col">
                            <span className={`font-sans font-bold text-sm ${isHovered || isActive ? 'text-white' : 'text-slate-200'}`}>
                              {district.name}
                            </span>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <div className={`w-1.5 h-1.5 rounded-full ${riskBgColors[district.riskLevel]}`}></div>
                              <span className="text-[9px] font-mono text-slate-400 uppercase tracking-wider">
                                {getRiskLabel(district.riskLevel)}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <div className="flex items-center justify-center w-5">
                            {district.trend === 'up' && <TrendingUp className="w-3 h-3 text-rose-500" />}
                            {district.trend === 'down' && <TrendingDown className="w-3 h-3 text-emerald-500" />}
                            {district.trend === 'stable' && <Minus className="w-3 h-3 text-slate-500" />}
                          </div>
                          <span className={`font-mono font-black text-base ${riskColors[district.riskLevel]} w-7 text-right`}>
                            {district.riskScore}
                          </span>
                        </div>

                        {/* Active Indicator Line */}
                        {(isHovered || isActive) && (
                          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 rounded-r-full bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.5)]"></div>
                        )}
                      </div>
                    );
                  })}
                </div>
             </div>
           </div>

        </div>

        {/* BOTTOM CHART SECTION */}
        <div className="mt-8 bg-slate-900/40 border border-slate-800 rounded-2xl overflow-hidden backdrop-blur">
          <div className="p-5 border-b border-slate-800 bg-slate-900/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-sans font-bold text-white text-lg uppercase tracking-tight">Tumanlar bo'yicha xavf darajasi grafigi</h3>
              <p className="text-[10px] font-mono text-slate-400 mt-1 uppercase tracking-widest">Sirdaryo viloyati bo'yicha tahliliy ko'rsatkich</p>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-800/80 rounded-lg border border-slate-700 w-max">
              <BarChart3 className="w-4 h-4 text-cyan-400" />
              <span className="text-[10px] font-mono font-bold text-slate-300 uppercase">Live Analytics</span>
            </div>
          </div>
          
          <div className="p-6">
            <div className="h-40 sm:h-48 flex items-end gap-2 sm:gap-4 justify-between">
              {data.map((district) => {
                const isHovered = hoveredDistrict === district.id;
                const isActive = activeDistrict === district.id;
                const heightPercent = Math.max(10, district.riskScore);
                
                const barColorClass = 
                  district.riskLevel === 'juda_yuqori' ? 'from-rose-500 to-rose-600/50' :
                  district.riskLevel === 'yuqori' ? 'from-orange-500 to-orange-600/50' :
                  district.riskLevel === 'orta' ? 'from-amber-400 to-amber-500/50' :
                  district.riskLevel === 'past' ? 'from-emerald-400 to-emerald-500/50' :
                  'from-cyan-400 to-cyan-500/50';
                  
                const hoverGlowClass = 
                  district.riskLevel === 'juda_yuqori' ? 'shadow-[0_0_15px_rgba(244,63,94,0.5)]' :
                  district.riskLevel === 'yuqori' ? 'shadow-[0_0_15px_rgba(249,115,22,0.5)]' :
                  district.riskLevel === 'orta' ? 'shadow-[0_0_15px_rgba(251,191,36,0.5)]' :
                  district.riskLevel === 'past' ? 'shadow-[0_0_15px_rgba(52,211,153,0.5)]' :
                  'shadow-[0_0_15px_rgba(6,182,212,0.5)]';

                return (
                  <div 
                    key={`chart-${district.id}`} 
                    className="relative flex-1 flex flex-col items-center group cursor-pointer"
                    onMouseEnter={() => setHoveredDistrict(district.id)}
                    onMouseLeave={() => setHoveredDistrict(null)}
                    onClick={() => setActiveDistrict(isActive ? null : district.id)}
                  >
                    <div className={`absolute -top-10 bg-slate-800 border border-slate-700 text-white text-[10px] font-mono px-2 py-1 rounded whitespace-nowrap transition-opacity duration-200 pointer-events-none z-10 ${isHovered || isActive ? 'opacity-100' : 'opacity-0'}`}>
                      {district.riskScore}% Risk
                    </div>
                    
                    <div className="w-full max-w-[48px] flex items-end justify-center h-full relative">
                      <div 
                        className={`w-full bg-gradient-to-t ${barColorClass} rounded-t transition-all duration-300 ${isHovered || isActive ? hoverGlowClass : 'opacity-70'}`}
                        style={{ height: `${heightPercent}%` }}
                      ></div>
                      <div className="absolute inset-0 w-full h-full bg-slate-800/30 rounded-t -z-10 border-b border-slate-700"></div>
                    </div>
                    
                    <div className={`mt-3 text-[9px] sm:text-[10px] font-mono text-center transform -rotate-45 sm:rotate-0 origin-top-left sm:origin-top transition-colors max-w-full overflow-hidden text-ellipsis whitespace-nowrap px-1 ${isHovered || isActive ? 'text-white font-bold' : 'text-slate-400'}`}>
                      <span className="sm:hidden">{district.name.substring(0, 3)}.</span>
                      <span className="hidden sm:inline uppercase">{district.name}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
