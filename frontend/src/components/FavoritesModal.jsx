import React from 'react';
import { X, Heart, Calendar, MapPin, ArrowRight } from 'lucide-react';

export function FavoritesModal({ onClose, favorites, events, onBookNow, onToggleFavorite }) {
  const favoriteEvents = events.filter((e) => favorites.includes(e.id));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl rounded-3xl glass-card border border-purple-500/40 shadow-2xl p-6 max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between pb-4 border-b border-purple-900/40">
          <div className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-pink-400 fill-pink-400" />
            <h3 className="text-base font-bold text-white">
              My Saved Favorites ({favoriteEvents.length})
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-purple-300 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="py-4 overflow-y-auto no-scrollbar space-y-3 flex-1">
          {favoriteEvents.length === 0 ? (
            <div className="text-center py-10 glass-panel rounded-2xl">
              <Heart className="w-10 h-10 text-pink-400/30 mx-auto mb-2" />
              <p className="text-purple-200 text-sm font-semibold">No favorites saved yet</p>
              <p className="text-xs text-purple-300/60 mt-1">
                Tap the heart icon on any event card to save it here.
              </p>
            </div>
          ) : (
            favoriteEvents.map((ev) => (
              <div
                key={ev.id}
                className="p-3.5 rounded-2xl bg-[#1e1038]/60 border border-purple-500/20 flex items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-center gap-3">
                  <img
                    src={ev.banner_image}
                    alt={ev.title}
                    className="w-14 h-14 rounded-xl object-cover filter contrast-110 saturate-120"
                    onError={(e) => {
                      e.target.src = '/assets/neon_nights_hd.jpg';
                    }}
                  />
                  <div>
                    <h4 className="font-bold text-white">{ev.title}</h4>
                    <p className="text-purple-300 text-[11px]">{ev.venue}</p>
                    <span className="text-white font-extrabold text-[11px]">
                      ₹{parseFloat(ev.starting_price).toLocaleString()} onwards
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onToggleFavorite(ev.id)}
                    className="p-2 text-pink-400 hover:text-pink-300"
                    title="Remove"
                  >
                    <Heart className="w-4 h-4 fill-pink-500" />
                  </button>

                  <button
                    onClick={() => {
                      onClose();
                      onBookNow(ev);
                    }}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-purple-600 text-white text-[11px] font-bold"
                  >
                    <span>Book</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
