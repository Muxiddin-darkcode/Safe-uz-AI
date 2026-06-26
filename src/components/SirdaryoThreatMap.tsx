import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Shield } from 'lucide-react';

export type RiskLevel = "juda_yuqori" | "yuqori" | "orta" | "past" | "juda_past";

export interface DistrictRisk {
  id: string;
  name: string;
  riskScore: number;
  riskLevel: RiskLevel;
  trend: "up" | "down" | "stable";
}

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

export const sirdaryoDistricts: DistrictRisk[] = [
  { id: "guliston", name: "Guliston", riskScore: 92, riskLevel: "juda_yuqori", trend: "up" },
  { id: "yangiyer", name: "Yangiyer", riskScore: 78, riskLevel: "yuqori", trend: "stable" },
  { id: "boyovut", name: "Boyovut", riskScore: 66, riskLevel: "yuqori", trend: "up" },
  { id: "sardoba", name: "Sardoba", riskScore: 54, riskLevel: "orta", trend: "down" },
  { id: "mirzaobod", name: "Mirzaobod", riskScore: 45, riskLevel: "orta", trend: "stable" },
  { id: "shirin", name: "Shirin", riskScore: 42, riskLevel: "orta", trend: "stable" },
  { id: "sayxunobod", name: "Sayxunobod", riskScore: 36, riskLevel: "past", trend: "down" },
  { id: "sirdaryo", name: "Sirdaryo", riskScore: 32, riskLevel: "past", trend: "stable" },
  { id: "oqoltin", name: "Oqoltin", riskScore: 28, riskLevel: "past", trend: "down" },
  { id: "xovos", name: "Xovos", riskScore: 18, riskLevel: "juda_past", trend: "stable" },
];

interface SirdaryoThreatMapProps {
  onDistrictSelect?: (id: string | null) => void;
  hoveredDistrictId?: string | null;
}

export default function SirdaryoThreatMap({ onDistrictSelect, hoveredDistrictId }: SirdaryoThreatMapProps) {
  const [internalHover, setInternalHover] = useState<string | null>(null);
  const [rotation, setRotation] = useState(0);
  const activeHover = hoveredDistrictId || internalHover;

  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  // Measure container and scale 800x800 system to fit perfectly
  useEffect(() => {
    if (!containerRef.current) return;
    
    const updateScale = () => {
      if (!containerRef.current) return;
      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight || 500;
      
      const targetWidth = 800;
      const targetHeight = 800;
      
      const scaleX = width / targetWidth;
      const scaleY = height / targetHeight;
      
      // We want to scale down on small screens, but cap at 1.1x on ultra wide screens
      const newScale = Math.min(scaleX, scaleY, 1.1);
      setScale(Math.max(newScale, 0.38)); // set a minimum threshold so it doesn't vanish entirely
    };

    updateScale();
    const resizeObserver = new ResizeObserver(() => {
      updateScale();
    });
    
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }
    
    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  // Radar scanning effect
  useEffect(() => {
    const interval = setInterval(() => {
      setRotation(prev => (prev + 1.5) % 360);
    }, 40);
    return () => clearInterval(interval);
  }, []);

  // Sort and arrange districts in a circle
  const sortedDistricts = [...sirdaryoDistricts].sort((a, b) => b.riskScore - a.riskScore);
  const totalNodes = sortedDistricts.length;
  const radius = 260; // Pixels from center
  const center = { x: 400, y: 400 };

  const getCoordinates = (index: number, total: number) => {
    const angle = (index / total) * 2 * Math.PI - Math.PI / 2; // Start from top
    return {
      x: center.x + radius * Math.cos(angle),
      y: center.y + radius * Math.sin(angle),
    };
  };

  return (
    <div 
      ref={containerRef} 
      className="relative w-full h-full min-h-[420px] sm:min-h-[500px] md:min-h-[600px] flex items-center justify-center overflow-hidden bg-transparent"
    >
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(6,182,212,0.05),_transparent)] pointer-events-none"></div>
      
      {/* Container to scale easily - always centered exactly */}
      <div 
        className="relative w-[800px] h-[800px] flex-shrink-0 flex items-center justify-center origin-center transition-transform duration-300 ease-out"
        style={{ transform: `scale(${scale})` }}
      >
        
        {/* Radar Background & Grids */}
        <div 
          className="absolute pointer-events-none flex items-center justify-center"
          style={{ left: '400px', top: '400px', transform: 'translate(-50%, -50%)', width: '800px', height: '800px' }}
        >
          <div className="w-[700px] h-[700px] rounded-full border border-slate-800/80 bg-slate-900/20"></div>
          <div className="absolute w-[500px] h-[500px] rounded-full border border-slate-700/50"></div>
          <div className="absolute w-[300px] h-[300px] rounded-full border border-cyan-900/30 bg-cyan-950/10"></div>
          
          {/* Crosshairs */}
          <div className="absolute w-full h-[1px] bg-slate-800/60"></div>
          <div className="absolute h-full w-[1px] bg-slate-800/60"></div>
          
          {/* Sweeping Radar beam */}
          <div 
            className="absolute w-[350px] h-[350px] origin-bottom-right opacity-40 mix-blend-screen"
            style={{ 
              background: 'conic-gradient(from 180deg at 100% 100%, transparent 0deg, rgba(6, 182, 212, 0.4) 60deg, transparent 65deg)',
              transform: `rotate(${rotation}deg) translate(-50%, -50%)`,
              left: '50%',
              top: '50%',
            }}
          ></div>
        </div>

        {/* Central Core */}
        <div 
          className="absolute z-10 w-24 h-24 bg-slate-950 border border-cyan-500 rounded-full flex items-center justify-center shadow-[0_0_40px_rgba(6,182,212,0.3)]"
          style={{ left: '400px', top: '400px', transform: 'translate(-50%, -50%)' }}
        >
           <div className="absolute inset-0 rounded-full border-2 border-cyan-400 opacity-20 animate-ping" style={{ animationDuration: '3s' }}></div>
           <Shield className="w-10 h-10 text-cyan-400" />
        </div>

        {/* Connection Lines & Nodes */}
        <svg viewBox="0 0 800 800" className="absolute inset-0 w-full h-full pointer-events-none z-20">
          {sortedDistricts.map((d, i) => {
            const pos = getCoordinates(i, totalNodes);
            const isHovered = activeHover === d.id;
            const lineColor = isHovered ? getRiskHexColor(d.riskLevel) : 'rgba(30, 41, 59, 0.8)';
            const strokeWidth = isHovered ? 3 : 1;

            return (
              <g key={`line-${d.id}`}>
                <line 
                  x1={center.x} y1={center.y} 
                  x2={pos.x} y2={pos.y} 
                  stroke={lineColor} 
                  strokeWidth={strokeWidth}
                  className="transition-all duration-300"
                  strokeDasharray={isHovered ? "0" : "5,5"}
                />
              </g>
            )
          })}
        </svg>

        {/* District Nodes (HTML Overlay) */}
        {sortedDistricts.map((d, i) => {
          const pos = getCoordinates(i, totalNodes);
          const isHovered = activeHover === d.id;
          const isHighRisk = d.riskLevel === 'juda_yuqori' || d.riskLevel === 'yuqori';
          
          return (
            <div
              key={`node-${d.id}`}
              className="absolute z-30 transition-all duration-300"
              style={{ left: pos.x, top: pos.y, transform: 'translate(-50%, -50%)' }}
              onMouseEnter={() => setInternalHover(d.id)}
              onMouseLeave={() => setInternalHover(null)}
              onClick={() => onDistrictSelect && onDistrictSelect(d.id)}
            >
              {/* Outer pulsing ring for high risk */}
              {isHighRisk && (
                <div className="absolute inset-[-20px] rounded-full border border-rose-500 opacity-0 animate-[ping_2s_ease-out_infinite]"></div>
              )}

              {/* Node Core */}
              <div 
                className={`relative w-12 h-12 rounded-full flex items-center justify-center cursor-pointer transition-transform duration-300 ${isHovered ? 'scale-125 z-50' : 'scale-100'} ${riskBgColors[d.riskLevel]} shadow-[0_0_20px_currentColor] border-2 border-slate-900`}
              >
                <span className="text-slate-950 font-black font-mono text-sm">{d.riskScore}</span>
              </div>

              {/* Permanent small label below node */}
              <div className={`absolute top-full mt-3 left-1/2 -translate-x-1/2 transition-opacity duration-300 ${isHovered ? 'opacity-0' : 'opacity-100'}`}>
                <span className="bg-slate-900/80 backdrop-blur text-white text-[10px] uppercase tracking-wider px-2 py-1 border border-slate-700 rounded font-mono shadow-xl whitespace-nowrap">
                  {d.name}
                </span>
              </div>

              {/* Detailed Tooltip on Hover */}
              <AnimatePresence>
                {isHovered && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.9 }}
                    className="absolute bottom-full mb-4 left-1/2 -translate-x-1/2 bg-slate-950/95 backdrop-blur-xl border border-slate-700 p-4 rounded-xl shadow-[0_20px_40px_rgba(0,0,0,0.8)] pointer-events-none min-w-[160px] text-center z-[100]"
                  >
                    <div className="text-white font-sans font-bold text-base whitespace-nowrap mb-1">{d.name}</div>
                    <div className={`font-mono font-black text-3xl ${riskColors[d.riskLevel]} flex items-center justify-center gap-2 mb-2`}>
                      {d.riskScore}
                      <AlertTriangle className="w-5 h-5" />
                    </div>
                    <div className="flex items-center justify-center gap-2 mt-2 pt-2 border-t border-slate-800">
                      <div className="text-[10px] font-mono text-slate-400 uppercase tracking-widest px-2 py-1 bg-slate-900 rounded">{getRiskLabel(d.riskLevel)}</div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )
        })}

      </div>
    </div>
  );
}

