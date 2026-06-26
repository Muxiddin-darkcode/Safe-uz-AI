import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../firebase';
import { AppUser, SIRDARYO_REGIONS } from '../types';
import Navbar from '../components/Navbar';
import axios from 'axios';
import { ArrowLeft, Edit3, Save, Radio } from 'lucide-react';

export default function AdminInspectors() {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [editingUid, setEditingUid] = useState<string | null>(null);
  const [editRole, setEditRole] = useState<AppUser['role']>("user");
  const [editRegion, setEditRegion] = useState("");
  
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const navigate = useNavigate();

  const fetchUsers = async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;
    try {
      const idToken = await currentUser.getIdToken();
      const response = await axios.get("/api/users", {
        headers: { Authorization: `Bearer ${idToken}` }
      });
      setUsers(response.data.users || []);
    } catch (err) {
      console.error("Error fetching users:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [navigate]);

  const handleStartEdit = (user: AppUser) => {
    setEditingUid(user.uid);
    setEditRole(user.role);
    setEditRegion(user.assignedRegion || "Guliston");
  };

  const handleSaveRole = async (user: AppUser) => {
    setSubmitLoading(true);
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) return;
      const idToken = await currentUser.getIdToken();

      const response = await axios.post(`/api/users/${user.uid}/role`, {
        role: editRole,
        fullName: user.fullName,
        email: user.email,
        assignedRegion: editRole === "inspector" ? editRegion : null
      }, {
        headers: { Authorization: `Bearer ${idToken}` }
      });

      if (response.data.success) {
        setEditingUid(null);
        await fetchUsers();
      }
    } catch (err) {
      console.error("Error saving user role:", err);
    } finally {
      setSubmitLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#060813] text-slate-100 flex flex-col relative overflow-hidden" id="admin_inspectors_root">
      
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
            <h1 className="font-sans font-black text-white text-2xl uppercase tracking-tight">XODIMLAR RO'YXATI</h1>
            <p className="font-mono text-[10px] text-slate-500 uppercase tracking-wider">Tizim foydalanuvchilarini boshqarish, hududiy inspektorlarni biriktirish va ularning huquqlarini belgilash</p>
          </div>
        </div>

        {/* User Management table listing */}
        <div className="bg-[#090d16] border border-slate-800 rounded-xl overflow-hidden shadow-2xs">
          
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5 text-cyan-500 animate-pulse" /> Foydalanuvchilar ma'lumotlar bazasi
            </span>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <div className="w-8 h-8 border-3 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-xs font-mono uppercase tracking-widest text-cyan-400">Ma'lumotlar yuklanmoqda...</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-800/80 text-xs text-left">
                <thead className="bg-slate-950 text-slate-400 text-[10px] font-mono uppercase tracking-wider">
                  <tr>
                    <th className="px-5 py-3.5">FOYDALANUVCHİ F.I.O</th>
                    <th className="px-5 py-3.5">EMAIL POCHTA</th>
                    <th className="px-5 py-3.5">TIZIMDAGI HUQUQI</th>
                    <th className="px-5 py-3.5">BIRIKTIRILGAN HUDUD (SEKTOR)</th>
                    <th className="px-5 py-3.5">RO'YXATDAN O'TGAN SANA</th>
                    <th className="px-5 py-3.5 text-right">AMALLAR</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40 text-slate-300 font-mono text-xs">
                  {users.map((usr) => {
                    const isEditing = editingUid === usr.uid;
                    
                    let roleBadge = "bg-slate-900 border-slate-800 text-slate-400";
                    if (usr.role === "admin") roleBadge = "bg-rose-950/20 text-rose-400 border-rose-800/60 font-bold";
                    else if (usr.role === "inspector") roleBadge = "bg-cyan-950/20 text-cyan-400 border-cyan-800/60 font-semibold";

                    let roleLabel = "FUQARO";
                    if (usr.role === "admin") roleLabel = "ADMINISTRATOR";
                    else if (usr.role === "inspector") roleLabel = "INSPEKTOR";

                    return (
                      <tr key={usr.uid} className="hover:bg-slate-950/20 transition-colors">
                        <td className="px-5 py-4 font-sans font-bold text-white text-sm">
                          {usr.fullName || "NOMA'LUM FOYDALANUVCHI"}
                        </td>
                        <td className="px-5 py-4 text-slate-400 font-mono">
                          {usr.email}
                        </td>
                        <td className="px-5 py-4">
                          {isEditing ? (
                            <select
                              value={editRole}
                              onChange={(e) => setEditRole(e.target.value as any)}
                              className="bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 font-mono text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                            >
                              <option value="user">FUQARO</option>
                              <option value="inspector">INSPEKTOR</option>
                              <option value="admin">ADMINISTRATOR</option>
                            </select>
                          ) : (
                            <span className={`text-[9px] font-bold px-2 py-0.5 border rounded tracking-wider uppercase ${roleBadge}`}>
                              {roleLabel}
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-4">
                          {isEditing ? (
                            editRole === "inspector" ? (
                              <select
                                value={editRegion}
                                onChange={(e) => setEditRegion(e.target.value)}
                                className="bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 font-mono text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                              >
                                {SIRDARYO_REGIONS.map(reg => (
                                  <option key={reg} value={reg}>{reg.toUpperCase()}</option>
                                ))}
                              </select>
                            ) : (
                              <span className="text-slate-600 italic">Hudud biriktirilmaydi</span>
                            )
                          ) : (
                            usr.assignedRegion ? (
                              <span className="font-bold text-white uppercase">{usr.assignedRegion} HUDUDI</span>
                            ) : (
                              <span className="text-slate-600 font-mono italic">BIRIKTIRILMAGAN (BARCHA)</span>
                            )
                          )}
                        </td>
                        <td className="px-5 py-4 text-slate-500">
                          {new Date(usr.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-5 py-4 text-right">
                          {isEditing ? (
                            <button
                              onClick={() => handleSaveRole(usr)}
                              disabled={submitLoading}
                              className="bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-mono font-black px-3.5 py-1.5 rounded flex items-center gap-1.5 ml-auto text-[10px] uppercase tracking-wider transition-colors"
                            >
                              <Save className="w-3.5 h-3.5" /> SAQLASH
                            </button>
                          ) : (
                            <button
                              onClick={() => handleStartEdit(usr)}
                              className="text-cyan-400 hover:text-white bg-cyan-950/20 hover:bg-cyan-950/40 border border-cyan-800/40 font-mono font-bold px-3.5 py-1.5 rounded flex items-center gap-1.5 ml-auto text-[10px] uppercase tracking-wider transition-all"
                            >
                              <Edit3 className="w-3.5 h-3.5" /> O'ZGARTIRISH
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
