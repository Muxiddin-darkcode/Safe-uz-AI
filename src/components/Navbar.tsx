import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { auth, signOut } from '../firebase';
import { Shield, LogOut, User, Menu, X, BarChart2 } from 'lucide-react';

interface NavbarProps {
  role: "user" | "inspector" | "admin";
  fullName: string;
}

export default function Navbar({ role, fullName }: NavbarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = React.useState(false);

  const handleSignOut = async () => {
    try {
      // Attempt standard firebase logout
      await signOut(auth);
    } catch (fbErr) {
      console.warn("Firebase signOut failed or was not initialized:", fbErr);
    }

    try {
      // Attempt to invalidate session on backend
      const token = localStorage.getItem("safeuz_token");
      if (token) {
        await fetch("/api/auth/logout", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${token}`
          }
        });
      }
    } catch (apiErr) {
      console.warn("Backend session logout failed:", apiErr);
    }

    // Always clear localStorage and redirect
    localStorage.removeItem("safeuz_token");
    localStorage.removeItem("safeuz_user");
    navigate("/");
    window.location.reload();
  };

  const isSelected = (path: string) => location.pathname === path;

  // Render navigation links dynamically by role
  const getNavLinks = () => {
    if (role === "admin") {
      return [
        { name: "Boshqaruv paneli", path: "/admin/dashboard" },
        { name: "Kiberxavflar", path: "/admin/reports" },
        { name: "Analitika", path: "/admin/analytics" },
        { name: "Kanallar & Manbalar", path: "/admin/sources" },
        { name: "Inspektorlar", path: "/admin/inspectors" },
        { name: "Foydalanuvchilar", path: "/admin/users" },
        { name: "Sozlamalar", path: "/admin/settings" }
      ];
    } else if (role === "inspector") {
      return [
        { name: "Boshqaruv paneli", path: "/inspector/dashboard" },
        { name: "Giyohvandlik xabarlari", path: "/inspector/reports" }
      ];
    } else {
      return [
        { name: "Bosh sahifa", path: "/user/dashboard" },
        { name: "Yangi xabar yuborish", path: "/user/report" },
        { name: "Mening xabarlarim", path: "/user/history" }
      ];
    }
  };

  const navLinks = getNavLinks();

  const roleLabelMap = {
    admin: { label: "Bosh Administrator", style: "bg-rose-950/40 text-rose-400 border-rose-800/40" },
    inspector: { label: "Sektor Mas'uli", style: "bg-cyan-950/40 text-cyan-400 border-cyan-800/40" },
    user: { label: "Fuqaro (Anonim)", style: "bg-emerald-950/40 text-emerald-400 border-emerald-800/40" }
  };

  const activeRole = roleLabelMap[role] || roleLabelMap.user;

  return (
    <nav className="bg-[#090d16]/95 border-b border-slate-800/80 text-white sticky top-0 z-50 backdrop-blur-md" id="navbar_container">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            {/* Logo */}
            <div className="flex-shrink-0 flex items-center gap-2 mr-6">
              <Shield className="w-6 h-6 text-cyan-400" />
              <span className="font-sans font-extrabold tracking-tight text-lg text-white">SafeUZ <span className="text-cyan-400">AI</span></span>
            </div>

            {/* Desktop Navigation Links */}
            <div className="hidden lg:flex space-x-1 items-center">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`px-3 py-2 rounded-lg text-xs font-sans font-semibold transition-all ${
                    isSelected(link.path)
                      ? "bg-slate-800 text-white"
                      : "text-slate-300 hover:bg-slate-800/60 hover:text-white"
                  }`}
                >
                  {link.name}
                </Link>
              ))}
            </div>
          </div>

          {/* User Profile & Sign Out Controls */}
          <div className="hidden lg:flex items-center gap-4">
            <div className="flex items-center gap-2 text-right">
              <div>
                <p className="text-xs font-bold text-slate-100">{fullName}</p>
                <span className={`inline-block text-[9px] font-bold border rounded px-1.5 py-0.2 ${activeRole.style}`}>
                  {activeRole.label}
                </span>
              </div>
              <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300">
                <User className="w-4 h-4" />
              </div>
            </div>

            <button
              onClick={handleSignOut}
              className="text-slate-400 hover:text-red-400 transition-colors p-2 rounded-lg hover:bg-slate-800"
              title="Chiqish"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center lg:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 focus:outline-none"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="lg:hidden bg-[#090d16] border-t border-slate-800/80 px-2 pt-2 pb-4 space-y-1">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              onClick={() => setIsOpen(false)}
              className={`block px-3 py-2.5 rounded-lg text-sm font-sans font-semibold transition-all ${
                isSelected(link.path)
                  ? "bg-slate-800 text-white"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              }`}
            >
              {link.name}
            </Link>
          ))}
          <div className="border-t border-slate-800 pt-4 mt-4 px-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-300">
                <User className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-100">{fullName}</p>
                <span className={`inline-block text-[9px] font-bold border rounded px-1.5 py-0.2 ${activeRole.style}`}>
                  {activeRole.label}
                </span>
              </div>
            </div>
            <button
              onClick={handleSignOut}
              className="text-red-400 hover:text-red-300 transition-colors flex items-center gap-1 text-xs font-semibold p-2 rounded-lg bg-red-500/10"
            >
              <LogOut className="w-3.5 h-3.5" /> Chiqish
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
