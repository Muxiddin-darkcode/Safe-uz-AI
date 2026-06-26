import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../firebase';
import { MonitoringSource } from '../types';
import Navbar from '../components/Navbar';
import axios from 'axios';
import { ArrowLeft, Shield, Plus, Trash2, Radio } from 'lucide-react';

export default function AdminSources() {
  const [sources, setSources] = useState<MonitoringSource[]>([]);
  const [sourceType, setSourceType] = useState<MonitoringSource['sourceType']>("telegram_channel");
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [username, setUsername] = useState("");
  const [notes, setNotes] = useState("");
  
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const fetchSources = async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;
    try {
      const idToken = await currentUser.getIdToken();
      const response = await axios.get("/api/sources", {
        headers: { Authorization: `Bearer ${idToken}` }
      });
      setSources(response.data.sources || []);
    } catch (err) {
      console.error("Error loading sources:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSources();
  }, [navigate]);

  const handleAddSource = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitLoading(true);

    try {
      const currentUser = auth.currentUser;
      if (!currentUser) return;
      const idToken = await currentUser.getIdToken();

      const response = await axios.post("/api/sources", {
        sourceType,
        title,
        url: url || null,
        username: username || null,
        notes: notes || null
      }, {
        headers: { Authorization: `Bearer ${idToken}` }
      });

      if (response.data.success) {
        setTitle("");
        setUrl("");
        setUsername("");
        setNotes("");
        await fetchSources();
      }
    } catch (err: any) {
      console.error("Error adding source:", err);
      setError(err.response?.data?.error || "Manba qo'shishda xatolik yuz berdi.");
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDeleteSource = async (id: string) => {
    if (!window.confirm("Ushbu manbani monitoring tizimidan o'chirmoqchimisiz?")) return;
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) return;
      const idToken = await currentUser.getIdToken();

      await axios.delete(`/api/sources/${id}`, {
        headers: { Authorization: `Bearer ${idToken}` }
      });
      await fetchSources();
    } catch (err) {
      console.error("Error deleting source:", err);
    }
  };

  return (
    <div className="min-h-screen bg-[#060813] text-slate-100 flex flex-col relative overflow-hidden" id="admin_sources_root">
      
      {/* Background aesthetics */}
      <div className="absolute inset-0 cyber-grid pointer-events-none opacity-20"></div>
      <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-[100px] pointer-events-none"></div>

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
            <h1 className="font-sans font-black text-white text-2xl uppercase tracking-tight">MONITORING KANALLARI & MANBALARI</h1>
            <p className="font-mono text-[10px] text-slate-500 uppercase tracking-wider">Xavfsizlik tizimi tomonidan tahlil qilinadigan Telegram kanallari, guruhlar va veb-saytlar ro'yxati</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left: Add Source Form (1 col) */}
          <div className="bg-[#090d16] border border-slate-800 p-6 rounded-xl space-y-4 h-fit glow-cyan">
            <h3 className="font-mono font-black text-white text-xs uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-800 pb-3">
              <Plus className="w-4 h-4 text-cyan-400" /> YANGI MANBA BIRIKTIRISH
            </h3>

            {error && (
              <div className="bg-rose-950/40 border border-rose-800 text-rose-300 p-3 rounded text-xs font-mono">
                {error}
              </div>
            )}

            <form onSubmit={handleAddSource} className="space-y-4 font-mono text-xs">
              <div>
                <label className="block text-[9px] uppercase tracking-wider text-slate-400 mb-1.5">MANBA TOIFASI</label>
                <select
                  value={sourceType}
                  onChange={(e) => setSourceType(e.target.value as any)}
                  className="w-full bg-[#060813] border border-slate-800 rounded px-3 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                >
                  <option value="telegram_channel">📢 TELEGRAM KANAL (MONITORING)</option>
                  <option value="telegram_post">💬 TELEGRAM GURUH / POST</option>
                  <option value="website">🌐 FISHING VEB-SAYT DOMENI</option>
                  <option value="manual_tip">👤 FUQAROLARNING TO'G'RIDAN TO'G'RI XABARLARI</option>
                </select>
              </div>

              <div>
                <label className="block text-[9px] uppercase tracking-wider text-slate-400 mb-1.5">MANBA NOMI <span className="text-rose-500 font-bold">*</span></label>
                <input
                  type="text"
                  required
                  placeholder="Masalan: SIRDARYO_GURUH_MONITOR"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-[#060813] border border-slate-800 rounded px-3 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-[9px] uppercase tracking-wider text-slate-400 mb-1.5">TELEGRAM MANZILI (ixtiyoriy)</label>
                <input
                  type="text"
                  placeholder="Masalan: @shubhaliguruh"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-[#060813] border border-slate-800 rounded px-3 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-[9px] uppercase tracking-wider text-slate-400 mb-1.5">VEB-SAYT HAVOLASI (ixtiyoriy)</label>
                <input
                  type="text"
                  placeholder="https://shubhali-vebsayt.uz"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="w-full bg-[#060813] border border-slate-800 rounded px-3 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-[9px] uppercase tracking-wider text-slate-400 mb-1.5">QO'SHIMCHA IZOH VA QAYDLAR</label>
                <textarea
                  rows={3}
                  placeholder="Ushbu manba haqida qo'shimcha tezkor eslatmalarni yozing..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-[#060813] border border-slate-800 rounded p-3 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <button
                type="submit"
                disabled={submitLoading}
                className="w-full bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-black uppercase tracking-wider py-2.5 rounded text-xs transition-all duration-300"
              >
                {submitLoading ? "ULANMOQDA..." : "MANBANI FAOLLASHTIRISH"}
              </button>
            </form>
          </div>

          {/* Right: Sources Table listing (2 cols) */}
          <div className="lg:col-span-2 bg-[#090d16] border border-slate-800 rounded-xl overflow-hidden shadow-2xs">
            
            <div className="p-4 border-b border-slate-800">
              <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5 text-rose-500 animate-pulse" /> Faol monitoring manbalari
              </span>
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <div className="w-8 h-8 border-3 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-xs font-mono uppercase tracking-widest text-cyan-400">Manbalar saralanmoqda...</span>
              </div>
            ) : sources.length === 0 ? (
              <div className="text-center py-24 text-slate-500 font-mono text-xs uppercase space-y-2">
                <Shield className="w-10 h-10 text-slate-700 mx-auto animate-pulse" />
                <p>Faol monitoring manbalari topilmadi.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-800/80 text-xs text-left">
                  <thead className="bg-slate-950 text-slate-400 text-[10px] font-mono uppercase tracking-wider">
                    <tr>
                      <th className="px-5 py-3.5">MANBA NOMI VA IZOHI</th>
                      <th className="px-5 py-3.5">TUR</th>
                      <th className="px-5 py-3.5">HAVOLA / POCHTA</th>
                      <th className="px-5 py-3.5">QO'SHILGAN SANA</th>
                      <th className="px-5 py-3.5 text-right">O'CHIRISH</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/40 text-slate-300 font-mono text-xs">
                    {sources.map((src) => (
                      <tr key={src.id} className="hover:bg-slate-950/20 transition-colors">
                        <td className="px-5 py-4">
                          <span className="font-bold text-white block uppercase">{src.title}</span>
                          {src.notes && <span className="text-[10px] text-slate-500 block truncate max-w-xs mt-0.5">{src.notes}</span>}
                        </td>
                        <td className="px-5 py-4 font-bold tracking-wider text-cyan-400 uppercase text-[10px]">
                          {src.sourceType === "telegram_channel" && "📢 TG KANAL"}
                          {src.sourceType === "telegram_post" && "💬 TG GURUH"}
                          {src.sourceType === "website" && "🌐 FISHING DOMEN"}
                          {src.sourceType === "manual_tip" && "👤 FOYDALANUVCHI"}
                        </td>
                        <td className="px-5 py-4">
                          {src.username && <span className="text-rose-400 font-semibold">{src.username}</span>}
                          {src.url && <a href={src.url} target="_blank" rel="noopener noreferrer" className="text-cyan-500 hover:underline block truncate max-w-[160px]">{src.url}</a>}
                          {!src.username && !src.url && <span className="text-slate-600 italic">Static marshrut yo'q</span>}
                        </td>
                        <td className="px-5 py-4 text-slate-500">
                          {new Date(src.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-5 py-4 text-right">
                          <button
                            onClick={() => handleDeleteSource(src.id)}
                            className="text-rose-500 hover:text-white p-1 bg-rose-950/10 hover:bg-rose-950/40 border border-rose-800/20 rounded transition-colors"
                          >
                            <Trash2 className="w-4 h-4 inline-block" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
