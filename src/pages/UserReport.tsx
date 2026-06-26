import React from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import ReportForm from '../components/ReportForm';
import { auth } from '../firebase';
import { ArrowLeft } from 'lucide-react';

export default function UserReport() {
  const navigate = useNavigate();
  const email = auth.currentUser?.email || "";
  const name = auth.currentUser?.displayName || email.split("@")[0] || "Foydalanuvchi";

  const handleSuccess = () => {
    navigate("/user/history");
  };

  return (
    <div className="min-h-screen bg-[#060813] text-slate-100 flex flex-col relative overflow-hidden" id="user_report_root">
      
      {/* Background grids */}
      <div className="absolute inset-0 cyber-grid pointer-events-none opacity-20"></div>
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-[100px] pointer-events-none"></div>

      <Navbar role="user" fullName={name} />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 flex-grow relative z-10">
        
        {/* Navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate("/user/dashboard")}
            className="inline-flex items-center gap-2 text-slate-400 hover:text-white text-xs font-mono uppercase tracking-widest transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 text-cyan-500 group-hover:-translate-x-0.5 transition-transform" /> 
            ORTGA QAYTISH
          </button>
        </div>

        {/* Report submission panel */}
        <ReportForm onSuccess={handleSuccess} />

      </main>
    </div>
  );
}
