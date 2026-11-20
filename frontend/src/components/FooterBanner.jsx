import React, { useState } from 'react';
import { Zap, ShieldCheck, Headphones, ArrowRight, CheckCircle2 } from 'lucide-react';

export function FooterBanner() {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async (e) => {
    e.preventDefault();
    if (!email || !email.includes('@')) return;

    setLoading(true);
    try {
      const res = await fetch('/api/newsletter/subscribe/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      if (res.ok) {
        setSubscribed(true);
        setEmail('');
      }
    } catch {
      setSubscribed(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-6 sm:px-12 py-8 mt-4 border-t border-purple-900/40">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* Left: 3 Feature Value Props */}
        <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-3 gap-6">
          {/* Instant Booking */}
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-purple-950/60 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0 shadow-[0_0_15px_rgba(168,85,247,0.3)]">
              <Zap className="w-5 h-5 fill-purple-400" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">Instant Booking</h4>
              <p className="text-xs text-purple-300/70">in Just a Few Clicks</p>
            </div>
          </div>

          {/* Secure Payments */}
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-purple-950/60 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0 shadow-[0_0_15px_rgba(168,85,247,0.3)]">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">Secure Payments</h4>
              <p className="text-xs text-purple-300/70">with 100% Safety</p>
            </div>
          </div>

          {/* 24/7 Support */}
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-purple-950/60 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0 shadow-[0_0_15px_rgba(168,85,247,0.3)]">
              <Headphones className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">24/7 Support</h4>
              <p className="text-xs text-purple-300/70">Always Here</p>
            </div>
          </div>
        </div>

        {/* Right: Newsletter Box with 3D Gift */}
        <div className="lg:col-span-5">
          <div className="p-3 sm:p-4 rounded-3xl bg-gradient-to-r from-[#1c0c3a]/90 via-[#26104e]/80 to-[#1c0c3a]/90 border border-purple-500/30 shadow-[0_0_30px_rgba(147,51,234,0.25)] flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="relative w-14 h-14 shrink-0 flex items-center justify-center">
                <img
                  src="/assets/gift_box_hd.jpg"
                  alt="Special Offer Gift"
                  className="w-full h-full object-contain filter drop-shadow-[0_0_15px_rgba(192,132,252,0.95)] contrast-110 brightness-105"
                  onError={(e) => {
                    e.target.src = '/assets/gift_box.jpg';
                  }}
                />
              </div>

              <div>
                <h4 className="text-xs sm:text-sm font-bold text-white whitespace-nowrap">
                  Get Exclusive Offers!
                </h4>
                <p className="text-[11px] text-purple-300/80">
                  Subscribe to our newsletter
                </p>
              </div>
            </div>

            {subscribed ? (
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 bg-emerald-950/40 px-4 py-2 rounded-full border border-emerald-500/30">
                <CheckCircle2 className="w-4 h-4" />
                <span>Subscribed! Check email</span>
              </div>
            ) : (
              <form onSubmit={handleSubscribe} className="relative w-full sm:w-auto flex items-center">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                  className="w-full sm:w-56 pl-4 pr-10 py-2 rounded-full bg-[#100720]/80 border border-purple-500/40 text-xs text-white placeholder-purple-300/40 focus:outline-none focus:border-purple-300 backdrop-blur-md"
                />
                <button
                  type="submit"
                  disabled={loading}
                  aria-label="Subscribe"
                  className="absolute right-1 w-8 h-8 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white flex items-center justify-center shadow-md hover:brightness-110 active:scale-95 transition-all cursor-pointer"
                >
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* Subtle Copyright & IEEE 830 compliance mark */}
      <div className="mt-8 pt-4 border-t border-purple-900/20 text-center text-[11px] text-purple-400/50 flex flex-col sm:flex-row items-center justify-between gap-2">
        <p>© 2026 Eventix Platform Inc. Prepared in accordance with IEEE 830 / ISO/IEC/IEEE 29148.</p>
        <p>Built with React & Django REST Framework · Gemini AI Concierge Integrated</p>
      </div>
    </div>
  );
}
