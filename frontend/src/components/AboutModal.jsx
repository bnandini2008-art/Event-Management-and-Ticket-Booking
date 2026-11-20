import React from 'react';
import { X, Sparkles, CheckCircle2, ShieldCheck, Cpu } from 'lucide-react';

export function AboutModal({ onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl rounded-3xl glass-card border border-purple-500/40 shadow-2xl p-6 max-h-[85vh] overflow-y-auto no-scrollbar space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-purple-900/40">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-400" />
            <h3 className="text-base font-bold text-white">About Eventix</h3>
          </div>
          <button onClick={onClose} className="text-purple-300 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3 text-xs text-purple-200/90 leading-relaxed">
          <p>
            <strong className="text-white">Eventix</strong> is a next-generation event discovery and ticket reservation system engineered to deliver seamless ticketing experiences for concerts, conferences, anime expos, festivals, and cultural gatherings.
          </p>

          <div className="p-4 rounded-2xl bg-[#1e1038]/60 border border-purple-500/20 space-y-2">
            <h4 className="font-bold text-white text-xs flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>IEEE 830 / ISO/IEC/IEEE 29148 Standard Compliance</span>
            </h4>
            <p className="text-[11px] text-purple-300">
              Developed strictly to IEEE 830 functional and non-functional requirements specifications:
            </p>
            <ul className="list-disc list-inside text-[11px] space-y-1 text-purple-200">
              <li>Atomic database transactions with row-level locks for inventory consistency.</li>
              <li>10-Minute temporary ticket hold reservation mechanism.</li>
              <li>PCI DSS compliant checkout gateway simulation.</li>
              <li>Role-based access control (User, Admin, Guest).</li>
            </ul>
          </div>

          <div className="p-4 rounded-2xl bg-[#1e1038]/60 border border-purple-500/20 space-y-2">
            <h4 className="font-bold text-white text-xs flex items-center gap-1.5">
              <Cpu className="w-4 h-4 text-purple-400" />
              <span>Gemini AI Enquiry Concierge</span>
            </h4>
            <p className="text-[11px] text-purple-300">
              Integrated with Google Gemini AI to provide real-time information regarding schedules, prices, venues, and policies without altering core financial transaction boundaries.
            </p>
          </div>
        </div>

        <div className="pt-2 text-right">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-full bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
