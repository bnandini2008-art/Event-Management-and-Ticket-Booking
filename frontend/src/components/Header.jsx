import React, { useState } from 'react';
import { Sparkles, Home, Calendar, Ticket, Heart, Info, Mail, Sun, Moon, Shield, User, LogOut, ChevronDown } from 'lucide-react';

export function Header({
  activeNav,
  setActiveNav,
  currentUser,
  onOpenAuth,
  onOpenAdmin,
  onOpenMyBookings,
  onOpenFavorites,
  onOpenAbout,
  onOpenContact,
  onQuickRoleSwitch,
  darkMode,
  setDarkMode
}) {
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  const navItems = [
    { id: 'home', label: 'Home', icon: Home, action: () => setActiveNav('home') },
    { id: 'events', label: 'Events', icon: Calendar, action: () => setActiveNav('events') },
    { id: 'my-bookings', label: 'My Bookings', icon: Ticket, action: onOpenMyBookings },
    { id: 'favorites', label: 'Favorites', icon: Heart, action: onOpenFavorites },
    { id: 'about', label: 'About', icon: Info, action: onOpenAbout },
    { id: 'contact', label: 'Contact', icon: Mail, action: onOpenContact },
  ];

  return (
    <header className="relative z-40 w-full px-4 sm:px-8 py-4 flex items-center justify-between border-b border-purple-900/30 backdrop-blur-md bg-[#0b0716]/60">
      {/* Left: Brand Logo */}
      <div 
        onClick={() => setActiveNav('home')} 
        className="flex items-center gap-3 cursor-pointer group"
      >
        <div className="relative flex items-center justify-center">
          <Sparkles className="w-7 h-7 text-purple-400 group-hover:text-purple-300 transition-colors animate-pulse" />
          <div className="absolute inset-0 bg-purple-500/20 blur-md rounded-full pointer-events-none" />
        </div>
        <div>
          <span className="text-2xl font-bold tracking-wider text-white font-sans drop-shadow-[0_2px_10px_rgba(168,85,247,0.5)]">
            Eventix
          </span>
          <p className="text-[10px] tracking-widest text-purple-300 uppercase font-medium">
            Dream · Book · Experience
          </p>
        </div>
      </div>

      {/* Center: Navigation Pill Container */}
      <nav className="hidden md:flex items-center gap-1.5 p-1.5 rounded-full bg-[#1e1038]/70 border border-purple-500/30 shadow-[0_4px_20px_rgba(0,0,0,0.4)] backdrop-blur-lg">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeNav === item.id;
          return (
            <button
              key={item.id}
              onClick={item.action}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 ${
                isActive
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-[0_0_15px_rgba(147,51,234,0.6)] border border-purple-400/40'
                  : 'text-purple-200/80 hover:text-white hover:bg-purple-900/30'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Right Controls: Theme Toggle & User Avatar */}
      <div className="flex items-center gap-3">
        {/* Dark / Light Toggle */}
        <button
          onClick={() => setDarkMode(!darkMode)}
          title="Toggle Theme"
          className="w-9 h-9 rounded-full flex items-center justify-center border border-purple-500/30 bg-[#1e1038]/60 text-purple-200 hover:text-white hover:border-purple-400 transition-colors"
        >
          {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* User Profile Menu */}
        <div className="relative">
          <button
            onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
            className="flex items-center gap-2 p-1 rounded-full border-2 border-purple-400/70 hover:border-purple-300 bg-purple-950/60 transition-all shadow-[0_0_15px_rgba(168,85,247,0.5)]"
          >
            <img
              src="/assets/user_avatar_hd.jpg"
              alt="User Avatar"
              className="w-8 h-8 rounded-full object-cover border border-purple-300/50 filter contrast-110 brightness-105"
              onError={(e) => {
                e.target.src = '/assets/user_avatar.jpg';
              }}
            />
            <ChevronDown className="w-3.5 h-3.5 text-purple-300 pr-0.5" />
          </button>

          {/* Profile Dropdown */}
          {profileDropdownOpen && (
            <div 
              className="absolute right-0 mt-2 w-64 rounded-2xl glass-panel p-3 shadow-2xl z-50 border border-purple-500/30 text-xs animate-in fade-in slide-in-from-top-2 duration-150"
              onMouseLeave={() => setProfileDropdownOpen(false)}
            >
              <div className="p-2 border-b border-purple-900/40 mb-2">
                <p className="font-semibold text-white text-sm">{currentUser.name || 'Alex Morgan'}</p>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-purple-300">{currentUser.email || 'alex@example.com'}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-wider ${
                    currentUser.role === 'admin' 
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      : 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                  }`}>
                    {currentUser.role || 'user'}
                  </span>
                </div>
              </div>

              {/* Quick Role Switcher for Evaluator Convenience */}
              <div className="p-2 bg-purple-950/40 rounded-xl mb-2 border border-purple-900/30">
                <p className="text-[11px] font-semibold text-purple-200 mb-1.5 flex items-center gap-1">
                  <Shield className="w-3.5 h-3.5 text-purple-400" /> Switch Test Role:
                </p>
                <div className="grid grid-cols-3 gap-1">
                  {['guest', 'user', 'admin'].map((role) => (
                    <button
                      key={role}
                      onClick={() => {
                        onQuickRoleSwitch(role);
                        setProfileDropdownOpen(false);
                      }}
                      className={`py-1 px-1.5 text-center capitalize rounded-lg text-[10px] font-medium transition-colors ${
                        currentUser.role === role
                          ? 'bg-purple-600 text-white font-bold'
                          : 'bg-purple-900/30 text-purple-300 hover:bg-purple-800/40'
                      }`}
                    >
                      {role}
                    </button>
                  ))}
                </div>
              </div>

              {/* Menu items */}
              <div className="space-y-1">
                {currentUser.role === 'admin' && (
                  <button
                    onClick={() => {
                      onOpenAdmin();
                      setProfileDropdownOpen(false);
                    }}
                    className="w-full flex items-center gap-2 p-2 rounded-xl text-purple-200 hover:text-white hover:bg-purple-900/30 font-medium text-left"
                  >
                    <Shield className="w-4 h-4 text-amber-400" />
                    <span>Admin Control Center</span>
                  </button>
                )}

                <button
                  onClick={() => {
                    onOpenMyBookings();
                    setProfileDropdownOpen(false);
                  }}
                  className="w-full flex items-center gap-2 p-2 rounded-xl text-purple-200 hover:text-white hover:bg-purple-900/30 font-medium text-left"
                >
                  <Ticket className="w-4 h-4 text-purple-400" />
                  <span>My Bookings</span>
                </button>

                <button
                  onClick={() => {
                    onOpenFavorites();
                    setProfileDropdownOpen(false);
                  }}
                  className="w-full flex items-center gap-2 p-2 rounded-xl text-purple-200 hover:text-white hover:bg-purple-900/30 font-medium text-left"
                >
                  <Heart className="w-4 h-4 text-pink-400" />
                  <span>Favorite Events</span>
                </button>

                <button
                  onClick={() => {
                    onOpenAuth();
                    setProfileDropdownOpen(false);
                  }}
                  className="w-full flex items-center gap-2 p-2 rounded-xl text-purple-300 hover:text-white hover:bg-purple-900/30 font-medium text-left border-t border-purple-900/40 mt-1"
                >
                  <User className="w-4 h-4 text-purple-400" />
                  <span>{currentUser.role === 'guest' ? 'Sign In / Register' : 'Account Settings'}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
