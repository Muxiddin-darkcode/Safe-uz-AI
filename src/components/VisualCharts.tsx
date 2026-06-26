import React from 'react';
import { SIRDARYO_REGIONS } from '../types';
import { Shield, Radio, Flame, Sparkles, Terminal } from 'lucide-react';

interface VisualChartsProps {
  regionData: Array<{
    regionName: string;
    totalReports: number;
    highRiskCount: number;
    criticalCount: number;
    threatScore: number;
  }>;
  threatTypes: Record<string, number>;
  topKeywords: Array<{ keyword: string; count: number }>;
}

export default function VisualCharts({ regionData, threatTypes, topKeywords }: VisualChartsProps) {
  const maxThreatScore = Math.max(...regionData.map(r => r.threatScore), 1);
  const maxReports = Math.max(...regionData.map(r => r.totalReports), 1);

  const totalReportsCount = Object.values(threatTypes).reduce((a, b) => a + b, 0);

  const threatColors: Record<string, string> = {
    narcotics: "bg-rose-500",
    phishing: "bg-amber-500",
    malicious_apk: "bg-cyan-500",
    telegram_scam: "bg-indigo-500",
    other: "bg-slate-500"
  };

  const threatLabels: Record<string, string> = {
    narcotics: "NARCOTICS INVESTIGATIONS",
    phishing: "PHISHING ATTACKS",
    malicious_apk: "MALICIOUS APK SPREAD",
    telegram_scam: "TELEGRAM GIVEAWAY FRAUD",
    other: "GENERAL INTEL INDICATORS"
  };

  return (
    <div className="space-y-8" id="visual_charts_wrapper">
      
      {/* Sirdaryo Map / Regional Danger Bar Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Regional bar listing with beautiful progress bars */}
        <div className="lg:col-span-2 bg-[#090d16] rounded-xl border border-slate-800 p-6 shadow-2xs">
          <div className="mb-6 flex justify-between items-center border-b border-slate-850 pb-4">
            <div>
              <h3 className="font-mono font-black text-white text-sm uppercase tracking-wider flex items-center gap-1.5">
                <Radio className="w-4 h-4 text-cyan-400 animate-pulse" /> Sirdaryo Region Danger Index Standings
              </h3>
              <p className="text-[10px] text-slate-500 font-mono uppercase mt-1">Severity scores: Critical=10, High=7, Medium=3, Low=1</p>
            </div>
          </div>

          <div className="space-y-4">
            {regionData.map((item, index) => {
              const scorePercentage = (item.threatScore / maxThreatScore) * 100;
              let dangerColor = "bg-emerald-500";
              let badgeColor = "bg-emerald-950/20 text-emerald-400 border-emerald-800/60";
              
              if (item.threatScore >= 20) {
                dangerColor = "bg-rose-600 shadow-[0_0_10px_rgba(244,63,94,0.4)] animate-pulse";
                badgeColor = "bg-rose-950/20 text-rose-400 border-rose-800/60";
              } else if (item.threatScore >= 10) {
                dangerColor = "bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.4)]";
                badgeColor = "bg-amber-950/20 text-amber-400 border-amber-800/60";
              } else if (item.threatScore >= 5) {
                dangerColor = "bg-yellow-500";
                badgeColor = "bg-yellow-950/20 text-yellow-400 border-yellow-850";
              }

              return (
                <div key={item.regionName} className="flex flex-col space-y-1.5 font-mono">
                  <div className="flex justify-between items-center text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-5 text-[10px] text-slate-600 font-bold">#{index + 1}</span>
                      <span className="font-black text-slate-200 uppercase">{item.regionName} SECTOR</span>
                      <span className="text-[10px] text-slate-500">({item.totalReports} records)</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {item.criticalCount > 0 && (
                        <span className="text-[9px] font-bold bg-rose-950/20 text-rose-400 px-1.5 py-0.5 rounded border border-rose-850 uppercase animate-pulse">
                          {item.criticalCount} CRITICAL
                        </span>
                      )}
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${badgeColor}`}>
                        INDEX: {item.threatScore}
                      </span>
                    </div>
                  </div>
                  {/* Progress bar container */}
                  <div className="w-full bg-slate-950 h-2.5 rounded overflow-hidden border border-slate-900">
                    <div
                      className={`h-full rounded-sm transition-all duration-500 ${dangerColor}`}
                      style={{ width: `${Math.max(scorePercentage, 3)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right 1 Col: Donut Simulation of Threat Category distribution */}
        <div className="bg-[#090d16] rounded-xl border border-slate-800 p-6 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="mb-6 border-b border-slate-850 pb-4">
              <h3 className="font-mono font-black text-white text-sm uppercase tracking-wider">SPECTRAL COMPOSITION</h3>
              <p className="text-[10px] text-slate-500 font-mono mt-1">ACTIVE VECTORS IN SAFEUZ AI</p>
            </div>

            {/* Simulated Donut Chart using nested SVGs */}
            <div className="flex justify-center mb-6">
              <svg className="w-40 h-40" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="15.915" fill="none" stroke="#060813" strokeWidth="3" />
                {(() => {
                  let accumulatedPercent = 0;
                  return Object.entries(threatTypes).map(([type, count]) => {
                    const percent = totalReportsCount > 0 ? (count / totalReportsCount) * 100 : 0;
                    if (percent === 0) return null;
                    const strokeDashArray = `${percent} ${100 - percent}`;
                    const strokeDashOffset = 100 - accumulatedPercent + 25; // start from top
                    accumulatedPercent += percent;

                    let strokeColor = "#94a3b8"; // slate
                    if (type === "narcotics") strokeColor = "#f43f5e"; // rose
                    if (type === "phishing") strokeColor = "#f59e0b"; // amber
                    if (type === "malicious_apk") strokeColor = "#06b6d4"; // cyan
                    if (type === "telegram_scam") strokeColor = "#6366f1"; // indigo

                    return (
                      <circle
                        key={type}
                        cx="18"
                        cy="18"
                        r="15.915"
                        fill="none"
                        stroke={strokeColor}
                        strokeWidth="3.2"
                        strokeDasharray={strokeDashArray}
                        strokeDashoffset={strokeDashOffset}
                        className="transition-all duration-500 hover:stroke-[4]"
                      />
                    );
                  });
                })()}
                {/* Center text */}
                <text x="18" y="17.5" textAnchor="middle" className="font-mono font-black text-[6px] fill-white">
                  {totalReportsCount}
                </text>
                <text x="18" y="21.5" textAnchor="middle" className="font-mono font-bold text-[3px] fill-slate-500 uppercase tracking-widest">
                  TOTAL CASES
                </text>
              </svg>
            </div>
          </div>

          <div className="space-y-2.5 font-mono text-[11px]">
            {Object.entries(threatTypes).map(([type, count]) => {
              const percent = totalReportsCount > 0 ? Math.round((count / totalReportsCount) * 100) : 0;
              return (
                <div key={type} className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className={`w-3 h-3 rounded-full ${threatColors[type] || "bg-slate-500"}`} />
                    <span className="text-slate-400 font-bold">{threatLabels[type] || type}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-black text-slate-200">{count}</span>
                    <span className="text-slate-600 text-[9px]">({percent}%)</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Keywords Cloud and Threat Level Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Slang Keywords */}
        <div className="bg-[#090d16] rounded-xl border border-slate-800 p-6 shadow-2xs">
          <div className="mb-4">
            <h3 className="font-mono font-black text-white text-sm uppercase tracking-wider">FLAGGED PAYLOAD KEYWORDS</h3>
            <p className="text-[10px] text-slate-500 font-mono uppercase mt-1">Identified suspicious slangs & phishing baits</p>
          </div>

          {topKeywords.length === 0 ? (
            <div className="text-center py-8 text-slate-600 font-mono text-xs uppercase">
              No active keyword indicators cataloged.
            </div>
          ) : (
            <div className="flex flex-wrap gap-2 pt-2">
              {topKeywords.map((item) => {
                let badgeStyle = "bg-[#060813] text-slate-400 border-slate-800 hover:text-white";
                
                const kw = item.keyword.toLowerCase();
                if (["sol", "mef", "klad", "zakladka", "gash", "lyrika", "skorost"].includes(kw)) {
                  badgeStyle = "bg-rose-950/20 text-rose-400 border-rose-800/40 font-bold";
                } else if (["payme", "click", "yutuq", "bonus"].includes(kw)) {
                  badgeStyle = "bg-amber-950/20 text-amber-400 border-amber-800/40 font-bold";
                }

                return (
                  <span
                    key={item.keyword}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono border transition-all ${badgeStyle}`}
                  >
                    <span>{item.keyword.toUpperCase()}</span>
                    <span className="bg-slate-950 px-1 py-0.2 rounded text-[9px] font-mono font-black shadow-3xs border border-slate-900 text-slate-500">
                      {item.count}
                    </span>
                  </span>
                );
              })}
            </div>
          )}
        </div>

        {/* Danger Severity Information Guide */}
        <div className="bg-slate-950 border border-slate-850 rounded-xl p-6 shadow-2xs flex flex-col justify-between glow-rose">
          <div>
            <h3 className="font-mono font-black text-sm uppercase tracking-wider text-white flex items-center gap-2 mb-4 border-b border-slate-900 pb-3">
              <Terminal className="w-4 h-4 text-rose-500 animate-pulse" /> ENGINE THRESHOLD PROTOCOLS
            </h3>

            <div className="space-y-4 font-mono text-xs">
              <div className="flex items-start gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 mt-1 flex-shrink-0 animate-pulse shadow-[0_0_8px_rgba(244,63,94,0.8)]" />
                <div className="leading-relaxed">
                  <span className="font-black text-rose-400 uppercase block text-[9px] tracking-widest">CRITICAL STATE (&gt;=90)</span> 
                  Urgent threats with active GPS markers, high-loss phishing triggers, or malware APK deployments.
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 mt-1 flex-shrink-0" />
                <div className="leading-relaxed">
                  <span className="font-black text-amber-400 uppercase block text-[9px] tracking-widest">HIGH STATUS (&gt;=75)</span> 
                  Confirmed narcotics slang matches, scam Telegram targets, or verified malicious web URLs.
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-yellow-400 mt-1 flex-shrink-0" />
                <div className="leading-relaxed">
                  <span className="font-black text-yellow-400 uppercase block text-[9px] tracking-widest">MEDIUM STATUS (&gt;=40)</span> 
                  Contains suspicious links or text matching patterns with moderate confidence levels.
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-600 mt-1 flex-shrink-0" />
                <div className="leading-relaxed">
                  <span className="font-black text-slate-500 uppercase block text-[9px] tracking-widest">LOW ARCHIVE (&lt;40)</span> 
                  Negative matching. Logs filed in sector registries for archival queries.
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-900 pt-4 mt-6 text-[9px] font-mono text-slate-600 text-right uppercase tracking-widest">
            Sirdaryo Safety Intel Hub • Real-time Monitoring Active
          </div>
        </div>

      </div>
    </div>
  );
}
