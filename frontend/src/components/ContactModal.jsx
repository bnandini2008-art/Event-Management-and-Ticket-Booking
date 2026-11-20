import React from 'react';
import { X, Mail, Phone, MapPin, Headphones, MessageCircle } from 'lucide-react';

export function ContactModal({ onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-3xl glass-card border border-purple-500/40 shadow-2xl p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-purple-900/40">
          <div className="flex items-center gap-2">
            <Mail className="w-5 h-5 text-purple-400" />
            <h3 className="text-base font-bold text-white">Contact & Support</h3>
          </div>
          <button onClick={onClose} className="text-purple-300 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3 text-xs text-purple-200">
          <div className="flex items-start gap-3 p-3 rounded-2xl bg-[#1e1038]/60 border border-purple-500/20">
            <Headphones className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-white">24/7 Priority Support Hotline</p>
              <p className="text-purple-300 text-[11px] mt-0.5">+91 (044) 4800-EVENTIX / 1800-383-6849</p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-2xl bg-[#1e1038]/60 border border-purple-500/20">
            <Mail className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-white">Email Inquiries</p>
              <p className="text-purple-300 text-[11px] mt-0.5">support@eventix.in · bookings@eventix.in</p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-2xl bg-[#1e1038]/60 border border-purple-500/20">
            <MapPin className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-white">Headquarters</p>
              <p className="text-purple-300 text-[11px] mt-0.5">
                Eventix Tower, OMR IT Expressway, Taramani, Chennai, Tamil Nadu 600113
              </p>
            </div>
          </div>
        </div>

        <div className="pt-2 text-right">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-full bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
