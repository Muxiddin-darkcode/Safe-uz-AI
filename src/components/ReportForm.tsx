import React, { useState } from 'react';
import { ThreatType, SIRDARYO_REGIONS } from '../types';
import { auth } from '../firebase';
import axios from 'axios';
import { Shield, AlertTriangle, Link, FileCode, CheckCircle2, MapPin, Upload, HelpCircle } from 'lucide-react';

interface ReportFormProps {
  onSuccess: () => void;
}

export default function ReportForm({ onSuccess }: ReportFormProps) {
  const [threatType, setThreatType] = useState<ThreatType>("narcotics");
  const [content, setContent] = useState("");
  const [regionName, setRegionName] = useState("Guliston");
  const [locationText, setLocationText] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");

  // Tahdid turiga oid qo'shimcha maydonlar
  const [suspiciousLink, setSuspiciousLink] = useState("");
  const [apkName, setApkName] = useState("");
  const [telegramChannel, setTelegramChannel] = useState("");
  const [telegramPostLink, setTelegramPostLink] = useState("");

  // Fayl yuklash
  const [evidenceFile, setEvidenceFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setEvidenceFile(e.target.files[0]);
    }
  };

  // Geolokatsiya xizmati
  const [geoStatus, setGeoStatus] = useState<string | null>(null);
  const [geoLoading, setGeoLoading] = useState(false);

  const handleGetLocation = () => {
    setGeoStatus(null);
    if (!navigator.geolocation) {
      setGeoStatus("Sizning brauzeringiz geolokatsiyani qo'llab-quvvatlamaydi.");
      return;
    }

    setGeoLoading(true);
    setGeoStatus("GPS orqali joylashuvingiz aniqlanmoqda... Iltimos, so'rovga ruxsat bering.");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setLatitude(lat.toFixed(6));
        setLongitude(lng.toFixed(6));
        setGeoStatus("Sizning real vaqtdagi lokatsiyangiz muvaffaqiyatli aniqlandi! ✅");
        setGeoLoading(false);
      },
      (error) => {
        console.error("Geolocation error:", error);
        setGeoLoading(false);
        if (error.code === error.PERMISSION_DENIED) {
          setGeoStatus("Brauzerda lokatsiya ruxsati rad etildi. Iltimos, sozlamalardan ruxsat bering.");
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          setGeoStatus("GPS signalini aniqlab bo'lmadi. Internet yoki GPS yoqilganligini tekshiring.");
        } else if (error.code === error.TIMEOUT) {
          setGeoStatus("So'rov vaqti tugadi. Iltimos, qayta urinib ko'ring.");
        } else {
          setGeoStatus("Lokatsiyani olishda kutilmagan xatolik yuz berdi.");
        }
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  const handleSetSampleCoordinates = () => {
    const coords: Record<string, { lat: number; lng: number }> = {
      "Guliston": { lat: 40.4897, lng: 68.7848 },
      "Yangiyer": { lat: 40.2583, lng: 68.8144 },
      "Shirin": { lat: 40.2192, lng: 69.1172 },
      "Sirdaryo": { lat: 40.8402, lng: 68.6608 },
      "Boyovut": { lat: 40.4042, lng: 68.9667 },
      "Mirzaobod": { lat: 40.4356, lng: 68.5283 },
      "Oqoltin": { lat: 40.4682, lng: 68.1764 },
      "Sardoba": { lat: 40.2015, lng: 68.1362 },
      "Sayxunobod": { lat: 40.6481, lng: 68.9042 },
      "Xovos": { lat: 40.1667, lng: 68.8333 }
    };

    const sel = coords[regionName] || coords["Guliston"];
    setLatitude(sel.lat.toString());
    setLongitude(sel.lng.toString());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setUploadProgress(true);

    try {
      const formData = new FormData();
      formData.append("threatType", threatType);
      formData.append("content", content);
      formData.append("regionName", regionName);
      formData.append("locationText", locationText);
      if (latitude) formData.append("latitude", latitude);
      if (longitude) formData.append("longitude", longitude);

      if (evidenceFile) {
        formData.append("evidenceFile", evidenceFile);
      }

      if (threatType === "phishing") {
        formData.append("suspiciousLink", suspiciousLink);
      } else if (threatType === "malicious_apk") {
        formData.append("apkName", apkName);
      } else if (threatType === "telegram_scam") {
        formData.append("telegramChannel", telegramChannel);
        formData.append("telegramPostLink", telegramPostLink);
      } else if (threatType === "narcotics") {
        formData.append("telegramChannel", telegramChannel);
        formData.append("telegramPostLink", telegramPostLink);
      }

      const currentUser = auth.currentUser;
      if (currentUser) {
        formData.append("reporterId", currentUser.uid);
        formData.append("reporterRole", "user");
      } else {
        formData.append("reporterId", "anonymous_web");
        formData.append("reporterRole", "user");
      }

      const response = await axios.post("/api/reports", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (response.status === 201) {
        setSuccess(true);
        setContent("");
        setLocationText("");
        setLatitude("");
        setLongitude("");
        setSuspiciousLink("");
        setApkName("");
        setTelegramChannel("");
        setTelegramPostLink("");
        setEvidenceFile(null);
        setTimeout(() => {
          onSuccess();
        }, 2000);
      }
    } catch (err: any) {
      console.error("Error submitting report:", err);
      setError(err.response?.data?.error || "Xabar yuborishda xatolik yuz berdi. Ma'lumotlarni tekshiring.");
    } finally {
      setUploadProgress(false);
    }
  };

  return (
    <div className="bg-[#090d16] rounded-2xl border border-slate-800 shadow-[0_0_30px_rgba(6,182,212,0.05)] overflow-hidden" id="report_form_container">
      
      {/* Dynamic Header */}
      <div className="bg-slate-950 px-6 py-5 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center">
            <div className="absolute inset-0 bg-cyan-500/10 rounded blur-xs animate-pulse"></div>
            <div className="bg-slate-900 border border-cyan-500/50 p-2.5 rounded text-cyan-400">
              <Shield className="w-5 h-5" id="shield_icon_form" />
            </div>
          </div>
          <div>
            <h2 className="font-mono font-black text-white text-sm uppercase tracking-wider">SHUBHALI HOLAT HAQIDA XABAR BERISH</h2>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-0.5">Xavfsiz va anonim ma'lumot yuborish tizimi</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {error && (
          <div className="bg-rose-950/40 border border-rose-800 text-rose-300 p-4 rounded-lg text-xs flex gap-3 items-center">
            <AlertTriangle className="w-5 h-5 flex-shrink-0 text-rose-500" />
            <span className="font-mono">{error}</span>
          </div>
        )}

        {success && (
          <div className="bg-emerald-950/40 border border-emerald-800 text-emerald-300 p-4 rounded-lg text-xs flex gap-3 items-center">
            <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-500" />
            <div className="font-mono">
              <p className="font-bold uppercase text-white">XABARINGIZ MUVAFFIQLIYATLI QABUL QILINDI</p>
              <p className="text-[10px] text-slate-400 mt-1">SafeUZ tizimi xabaringizni qabul qildi va tahlil qilish uchun yo'naltirdi.</p>
            </div>
          </div>
        )}

        {/* Threat Type Selector */}
        <div className="space-y-3">
          <label className="block text-[10px] font-mono uppercase tracking-widest text-slate-400">
            XAVF TOIFASINI TANLANG <span className="text-rose-500">*</span>
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {[
              { id: "narcotics", label: "Giyovandlik faoliyati", icon: AlertTriangle, desc: "Noqonuniy savdo, zakladka joylari, giyohvand modda sotuvchi guruhlar va botlar", color: "hover:border-rose-500/50 active:ring-rose-500/20" },
              { id: "phishing", label: "Fishing (Soxta saytlar)", icon: Link, desc: "Click, Payme yoki davlat saytlarini taqlid qiluvchi firibgar havolalar", color: "hover:border-amber-500/50 active:ring-amber-500/20" },
              { id: "malicious_apk", label: "Zararli ilova (APK)", icon: FileCode, desc: "Norasmiy yoki shubhali mobil dasturlar, viruslar", color: "hover:border-cyan-500/50 active:ring-cyan-500/20" },
              { id: "telegram_scam", label: "Telegram firibgarligi", icon: Shield, desc: "Soxta yutuqli o'yinlar, pul ko'paytiruvchi guruhlar va kanallar", color: "hover:border-emerald-500/50 active:ring-emerald-500/20" },
              { id: "other", label: "Boshqa xavf", icon: Shield, desc: "Boshqa turdagi xavfsizlikka tahdid soluvchi holatlar", color: "hover:border-slate-500/50" }
            ].map((type) => {
              const IconComp = type.icon;
              const isSelected = threatType === type.id;
              
              let selectClass = "border-slate-800 bg-slate-950/60 text-slate-400";
              if (isSelected) {
                if (type.id === "narcotics") selectClass = "border-rose-500 bg-rose-950/15 text-rose-300 shadow-[0_0_15px_rgba(239,68,68,0.1)]";
                else if (type.id === "phishing") selectClass = "border-amber-500 bg-amber-950/15 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.1)]";
                else if (type.id === "malicious_apk") selectClass = "border-cyan-500 bg-cyan-950/15 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.1)]";
                else if (type.id === "telegram_scam") selectClass = "border-emerald-500 bg-emerald-950/15 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.1)]";
                else selectClass = "border-slate-500 bg-slate-900/60 text-slate-200";
              }

              return (
                <button
                  key={type.id}
                  type="button"
                  id={`btn_threat_type_${type.id}`}
                  onClick={() => setThreatType(type.id as ThreatType)}
                  className={`flex flex-col items-start p-4 rounded-xl border text-left transition-all ${type.color} ${selectClass}`}
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <IconComp className="w-4 h-4" />
                    <span className="font-mono font-black text-xs uppercase tracking-wide">{type.label}</span>
                  </div>
                  <span className="font-sans text-[11px] text-slate-500 leading-relaxed">{type.desc}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Dynamic Fields Section */}
        <div className="bg-slate-950/80 p-5 rounded-xl border border-slate-800/80 space-y-4">
          <h3 className="font-mono font-black text-[10px] tracking-wider text-slate-500 uppercase">QO'SHIMCHA MA'LUMOTLAR</h3>

          {threatType === "narcotics" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1.5">Telegram kanal, bot yoki profil nomi</label>
                <input
                  type="text"
                  placeholder="Masalan: @giyohvand_savdo_bot"
                  value={telegramChannel}
                  onChange={(e) => setTelegramChannel(e.target.value)}
                  className="w-full bg-[#060813] border border-slate-800 rounded-lg px-3.5 py-2.5 text-xs font-mono text-slate-200 focus:outline-none focus:border-rose-500"
                />
              </div>
              <div>
                <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1.5">Shubhali xabar (post) havolasi</label>
                <input
                  type="text"
                  placeholder="Masalan: https://t.me/channel/123"
                  value={telegramPostLink}
                  onChange={(e) => setTelegramPostLink(e.target.value)}
                  className="w-full bg-[#060813] border border-slate-800 rounded-lg px-3.5 py-2.5 text-xs font-mono text-slate-200 focus:outline-none focus:border-rose-500"
                />
              </div>
            </div>
          )}

          {threatType === "phishing" && (
            <div>
              <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1.5">Shubhali sayt manzili (URL) <span className="text-rose-500">*</span></label>
              <input
                type="text"
                required
                placeholder="Masalan: https://payme-uzbekistan-bonus.click"
                value={suspiciousLink}
                onChange={(e) => setSuspiciousLink(e.target.value)}
                className="w-full bg-[#060813] border border-slate-800 rounded-lg px-3.5 py-2.5 text-xs font-mono text-slate-200 focus:outline-none focus:border-amber-500"
              />
            </div>
          )}

          {threatType === "malicious_apk" && (
            <div>
              <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1.5">Zararli ilova (APK) nomi</label>
              <input
                type="text"
                placeholder="Masalan: Telegram_Premium_Tezkor.apk"
                value={apkName}
                onChange={(e) => setApkName(e.target.value)}
                className="w-full bg-[#060813] border border-slate-800 rounded-lg px-3.5 py-2.5 text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500"
              />
            </div>
          )}

          {threatType === "telegram_scam" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1.5">Kanal, guruh yoki profil nomi</label>
                <input
                  type="text"
                  placeholder="Masalan: @yutuqli_oyunlar_uz"
                  value={telegramChannel}
                  onChange={(e) => setTelegramChannel(e.target.value)}
                  className="w-full bg-[#060813] border border-slate-800 rounded-lg px-3.5 py-2.5 text-xs font-mono text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1.5">Shubhali xabar havolasi (post)</label>
                <input
                  type="text"
                  placeholder="Masalan: https://t.me/yutuqli_oyunlar_uz/45"
                  value={telegramPostLink}
                  onChange={(e) => setTelegramPostLink(e.target.value)}
                  className="w-full bg-[#060813] border border-slate-800 rounded-lg px-3.5 py-2.5 text-xs font-mono text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          )}

          {/* Description (Common) */}
          <div>
            <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1.5">
              HOLAT BILAN BOG'LIQ TAFSILOTLAR <span className="text-rose-500">*</span>
            </label>
            <textarea
              required
              rows={4}
              placeholder="Shubhali holat haqida batafsil ma'lumot bering. Masalan: taklif qilinayotgan noqonuniy moddalar, firibgarlik usullari yoki shubhali fayl yuklash bo'yicha yo'riqnomalar..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full bg-[#060813] border border-slate-800 rounded-lg p-3 text-xs font-mono text-slate-200 focus:outline-none focus:border-slate-600 focus:ring-1 focus:ring-slate-800/60 leading-relaxed placeholder-slate-700"
            />
          </div>
        </div>

        {/* Region & Location Coordinates Section */}
        <div className="bg-slate-950/80 p-5 rounded-xl border border-slate-800/80 space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <h3 className="font-mono font-black text-[10px] tracking-wider text-slate-400 uppercase flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-cyan-400" /> HUDUDIY JOYLAShUV (KOORDINATA)
            </h3>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleGetLocation}
                disabled={geoLoading}
                className="text-[9px] font-mono uppercase tracking-widest text-emerald-400 bg-emerald-950/20 hover:bg-emerald-950/40 px-3 py-1.5 rounded border border-emerald-800/60 transition-all shadow-2xs flex items-center gap-1.5 hover:scale-[1.02] active:scale-[0.98]"
              >
                <MapPin className="w-3 h-3 animate-bounce" /> REAL VAQTDA LOKATSIYANI ANIQLASH
              </button>
              <button
                type="button"
                onClick={handleSetSampleCoordinates}
                className="text-[9px] font-mono uppercase tracking-widest text-slate-400 bg-slate-900 hover:bg-slate-850 px-3 py-1.5 rounded border border-slate-800 transition-colors shadow-2xs"
              >
                Namuna koordinatalarni to'ldirish
              </button>
            </div>
          </div>

          {geoStatus && (
            <div className={`p-3 rounded-lg text-xs font-mono border ${
              geoStatus.includes("muvaffaqiyatli") 
                ? "bg-emerald-950/30 border-emerald-800 text-emerald-300" 
                : "bg-amber-950/30 border-amber-800 text-amber-300"
            }`}>
              {geoStatus}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1.5">TUMAN / SHAHAR <span className="text-rose-500">*</span></label>
              <select
                value={regionName}
                onChange={(e) => setRegionName(e.target.value)}
                className="w-full bg-[#060813] border border-slate-800 rounded-lg px-3.5 py-2.5 text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500"
              >
                {SIRDARYO_REGIONS.map(reg => (
                  <option key={reg} value={reg}>{reg}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1.5">KENGlik (LATITUDE)</label>
              <input
                type="text"
                placeholder="40.4897"
                value={latitude}
                onChange={(e) => setLatitude(e.target.value)}
                className="w-full bg-[#060813] border border-slate-800 rounded-lg px-3.5 py-2.5 text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1.5">BO'YLIK (LONGITUDE)</label>
              <input
                type="text"
                placeholder="68.7848"
                value={longitude}
                onChange={(e) => setLongitude(e.target.value)}
                className="w-full bg-[#060813] border border-slate-800 rounded-lg px-3.5 py-2.5 text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1.5">ANIQ MANZIL (KO'CHA, MO'LJAL, MAFYDON)</label>
            <input
              type="text"
              placeholder="Masalan: Guliston shahri, markaziy vokzal yaqinida"
              value={locationText}
              onChange={(e) => setLocationText(e.target.value)}
              className="w-full bg-[#060813] border border-slate-800 rounded-lg px-3.5 py-2.5 text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500"
            />
          </div>
        </div>

        {/* File Upload Section */}
        <div className="space-y-3">
          <label className="block text-[10px] font-mono uppercase tracking-widest text-slate-400">
            ISBOTLOVCHI RASM YOKI FAILINGIZ (EKRAN RASMI YOKI HUJJAT)
          </label>
          <div className="flex items-center justify-center w-full">
            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-slate-800 border-dashed rounded-xl cursor-pointer bg-slate-950/40 hover:bg-slate-950 hover:border-cyan-500/40 transition-colors">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <Upload className="w-8 h-8 text-slate-600 mb-2 animate-pulse" />
                <p className="text-xs text-slate-300 font-mono uppercase tracking-wider">
                  {evidenceFile ? (
                    <span className="font-semibold text-cyan-400">{evidenceFile.name}</span>
                  ) : (
                    <span>RASM YOKI FAYLNI YUKLANG (YOKI SHU YERGA SURIB KELTIRING)</span>
                  )}
                </p>
                <p className="text-[10px] text-slate-500 font-mono uppercase tracking-widest mt-1">PNG, JPG, PDF yoki APK (maksimum 10MB)</p>
              </div>
              <input
                type="file"
                className="hidden"
                onChange={handleFileChange}
                accept="image/*,application/pdf,.apk"
              />
            </label>
          </div>
        </div>

        {/* Submit */}
        <div className="pt-2">
          <button
            type="submit"
            id="btn_submit_report"
            disabled={uploadProgress}
            className={`w-full bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-mono font-black uppercase tracking-wider py-4 rounded-lg text-xs border border-cyan-400/30 transition-all flex items-center justify-center gap-2 ${
              uploadProgress ? "opacity-50 cursor-not-allowed" : "hover:-translate-y-0.5 shadow-[0_0_20px_rgba(6,182,212,0.3)]"
            }`}
          >
            {uploadProgress ? (
              <>
                <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div>
                XABAR TAHLIL QILINMOQDA VA YUBORILMOQDA...
              </>
            ) : (
              <>
                <Shield className="w-4 h-4 text-slate-950" />
                XABARNI TIZIMGA YUBORISH
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
