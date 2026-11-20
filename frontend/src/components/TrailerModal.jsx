import React from 'react';
import { X, Play } from 'lucide-react';

export function TrailerModal({ onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl rounded-3xl glass-card border border-purple-500/40 shadow-2xl overflow-hidden p-2">
        <div className="flex items-center justify-between p-3 border-b border-purple-900/30">
          <div className="flex items-center gap-2 text-white font-bold text-sm">
            <Play className="w-4 h-4 text-purple-400 fill-purple-400" />
            <span>Eventix Official Trailer · Neon Nights & Anime Expo 2026</span>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full flex items-center justify-center text-purple-300 hover:text-white hover:bg-purple-800/40"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="relative aspect-video w-full rounded-2xl overflow-hidden mt-2 bg-black flex items-center justify-center">
          <iframe
            className="w-full h-full"
            src="https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?autoplay=1&mute=0"
            title="Eventix Official Trailer"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      </div>
    </div>
  );
}
