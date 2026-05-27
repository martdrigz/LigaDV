import React from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { Home, Users, BarChart2, CalendarPlus, ChevronLeft, LogIn, LogOut } from 'lucide-react';
import { cn } from '../lib/utils';
import { AnimatePresence, motion } from 'motion/react';
import { useFirebase } from './FirebaseProvider';

export function Layout() {
  const location = useLocation();
  const { user, signIn, logout } = useFirebase();
  const isMatchView = location.pathname.startsWith('/match/');

  return (
    <div className="flex flex-col h-screen bg-[#050505] text-white font-sans overflow-hidden">
      
      {/* Desktop Top Header Navigation */}
      <header className="hidden md:flex flex-none items-center justify-between px-8 h-20 border-b border-white/5 bg-[#0a0a0a]/80 backdrop-blur-xl z-50">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-[#eaba3f] flex items-center justify-center font-black text-black">
            M
          </div>
          <div className="flex flex-col">
            <h1 className="text-xl font-black tracking-tight leading-none uppercase">MatchDay</h1>
            <span className="text-[10px] font-bold text-[#eaba3f] tracking-[0.2em] leading-none mt-1 ml-0.5">LIGA DV</span>
          </div>
        </div>
        
        <nav className="flex items-center gap-2">
          <DesktopNavLink to="/" icon={<Home size={18} />} label="Inicio" />
          <DesktopNavLink to="/roster" icon={<Users size={18} />} label="Jugadores" />
          <DesktopNavLink to="/setup" icon={<CalendarPlus size={18} />} label="Sorteo" />
          <DesktopNavLink to="/stats" icon={<BarChart2 size={18} />} label="Estadística" />
          
          <div className="h-4 w-[1px] bg-white/10 mx-2" />
          
          {user ? (
            <div className="flex items-center gap-3 ml-2">
              {user.photoURL && (
                <img src={user.photoURL} alt={user.displayName || ''} className="w-8 h-8 rounded-full border border-white/10" referrerPolicy="no-referrer" />
              )}
              <button 
                onClick={() => logout()}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-all uppercase tracking-wider"
              >
                <LogOut size={14} /> Salir
              </button>
            </div>
          ) : (
            <button 
              onClick={() => signIn()}
              className="flex items-center gap-2 px-4 py-2 bg-[#eaba3f] text-black rounded-xl font-bold text-sm hover:bg-[#d9a32c] transition-all"
            >
              <LogIn size={16} /> Entrar
            </button>
          )}
        </nav>
      </header>

      {/* Mobile Top Header */}
      <header className="md:hidden flex-none bg-[#0a0a0a]/90 backdrop-blur-md border-b border-white/5 px-4 h-14 flex items-center justify-between z-40 sticky top-0">
        {isMatchView ? (
          <button 
            onClick={() => window.history.back()} 
            className="flex items-center gap-1 text-[#eaba3f] font-medium"
          >
            <ChevronLeft size={24} /> Volver
          </button>
        ) : (
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-[#eaba3f] flex items-center justify-center font-black text-black text-sm">
                M
              </div>
              <div className="flex flex-col">
                <h1 className="text-base font-bold tracking-tight leading-none uppercase">MatchDay</h1>
                <span className="text-[8px] font-bold text-[#eaba3f] tracking-widest leading-none mt-0.5 ml-0.5">LIGA DV</span>
              </div>
            </div>
            
            {user ? (
              <button onClick={() => logout()} className="text-gray-500 p-2">
                <LogOut size={20} />
              </button>
            ) : (
              <button onClick={() => signIn()} className="text-[#eaba3f] p-2">
                <LogIn size={20} />
              </button>
            )}
          </div>
        )}
      </header>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        {/* Scrollable Main Content */}
        <main className="flex-1 overflow-y-auto pb-[calc(env(safe-area-inset-bottom)+75px)] md:pb-8 relative scroll-smooth overscroll-y-contain">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="min-h-full max-w-7xl mx-auto p-4 md:p-8"
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>

        {/* Mobile Bottom Navigation */}
        {!isMatchView && (
          <nav className="md:hidden absolute bottom-0 left-0 right-0 h-[65px] bg-[#0a0a0a]/95 backdrop-blur-2xl border-t border-white/5 pb-[env(safe-area-inset-bottom)] z-50 flex items-center justify-around px-2">
            <BottomNavButton to="/" icon={<Home size={22} />} label="Inicio" />
            <BottomNavButton to="/roster" icon={<Users size={22} />} label="Jugadores" />
            <BottomNavButton to="/setup" icon={<CalendarPlus size={22} />} label="Sorteo" />
            <BottomNavButton to="/stats" icon={<BarChart2 size={22} />} label="Estadística" />
          </nav>
        )}
      </div>
    </div>
  );
}

function DesktopNavLink({ to, icon, label }: { to: string; icon: React.ReactNode; label: string }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cn(
          "flex items-center gap-2 px-4 py-2 rounded-xl transition-all font-bold text-sm tracking-tight",
          isActive 
            ? "bg-[#eaba3f]/10 text-[#eaba3f]" 
            : "text-gray-400 hover:text-gray-200 hover:bg-white/5"
        )
      }
    >
      {icon}
      <span>{label}</span>
      </NavLink>
  );
}

function BottomNavButton({ to, icon, label }: { to: string; icon: React.ReactNode; label: string }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cn(
          "flex flex-col items-center justify-center w-16 h-12 gap-1 rounded-lg transition-all",
          isActive 
            ? "text-[#eaba3f]" 
            : "text-gray-500 hover:text-gray-300 active:scale-95"
        )
      }
    >
      {icon}
      <span className="text-[10px] font-medium tracking-wide">{label}</span>
    </NavLink>
  );
}
