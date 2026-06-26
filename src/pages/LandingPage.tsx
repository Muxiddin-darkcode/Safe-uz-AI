import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Shield, Eye, AlertTriangle, Cpu, Terminal, ArrowRight, Radio, Key, MapPin, Activity, CheckCircle, Target, Database, BarChart3, Fingerprint, Network, User } from 'lucide-react';
import SirdaryoThreatHero from '../components/SirdaryoThreatHero';

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-[#060813] text-slate-100 flex flex-col justify-between selection:bg-cyan-500/30 selection:text-cyan-200 relative overflow-hidden" id="landing_page_root">
      
      {/* Background Aesthetics */}
      <div className="absolute inset-0 cyber-grid pointer-events-none opacity-20"></div>
      
      {/* Ambient Radial Lights */}
      <div className="absolute -top-[20%] -left-[10%] w-[600px] h-[600px] bg-cyan-600/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute top-[30%] -right-[10%] w-[500px] h-[500px] bg-rose-600/10 rounded-full blur-[150px] pointer-events-none"></div>
      <div className="absolute bottom-[10%] left-[20%] w-[400px] h-[400px] bg-cyan-500/5 rounded-full blur-[120px] pointer-events-none"></div>

      {/* 1. NAVBAR */}
      <header className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 border-b ${
        scrolled ? "bg-[#060813]/90 backdrop-blur-md border-slate-800/80 shadow-2xl" : "bg-transparent border-transparent"
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3 group cursor-pointer">
            <div className="relative flex items-center justify-center">
              <div className="absolute inset-0 bg-cyan-500/20 rounded-lg blur-md group-hover:bg-cyan-400/40 transition-all duration-500"></div>
              <div className="bg-slate-950 border border-cyan-500/40 p-2.5 rounded-lg relative">
                <Shield className="w-6 h-6 text-cyan-400 group-hover:scale-110 transition-transform duration-500" />
              </div>
            </div>
            <div className="flex flex-col">
              <span className="font-sans font-black tracking-widest text-xl text-white">
                SAFEUZ <span className="text-cyan-400">AI</span>
              </span>
              <span className="text-[10px] font-mono tracking-widest text-slate-400 uppercase">AI Threat Intelligence Platform</span>
            </div>
          </div>
          
          <nav className="hidden lg:flex items-center gap-8">
            <a href="#about" className="text-xs font-mono uppercase tracking-wider text-slate-400 hover:text-cyan-400 transition-colors">Platforma haqida</a>
            <a href="#features" className="text-xs font-mono uppercase tracking-wider text-slate-400 hover:text-cyan-400 transition-colors">Imkoniyatlar</a>
            <a href="#dashboard" className="text-xs font-mono uppercase tracking-wider text-slate-400 hover:text-cyan-400 transition-colors">Dashboard Preview</a>
          </nav>

          <div className="flex items-center gap-4">
            <Link 
              to="/login" 
              className="hidden sm:block text-xs font-mono uppercase tracking-wider text-slate-300 hover:text-white transition-all px-4 py-2"
            >
              Kirish
            </Link>
            <Link 
              to="/register" 
              className="bg-cyan-600/10 hover:bg-cyan-500/20 text-cyan-400 text-xs font-mono font-bold uppercase tracking-wider px-5 py-2.5 rounded border border-cyan-500/30 transition-all duration-300 backdrop-blur-sm"
            >
              Ro'yxatdan o'tish
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-grow pt-20">
        
        {/* 2. HERO SECTION + 3D MODEL */}
        <SirdaryoThreatHero />

        {/* 3. PLATFORMA HAQIDA (SafeUZ AI nima?) */}
        <section id="about" className="py-24 bg-[#090d16] border-t border-slate-800/50 relative">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-16">
              <h2 className="font-sans font-black text-white text-3xl sm:text-4xl uppercase tracking-tight">SafeUZ AI nima?</h2>
              <div className="w-20 h-1 bg-cyan-500 mt-4 rounded-full"></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-slate-950 border border-slate-800/80 p-8 rounded-xl relative overflow-hidden group hover:border-cyan-500/50 transition-colors">
                <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 rounded-full blur-[40px] group-hover:bg-cyan-500/10 transition-colors"></div>
                <Network className="w-8 h-8 text-cyan-400 mb-6" />
                <h3 className="font-sans font-bold text-white text-xl mb-3">1. Threat Reporting</h3>
                <p className="text-sm text-slate-400 leading-relaxed font-sans">
                  Foydalanuvchilar shubhali matn, screenshot, telegram post link, fishing link, APK fayl yoki real vaqtdagi lokatsiyani yubora oladi. Barcha xabarlar maxfiy tutiladi.
                </p>
              </div>

              <div className="bg-slate-950 border border-slate-800/80 p-8 rounded-xl relative overflow-hidden group hover:border-rose-500/50 transition-colors">
                <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/5 rounded-full blur-[40px] group-hover:bg-rose-500/10 transition-colors"></div>
                <Cpu className="w-8 h-8 text-rose-400 mb-6" />
                <h3 className="font-sans font-bold text-white text-xl mb-3">2. AI Threat Analysis</h3>
                <p className="text-sm text-slate-400 leading-relaxed font-sans">
                  Tizim AI yordamida giyohvandlik slenglari, fishing va scam belgilarini, telegram firibgarligini va shubhali APK fayllarni chuqur tahlil qiladi.
                </p>
              </div>

              <div className="bg-slate-950 border border-slate-800/80 p-8 rounded-xl relative overflow-hidden group hover:border-amber-500/50 transition-colors">
                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-[40px] group-hover:bg-amber-500/10 transition-colors"></div>
                <Shield className="w-8 h-8 text-amber-400 mb-6" />
                <h3 className="font-sans font-bold text-white text-xl mb-3">3. Role-based Monitoring</h3>
                <p className="text-sm text-slate-400 leading-relaxed font-sans">
                  Yuqori xavfli narkotik reportlar zudlik bilan Inspector paneliga, boshqa xavflar Admin paneliga, oddiy ma'lumotlar esa User portaliga yo'naltiriladi.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 4. TAHDID YO'NALISHLARI (Qaysi tahdidlarni aniqlaydi?) */}
        <section id="features" className="py-24 border-t border-slate-800/50 relative">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-16">
              <h2 className="font-sans font-black text-white text-3xl sm:text-4xl uppercase tracking-tight">Qaysi tahdidlarni aniqlaydi?</h2>
              <div className="w-20 h-1 bg-rose-500 mt-4 rounded-full"></div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-lg hover:bg-slate-800/50 transition-colors">
                <AlertTriangle className="w-6 h-6 text-rose-500 mb-4" />
                <h4 className="font-bold text-white mb-2">Narcotics Monitoring</h4>
                <ul className="text-xs text-slate-400 space-y-1.5 font-mono">
                  <li>• Slang detection</li>
                  <li>• Hidden sale patterns</li>
                  <li>• Telegram savdo postlari</li>
                </ul>
              </div>

              <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-lg hover:bg-slate-800/50 transition-colors">
                <Eye className="w-6 h-6 text-amber-500 mb-4" />
                <h4 className="font-bold text-white mb-2">Phishing Detection</h4>
                <ul className="text-xs text-slate-400 space-y-1.5 font-mono">
                  <li>• Shubhali URL tahlili</li>
                  <li>• Fake login sahifalar</li>
                  <li>• Scam domenlar</li>
                </ul>
              </div>

              <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-lg hover:bg-slate-800/50 transition-colors">
                <Terminal className="w-6 h-6 text-cyan-500 mb-4" />
                <h4 className="font-bold text-white mb-2">APK Screening</h4>
                <ul className="text-xs text-slate-400 space-y-1.5 font-mono">
                  <li>• Noma'lum APK</li>
                  <li>• Fake update/virus</li>
                  <li>• Credential theft risk</li>
                </ul>
              </div>

              <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-lg hover:bg-slate-800/50 transition-colors">
                <Radio className="w-6 h-6 text-emerald-500 mb-4" />
                <h4 className="font-bold text-white mb-2">Telegram Scam</h4>
                <ul className="text-xs text-slate-400 space-y-1.5 font-mono">
                  <li>• Fake bot support</li>
                  <li>• Payment bait</li>
                  <li>• Scam e'lonlar</li>
                </ul>
              </div>

              <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-lg hover:bg-slate-800/50 transition-colors">
                <MapPin className="w-6 h-6 text-purple-500 mb-4" />
                <h4 className="font-bold text-white mb-2">Regional Analytics</h4>
                <ul className="text-xs text-slate-400 space-y-1.5 font-mono">
                  <li>• Hududiy xavf tahlili</li>
                  <li>• Xavfli hududlar xaritasi</li>
                  <li>• Kriminal trendlar</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* 5. QANDAY ISHLAYDI (Timeline) */}
        <section className="py-24 bg-[#090d16] border-y border-slate-800/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-20 text-center">
              <h2 className="font-sans font-black text-white text-3xl sm:text-4xl uppercase tracking-tight">Qanday ishlaydi?</h2>
              <p className="text-slate-400 font-mono text-xs mt-3 uppercase tracking-widest">Avtomatlashtirilgan AI Pipeline</p>
            </div>

            <div className="relative">
              {/* Connecting line */}
              <div className="hidden md:block absolute top-1/2 left-0 w-full h-0.5 bg-slate-800 -translate-y-1/2 z-0"></div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative z-10">
                {/* Step 1 */}
                <div className="bg-slate-950 border border-slate-800 p-8 rounded-xl text-center relative group">
                  <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-12 h-12 bg-slate-900 border-2 border-cyan-500 rounded-full flex items-center justify-center font-mono font-bold text-cyan-400 z-10 group-hover:scale-110 transition-transform">1</div>
                  <h4 className="font-sans font-bold text-white text-lg mt-4 mb-3">Report yuboriladi</h4>
                  <p className="text-sm text-slate-400 leading-relaxed font-sans">
                    Foydalanuvchi anonim tarzda matn, link, screenshot, shubhali APK fayl yoki aniq GPS lokatsiya yuboradi.
                  </p>
                </div>

                {/* Step 2 */}
                <div className="bg-slate-950 border border-slate-800 p-8 rounded-xl text-center relative group">
                  <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-12 h-12 bg-slate-900 border-2 border-rose-500 rounded-full flex items-center justify-center font-mono font-bold text-rose-400 z-10 group-hover:scale-110 transition-transform">2</div>
                  <h4 className="font-sans font-bold text-white text-lg mt-4 mb-3">AI tahlil qiladi</h4>
                  <p className="text-sm text-slate-400 leading-relaxed font-sans">
                    Gemini LLM tahdid turiga qarab xavf darajasi (Low/Medium/High/Critical), xavf balli (0-100) va qisqacha xulosani generatsiya qiladi.
                  </p>
                </div>

                {/* Step 3 */}
                <div className="bg-slate-950 border border-slate-800 p-8 rounded-xl text-center relative group">
                  <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-12 h-12 bg-slate-900 border-2 border-emerald-500 rounded-full flex items-center justify-center font-mono font-bold text-emerald-400 z-10 group-hover:scale-110 transition-transform">3</div>
                  <h4 className="font-sans font-bold text-white text-lg mt-4 mb-3">Tizim yo'naltiradi</h4>
                  <p className="text-sm text-slate-400 leading-relaxed font-sans">
                    High-risk narkotik xabarlar Inspector Console'ga, qolgan barcha reportlar Admin Panelga yo'naltiriladi. Analytics dashboardga statistikalar yoziladi.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 6. DASHBOARD PREVIEW */}
        <section id="dashboard" className="py-24 border-b border-slate-800/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-16">
              <h2 className="font-sans font-black text-white text-3xl sm:text-4xl uppercase tracking-tight">Tizim Interfeysi</h2>
              <div className="w-20 h-1 bg-cyan-500 mt-4 rounded-full"></div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              {/* Left - Mockup */}
              <div className="lg:col-span-8">
                <div className="bg-[#090d16] border border-slate-800 rounded-xl p-2 shadow-2xl relative overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"></div>
                  {/* Mockup Header */}
                  <div className="bg-slate-950 border-b border-slate-800 p-3 rounded-t-lg flex items-center gap-2">
                    <div className="flex gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-slate-700"></div>
                      <div className="w-2.5 h-2.5 rounded-full bg-slate-700"></div>
                      <div className="w-2.5 h-2.5 rounded-full bg-slate-700"></div>
                    </div>
                    <div className="ml-4 bg-slate-900 border border-slate-800 rounded px-24 py-1 text-[10px] font-mono text-slate-500">safeuz.ai/admin/dashboard</div>
                  </div>
                  {/* Mockup Body */}
                  <div className="bg-slate-900 p-6 min-h-[300px] flex flex-col gap-4">
                    <div className="flex justify-between items-center border-b border-slate-800 pb-4">
                      <div className="font-sans font-bold text-white">XAVFLAR MONITORINGI</div>
                      <div className="flex gap-2">
                        <div className="bg-rose-500/20 text-rose-400 border border-rose-500/30 px-3 py-1 rounded text-[10px] font-mono">12 URGENT</div>
                        <div className="bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 px-3 py-1 rounded text-[10px] font-mono">45 ACTIVE</div>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="bg-slate-950 border border-slate-800 rounded p-4 h-24"></div>
                      <div className="bg-slate-950 border border-slate-800 rounded p-4 h-24"></div>
                      <div className="bg-slate-950 border border-slate-800 rounded p-4 h-24"></div>
                    </div>
                    <div className="bg-slate-950 border border-slate-800 rounded p-4 h-48 mt-2 flex flex-col gap-2">
                      <div className="h-6 bg-slate-900 rounded w-full"></div>
                      <div className="h-6 bg-slate-900 rounded w-full"></div>
                      <div className="h-6 bg-slate-900 rounded w-full"></div>
                      <div className="h-6 bg-slate-900 rounded w-full"></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right - Cards */}
              <div className="lg:col-span-4 space-y-4">
                <div className="bg-slate-900/50 border border-slate-800 p-5 rounded-lg">
                  <h4 className="font-sans font-bold text-white flex items-center gap-2 mb-2"><Database className="w-4 h-4 text-cyan-500" /> Admin Dashboard</h4>
                  <p className="text-[11px] text-slate-400 font-mono">Barcha reportlar ro'yxati, umumiy analitika, tizim sozlamalari va AI konfiguratsiyalari yagona joyda.</p>
                </div>
                <div className="bg-slate-900/50 border border-slate-800 p-5 rounded-lg">
                  <h4 className="font-sans font-bold text-white flex items-center gap-2 mb-2"><Target className="w-4 h-4 text-rose-500" /> Inspector Console</h4>
                  <p className="text-[11px] text-slate-400 font-mono">Yuqori xavfli (High/Critical) reportlarni tezkor ko'rib chiqish va hudud bo'yicha chora ko'rish moduli.</p>
                </div>
                <div className="bg-slate-900/50 border border-slate-800 p-5 rounded-lg">
                  <h4 className="font-sans font-bold text-white flex items-center gap-2 mb-2"><User className="w-4 h-4 text-emerald-500" /> User Portal</h4>
                  <p className="text-[11px] text-slate-400 font-mono">Oddiy fuqarolar uchun isbotlarni (lokatsiya, rasm, link) xavfsiz va anonim yuborish maydonchasi.</p>
                </div>
                <div className="bg-slate-900/50 border border-slate-800 p-5 rounded-lg">
                  <h4 className="font-sans font-bold text-white flex items-center gap-2 mb-2"><Cpu className="w-4 h-4 text-amber-500" /> AI Monitoring Engine</h4>
                  <p className="text-[11px] text-slate-400 font-mono">Gemini API orqali barcha kelib tushgan matn, slang va tahdidlarni real vaqtda baholash markazi.</p>
                </div>
              </div>
            </div>
          </div>
        </section>



        {/* 8. NIMA UCHUN SAFEUZ AI? */}
        <section className="py-24 border-b border-slate-800/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-16 text-center">
              <h2 className="font-sans font-black text-white text-3xl sm:text-4xl uppercase tracking-tight">Nima uchun SafeUZ AI?</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-slate-900/40 border border-slate-800 p-8 rounded-xl flex items-start gap-4">
                <div className="mt-1"><Shield className="w-6 h-6 text-cyan-500" /></div>
                <div>
                  <h4 className="font-bold text-white text-lg mb-2 font-sans">1. Multi-threat monitoring</h4>
                  <p className="text-sm text-slate-400 font-sans leading-relaxed">Faqatgina bitta tahdid emas, balki narkotik, fishing, zararli APK va telegram scam holatlarini bir vaqtning o'zida markazlashgan holda kuzatadi.</p>
                </div>
              </div>

              <div className="bg-slate-900/40 border border-slate-800 p-8 rounded-xl flex items-start gap-4">
                <div className="mt-1"><Cpu className="w-6 h-6 text-rose-500" /></div>
                <div>
                  <h4 className="font-bold text-white text-lg mb-2 font-sans">2. AI-based triage</h4>
                  <p className="text-sm text-slate-400 font-sans leading-relaxed">Inspektorlar har bir xabarni o'qib vaqt yo'qotmaydi. AI reportlarni tez saralaydi, xavf darajasini avtomatik hisoblaydi va faqat muhimlarini ajratib beradi.</p>
                </div>
              </div>

              <div className="bg-slate-900/40 border border-slate-800 p-8 rounded-xl flex items-start gap-4">
                <div className="mt-1"><CheckCircle className="w-6 h-6 text-emerald-500" /></div>
                <div>
                  <h4 className="font-bold text-white text-lg mb-2 font-sans">3. Inspector/Admin workflow</h4>
                  <p className="text-sm text-slate-400 font-sans leading-relaxed">Vazifalar to'g'ri taqsimlanadi. Yuqori xavfli kriminal holatlar alohida panelga chiqadi va huquqni muhofaza qiluvchi organ xodimlari tezkor chora ko'radi.</p>
                </div>
              </div>

              <div className="bg-slate-900/40 border border-slate-800 p-8 rounded-xl flex items-start gap-4">
                <div className="mt-1"><MapPin className="w-6 h-6 text-amber-500" /></div>
                <div>
                  <h4 className="font-bold text-white text-lg mb-2 font-sans">4. Regional intelligence</h4>
                  <p className="text-sm text-slate-400 font-sans leading-relaxed">Barcha ma'lumotlar tumanlar va hududlar kesimida tahlil qilinib, qaysi hududda qanday profilaktik ishlar olib borish kerakligi haqida aniq strategiya beradi.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 9. CTA SECTION */}
        <section className="py-32 relative overflow-hidden bg-slate-950">
          <div className="absolute inset-0 cyber-grid opacity-30"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl h-[400px] bg-cyan-600/10 rounded-full blur-[100px] pointer-events-none"></div>
          
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10 space-y-8">
            <h2 className="font-sans font-black text-white text-4xl sm:text-5xl uppercase tracking-tight">SafeUZ AI tizimidan <br/> foydalanishni boshlang</h2>
            <p className="text-base text-slate-400 font-sans max-w-2xl mx-auto leading-relaxed">
              Shubhali kontent, fishing link, scam post, zararli APK yoki giyohvandlikka oid yashirin reklama haqida xabar bering va tizimning sun'iy intellekt tahlilidan foydalaning.
            </p>
            
            <div className="flex flex-col sm:flex-row justify-center items-center gap-4 pt-4">
              <Link 
                to="/report" 
                className="w-full sm:w-auto bg-rose-600 hover:bg-rose-500 text-white font-mono font-bold uppercase tracking-wider px-8 py-4 rounded shadow-[0_0_20px_rgba(225,29,72,0.3)] transition-all flex items-center justify-center gap-3"
              >
                <AlertTriangle className="w-5 h-5" />
                Report Yuborish
              </Link>
              <Link 
                to="/register" 
                className="w-full sm:w-auto bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-mono font-bold uppercase tracking-wider px-8 py-4 rounded shadow-[0_0_20px_rgba(6,182,212,0.3)] transition-all flex items-center justify-center gap-3"
              >
                <Fingerprint className="w-5 h-5 text-slate-950" />
                Ro'yxatdan o'tish
              </Link>
              <Link 
                to="/login" 
                className="w-full sm:w-auto bg-slate-900 border border-slate-800 hover:bg-slate-800 text-white font-mono font-bold uppercase tracking-wider px-8 py-4 rounded transition-all flex items-center justify-center gap-3"
              >
                <User className="w-5 h-5 text-cyan-500" />
                Kirish
              </Link>
            </div>
          </div>
        </section>

      </main>

      {/* 10. FOOTER */}
      <footer className="bg-[#04060b] border-t border-slate-900 text-slate-500 py-12 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            
            <div className="flex flex-col items-center md:items-start gap-2">
              <div className="flex items-center gap-3">
                <Shield className="w-6 h-6 text-cyan-500" />
                <span className="font-sans font-black text-white text-xl tracking-widest uppercase">SAFEUZ AI</span>
              </div>
              <span className="text-xs font-mono uppercase tracking-widest text-slate-500">AI-powered threat intelligence platform</span>
            </div>

            <div className="flex flex-wrap justify-center gap-6 text-xs font-mono uppercase tracking-widest">
              <a href="#" className="hover:text-cyan-400 transition-colors">Bosh sahifa</a>
              <a href="#about" className="hover:text-cyan-400 transition-colors">Platforma haqida</a>
              <Link to="/login" className="hover:text-cyan-400 transition-colors">Login</Link>
              <Link to="/register" className="hover:text-cyan-400 transition-colors">Register</Link>
            </div>

          </div>
          
          <div className="mt-12 pt-8 border-t border-slate-900 text-center text-[10px] font-mono uppercase tracking-widest text-slate-600">
            © 2026 SafeUZ AI. Sirdaryo viloyati bo'yicha kiberxavfsizlik markazi. Barcha huquqlar himoyalangan.
          </div>
        </div>
      </footer>

    </div>
  );
}
