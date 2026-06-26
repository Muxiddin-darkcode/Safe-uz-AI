import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { auth, signInWithCustomToken } from '../firebase';
import { Shield, Eye, EyeOff, AlertTriangle, Key, User, Terminal } from 'lucide-react';

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [seedStatus, setSeedStatus] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          username: username.trim(),
          password
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Tizimga kirishda xatolik yuz berdi.");
      }

      // Sign in to Firebase Auth using the custom token
      await signInWithCustomToken(auth, data.token);

      // Store in local storage
      localStorage.setItem("safeuz_token", data.token);
      localStorage.setItem("safeuz_user", JSON.stringify(data.user));

      const role = data.user.role;
      if (role === "admin") {
        navigate("/admin/dashboard");
      } else if (role === "inspector") {
        navigate("/inspector/dashboard");
      } else {
        navigate("/user/dashboard");
      }
      window.location.reload();
    } catch (err: any) {
      console.error("Login failed:", err);
      setError(err.message || "Tizimga kirishda xatolik yuz berdi. Ma'lumotlaringizni tekshiring.");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemoLogin = async (role: "user" | "inspector" | "admin") => {
    setError(null);
    setLoading(true);
    setSeedStatus(`Namuna profili faollashtirilmoqda: ${role}...`);

    const demoUsername = role;
    const demoPassword = `${role}123`;

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          username: demoUsername,
          password: demoPassword
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Namuna hisobiga kirishda xatolik.");
      }

      await signInWithCustomToken(auth, data.token);

      localStorage.setItem("safeuz_token", data.token);
      localStorage.setItem("safeuz_user", JSON.stringify(data.user));

      setSeedStatus(`Muvaffaqiyatli! Yo'naltirilmoqda...`);
      setTimeout(() => {
        if (role === "admin") navigate("/admin/dashboard");
        else if (role === "inspector") navigate("/inspector/dashboard");
        else navigate("/user/dashboard");
        window.location.reload();
      }, 800);

    } catch (err: any) {
      console.error(`Quick Login for ${role} failed:`, err);
      setError(`Kirish xatosi: ${err.message}`);
    } finally {
      setLoading(false);
      setSeedStatus(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#060813] flex items-center justify-center p-4 sm:p-6 lg:p-8 relative selection:bg-cyan-500/30 selection:text-cyan-200 overflow-hidden" id="login_page_root">
      
      {/* Background decoration */}
      <div className="absolute inset-0 cyber-grid pointer-events-none opacity-20"></div>
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="max-w-md w-full space-y-6 bg-[#090d16]/90 p-8 rounded-2xl border border-slate-800 shadow-[0_0_30px_rgba(6,182,212,0.1)] relative z-10 glow-cyan">
        
        {/* Brand / Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-slate-950 border border-cyan-500/40 text-cyan-400 mb-2 shadow-[0_0_15px_rgba(6,182,212,0.2)]">
            <Shield className="w-6 h-6" />
          </div>
          <h2 className="font-mono font-black text-white text-xl uppercase tracking-widest">TIZIMGA KIRISH</h2>
          <p className="text-[10px] text-slate-500 uppercase tracking-widest">SafeUZ AI Xavfsizlik Portali</p>
        </div>

        {error && (
          <div className="bg-rose-950/40 border border-rose-800 text-rose-300 p-3.5 rounded-lg text-xs flex gap-2.5 items-center">
            <AlertTriangle className="w-4 h-4 flex-shrink-0 text-rose-500" />
            <span className="font-mono text-[11px]">{error}</span>
          </div>
        )}

        {seedStatus && (
          <div className="bg-cyan-950/40 border border-cyan-800 text-cyan-300 p-3.5 rounded-lg text-xs flex gap-2.5 items-center animate-pulse">
            <Terminal className="w-4 h-4 flex-shrink-0 text-cyan-400" />
            <span className="font-mono text-[11px]">{seedStatus}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-1.5">FOYDALANUVCHI NOMI (LOGİN)</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                <User className="w-4 h-4" />
              </span>
              <input
                type="text"
                required
                placeholder="Foydalanuvchi nomini kiriting"
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
                type={showPassword ? "text" : "password"}
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-10 py-3 text-sm font-mono text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/20 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300 transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-mono font-black uppercase tracking-wider py-3.5 rounded-lg text-xs border border-cyan-400/30 transition-all flex items-center justify-center gap-2 ${
              loading ? "opacity-50 cursor-not-allowed" : "hover:-translate-y-0.5 shadow-[0_0_15px_rgba(6,182,212,0.3)]"
            }`}
          >
            {loading ? "RUXSAT TEKSHIRILMOQDA..." : "TIZIMGA KIRISH"}
          </button>
        </form>

        <div className="relative flex py-2 items-center">
          <div className="flex-grow border-t border-slate-800/80"></div>
          <span className="flex-shrink mx-3 text-slate-500 text-[9px] uppercase font-mono tracking-widest">SINOV REJIMIDA KIRISH</span>
          <div className="flex-grow border-t border-slate-800/80"></div>
        </div>

        {/* Demo profiles */}
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => handleQuickDemoLogin("admin")}
            id="btn_quick_admin"
            className="flex flex-col items-center p-3.5 rounded-lg bg-slate-950 border border-slate-800 hover:border-cyan-500/60 hover:bg-slate-900/60 transition-all text-center group"
          >
            <span className="text-sm">👑</span>
            <span className="font-mono font-bold text-white text-[11px] mt-1.5 uppercase tracking-wide group-hover:text-cyan-400">Admin</span>
            <span className="text-[8px] font-mono text-slate-500 mt-0.5 uppercase tracking-wider">Boshqaruvchi</span>
          </button>

          <button
            type="button"
            onClick={() => handleQuickDemoLogin("inspector")}
            id="btn_quick_inspector"
            className="flex flex-col items-center p-3.5 rounded-lg bg-slate-950 border border-slate-800 hover:border-rose-500/60 hover:bg-slate-900/60 transition-all text-center group"
          >
            <span className="text-sm">👮</span>
            <span className="font-mono font-bold text-white text-[11px] mt-1.5 uppercase tracking-wide group-hover:text-rose-400">Inspektor</span>
            <span className="text-[8px] font-mono text-slate-500 mt-0.5 uppercase tracking-wider">Mas'ul xodim</span>
          </button>

          <button
            type="button"
            onClick={() => handleQuickDemoLogin("user")}
            id="btn_quick_user"
            className="flex flex-col items-center p-3.5 rounded-lg bg-slate-950 border border-slate-800 hover:border-emerald-500/60 hover:bg-slate-900/60 transition-all text-center group"
          >
            <span className="text-sm">👤</span>
            <span className="font-mono font-bold text-white text-[11px] mt-1.5 uppercase tracking-wide group-hover:text-emerald-400">Fuqaro</span>
            <span className="text-[8px] font-mono text-slate-500 mt-0.5 uppercase tracking-wider">Xabar beruvchi</span>
          </button>
        </div>

        <div className="text-center pt-2">
          <p className="text-[11px] font-mono text-slate-500">
            Tizimda hisobingiz yo'qmi?{" "}
            <Link to="/register" id="link_to_register" className="font-bold text-cyan-400 hover:underline">
              RO'YXATDAN O'TISH
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
