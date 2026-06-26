import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { auth, signInWithCustomToken } from '../firebase';
import { Shield, AlertTriangle, Key, User, CheckCircle2 } from 'lucide-react';

export default function RegisterPage() {
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (password !== confirmPassword) {
      setError("Parollar mos kelmadi!");
      return;
    }

    if (username.trim().length < 3) {
      setError("Foydalanuvchi nomi kamida 3 ta belgidan iborat bo'lishi kerak!");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          username: username.trim(),
          password,
          fullName: fullName.trim()
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Ro'yxatdan o'tishda xatolik yuz berdi.");
      }

      // Sign in to Firebase Auth using the custom token
      await signInWithCustomToken(auth, data.token);

      // Save credentials in local storage
      localStorage.setItem("safeuz_token", data.token);
      localStorage.setItem("safeuz_user", JSON.stringify(data.user));

      setSuccess(true);
      setTimeout(() => {
        navigate("/user/dashboard");
        window.location.reload();
      }, 1500);
    } catch (err: any) {
      console.error("Registration failed:", err);
      setError(err.message || "Ro'yxatdan o'tishda xatolik yuz berdi. Ma'lumotlarni tekshiring.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#060813] flex items-center justify-center p-4 sm:p-6 lg:p-8 relative selection:bg-cyan-500/30 selection:text-cyan-200 overflow-hidden" id="register_page_root">
      
      {/* Background decoration */}
      <div className="absolute inset-0 cyber-grid pointer-events-none opacity-20"></div>
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="max-w-md w-full space-y-5 bg-[#090d16]/90 p-8 rounded-2xl border border-slate-800 shadow-[0_0_30px_rgba(6,182,212,0.1)] relative z-10 glow-cyan">
        
        {/* Brand / Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-slate-950 border border-cyan-500/40 text-cyan-400 mb-2 shadow-[0_0_15px_rgba(6,182,212,0.2)]">
            <Shield className="w-6 h-6" />
          </div>
          <h2 className="font-mono font-black text-white text-xl uppercase tracking-widest">RO'YXATDAN O'TISH</h2>
          <p className="text-[10px] text-slate-500 uppercase tracking-widest">SafeUZ AI Xavfsizlik Portali</p>
        </div>

        {error && (
          <div className="bg-rose-950/40 border border-rose-800 text-rose-300 p-3.5 rounded-lg text-xs flex gap-2.5 items-center">
            <AlertTriangle className="w-4 h-4 flex-shrink-0 text-rose-500" />
            <span className="font-mono text-[11px]">{error}</span>
          </div>
        )}

        {success && (
          <div className="bg-[#0f231e] border border-emerald-800 text-emerald-300 p-3.5 rounded-lg text-xs flex gap-2.5 items-center animate-pulse">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-500" />
            <span className="font-mono text-[11px]">MUVAFFAQIYATLI RO'YXATDAN O'TDINGIZ! YO'NALTIRILMOQDA...</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-1.5">TO'LIQ ISM-SHARIFINIGIZ (F.I.O)</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                <User className="w-4 h-4" />
              </span>
              <input
                type="text"
                required
                placeholder="Masalan: Sherzod Karimov"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-3 text-sm font-mono text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/20 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-1.5">FOYDALANUVCHİ NOMI (LOGİN)</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                <User className="w-4 h-4" />
              </span>
              <input
                type="text"
                required
                placeholder="Masalan: sherzod42"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-3 text-sm font-mono text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/20 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-1.5">PAROL</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                <Key className="w-4 h-4" />
              </span>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-3 text-sm font-mono text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/20 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-1.5">PAROLNI TASDIQLASH</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                <Key className="w-4 h-4" />
              </span>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-3 text-sm font-mono text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/20 transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-mono font-black uppercase tracking-wider py-3.5 rounded-lg text-xs border border-cyan-400/30 transition-all flex items-center justify-center gap-2 ${
              loading ? "opacity-50 cursor-not-allowed" : "hover:-translate-y-0.5 shadow-[0_0_15px_rgba(6,182,212,0.3)]"
            }`}
          >
            {loading ? "SAQLANMOQDA..." : "RO'YXATDAN O'TISH"}
          </button>
        </form>

        <div className="text-center pt-2 border-t border-slate-800/80">
          <p className="text-[11px] font-mono text-slate-500">
            Tizimda hisobingiz bormi?{" "}
            <Link to="/login" id="link_to_login" className="font-bold text-cyan-400 hover:underline">
              KIRISH
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
