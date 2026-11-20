import React from 'react';
import { X, Calendar, MapPin, Tag, ArrowRight, ShieldCheck, Ticket } from 'lucide-react';

export function EventDetailModal({ event, onClose, onBookNow }) {
  if (!event) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl rounded-3xl glass-card border border-purple-500/40 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Banner with Close Button */}
        <div className="relative h-60 sm:h-72 w-full overflow-hidden bg-[#140a25]">
          <img
            src={event.banner_image}
            alt={event.title}
            className="w-full h-full object-cover filter contrast-115 saturate-130 brightness-105"
            onError={(e) => {
              e.target.src = '/assets/neon_nights_hd.jpg';
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#100820] via-black/20 to-black/40" />

          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-9 h-9 rounded-full bg-black/60 border border-white/20 text-white flex items-center justify-center hover:bg-black/90 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Badges on Banner */}
          <div className="absolute bottom-4 left-6 right-6 flex items-end justify-between">
            <div>
              <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-purple-600/80 text-white border border-purple-400/50 shadow-md">
                {event.category}
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-2 drop-shadow-lg">
                {event.title}
              </h2>
            </div>
            <div className="text-right">
              <span className="text-xs text-purple-300 block">Tickets from</span>
              <span className="text-xl sm:text-2xl font-black text-white text-glow-purple">
                ₹{parseFloat(event.starting_price).toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Details Body */}
        <div className="p-6 overflow-y-auto no-scrollbar space-y-6">
          {/* Metadata Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-[#1e1038]/50 border border-purple-500/20 text-xs text-purple-200">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-purple-900/50 flex items-center justify-center text-purple-400 shrink-0">
                <Calendar className="w-4 h-4" />
              </div>
              <div>
                <p className="font-semibold text-white">Date & Time</p>
                <p>{new Date(event.start_date).toLocaleString()}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-purple-900/50 flex items-center justify-center text-purple-400 shrink-0">
                <MapPin className="w-4 h-4" />
              </div>
              <div>
                <p className="font-semibold text-white">Venue</p>
                <p>{event.venue}, {event.city}</p>
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <h4 className="text-sm font-bold text-white mb-2">About This Event</h4>
            <p className="text-xs sm:text-sm text-purple-200/80 leading-relaxed whitespace-pre-line">
              {event.description}
            </p>
          </div>

          {/* Ticket Tiers Available */}
          <div>
            <h4 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
              <Ticket className="w-4 h-4 text-purple-400" />
              <span>Available Ticket Categories</span>
            </h4>
            <div className="space-y-2.5">
              {event.ticket_categories?.map((tc) => (
                <div
                  key={tc.id}
                  className="p-3.5 rounded-2xl bg-[#1e1038]/60 border border-purple-500/20 flex items-center justify-between text-xs"
                >
                  <div>
                    <h5 className="font-bold text-white">{tc.name}</h5>
                    <p className="text-purple-300/70 text-[11px] mt-0.5">{tc.description}</p>
                  </div>
                  <div className="text-right">
                    <span className="font-extrabold text-white text-sm">
                      ₹{parseFloat(tc.price).toLocaleString()}
                    </span>
                    <span className="text-[10px] text-purple-300 block">
                      {tc.available_quota} available
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom Action */}
          <div className="pt-4 border-t border-purple-900/40 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs text-purple-300">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>10-Minute Reservation Hold Guarantee</span>
            </div>

            <button
              onClick={() => {
                onClose();
                onBookNow(event);
              }}
              className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold text-xs shadow-[0_0_20px_rgba(147,51,234,0.6)] hover:brightness-110 active:scale-95 transition-all cursor-pointer"
            >
              <span>Book Tickets</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
