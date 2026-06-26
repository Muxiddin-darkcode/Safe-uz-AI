import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../firebase';
import { AppUser } from '../types';
import Navbar from '../components/Navbar';
import axios from 'axios';
import { ArrowLeft, Mail, Calendar, Radio } from 'lucide-react';

export default function AdminUsers() {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
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

    fetchUsers();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-[#060813] text-slate-100 flex flex-col relative overflow-hidden" id="admin_users_root">
      
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
            <h1 className="font-sans font-black text-white text-2xl uppercase tracking-tight">FOYDALANUVCHILAR RO'YXATI</h1>
            <p className="font-mono text-[10px] text-slate-500 uppercase tracking-wider">Tizimga ro'yxatdan o'tgan barcha fuqarolar va mas'ul xodimlar ma'lumotlar bazasi</p>
          </div>
        </div>

        {/* Users list */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="w-8 h-8 border-3 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-xs font-mono uppercase tracking-widest text-cyan-400">Foydalanuvchilar yuklanmoqda...</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {users.map((usr) => {
              let roleBadge = "bg-slate-900 border-slate-800 text-slate-400";
              let roleStr = "FUQARO";
              if (usr.role === "admin") {
                roleBadge = "bg-rose-950/20 text-rose-400 border-rose-800/60 font-bold";
                roleStr = "ADMINISTRATOR";
              } else if (usr.role === "inspector") {
                roleBadge = "bg-cyan-950/20 text-cyan-400 border-cyan-800/60 font-semibold";
                roleStr = "INSPEKTOR";
              }

              return (
                <div key={usr.uid} className="bg-[#090d16] border border-slate-800 rounded-xl p-6 shadow-2xs space-y-4 flex flex-col justify-between hover:border-slate-700 transition-all glow-cyan">
                  <div className="space-y-3 font-mono">
                    <div className="flex justify-between items-start">
                      <div className="w-10 h-10 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-center font-bold text-cyan-400 text-sm">
                        {usr.fullName ? usr.fullName[0].toUpperCase() : "U"}
                      </div>
                      <span className={`text-[10px] font-bold border px-2 py-0.5 rounded uppercase tracking-wider ${roleBadge}`}>
                        {roleStr}
                      </span>
                    </div>

                    <div>
                      <h4 className="font-sans font-bold text-white text-base">{usr.fullName || "Tizim Foydalanuvchisi"}</h4>
                      <p className="text-xs text-slate-400 font-mono flex items-center gap-1.5 mt-1">
                        <Mail className="w-3.5 h-3.5 text-cyan-500" /> {usr.email}
                      </p>
                    </div>
                  </div>

                  <div className="border-t border-slate-800/60 pt-3 flex justify-between items-center text-[10px] text-slate-500 font-mono">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-cyan-500" /> Ro'yxatdan o'tdi: {new Date(usr.createdAt).toLocaleDateString()}
                    </span>
                    {usr.assignedRegion && (
                      <span className="font-semibold text-cyan-400 bg-cyan-950/20 px-2 py-0.5 border border-cyan-850 rounded uppercase text-[9px]">
                        HUDUD: {usr.assignedRegion}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
