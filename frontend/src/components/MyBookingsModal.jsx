import React, { useState, useEffect } from 'react';
import { X, Ticket, Calendar, MapPin, QrCode, AlertCircle, CheckCircle2, RotateCcw } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

export function MyBookingsModal({ onClose, currentUser, onBookNew }) {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [cancellingRef, setCancellingRef] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelSuccessMsg, setCancelSuccessMsg] = useState('');
  const [cancelErrorMsg, setCancelErrorMsg] = useState('');

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/bookings/my/?email=${encodeURIComponent(currentUser?.email || 'alex@example.com')}`);
      if (res.ok) {
        const data = await res.json();
        setBookings(data);
      }
    } catch {
      // fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [currentUser]);

  const handleCancelBooking = async (ref) => {
    try {
      setCancelErrorMsg('');
      const res = await fetch(`/api/bookings/${ref}/cancel/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: cancelReason || 'User requested cancellation' })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to cancel booking');
      }

      setCancelSuccessMsg(`Booking ${ref} cancelled successfully! 100% refund of ₹${parseFloat(data.booking.refund_amount).toLocaleString()} initiated.`);
      setCancellingRef(null);
      setCancelReason('');
      fetchBookings();
    } catch (err) {
      setCancelErrorMsg(err.message || 'Error processing cancellation');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl rounded-3xl glass-card border border-purple-500/40 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-[#1e1038]/90 border-b border-purple-500/20 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Ticket className="w-5 h-5 text-purple-400" />
            <h3 className="text-sm font-bold text-white tracking-wide">
              My Bookings & Tickets
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-purple-300 hover:text-white hover:bg-purple-800/40 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto no-scrollbar space-y-4">
          {cancelSuccessMsg && (
            <div className="p-3 rounded-2xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-200 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{cancelSuccessMsg}</span>
            </div>
          )}

          {cancelErrorMsg && (
            <div className="p-3 rounded-2xl bg-red-950/60 border border-red-500/40 text-red-200 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{cancelErrorMsg}</span>
            </div>
          )}

          {loading ? (
            <div className="text-center py-12 text-purple-300 text-xs animate-pulse">
              Loading your bookings...
            </div>
          ) : bookings.length === 0 ? (
            <div className="text-center py-12 glass-panel rounded-2xl space-y-3">
              <Ticket className="w-12 h-12 text-purple-500/40 mx-auto" />
              <p className="text-purple-200 text-sm font-semibold">No Bookings Found</p>
              <p className="text-purple-300/60 text-xs max-w-xs mx-auto">
                You haven't booked any event tickets yet. Explore trending concerts and festivals!
              </p>
              <button
                onClick={() => {
                  onClose();
                  if (onBookNew) onBookNew();
                }}
                className="mt-2 px-5 py-2 rounded-full bg-purple-600 text-white text-xs font-semibold hover:bg-purple-500 transition-colors"
              >
                Browse Events
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {bookings.map((booking) => {
                const isCancelled = booking.status === 'CANCELLED';

                return (
                  <div
                    key={booking.booking_reference}
                    className={`p-5 rounded-2xl border transition-all ${
                      isCancelled
                        ? 'bg-[#140a20]/40 border-purple-900/20 opacity-70'
                        : 'bg-[#1e1038]/60 border-purple-500/30 shadow-lg'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-purple-900/40 pb-3">
                      <div>
                        <span className="text-[10px] uppercase font-mono tracking-wider text-purple-400 font-bold">
                          REF: {booking.booking_reference}
                        </span>
                        <h4 className="text-base font-bold text-white mt-0.5">
                          {booking.event_title}
                        </h4>
                      </div>

                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            isCancelled
                              ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                              : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          }`}
                        >
                          {booking.status}
                        </span>

                        <span className="text-sm font-extrabold text-white">
                          ₹{parseFloat(booking.total_amount).toLocaleString()}
                        </span>
                      </div>
                    </div>

                    <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-purple-200/80">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                        <span>{new Date(booking.event_start_date).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                        <span className="truncate">{booking.event_venue}</span>
                      </div>
                    </div>

                    {/* Ticket Items Breakdown */}
                    <div className="mt-3 pt-2 text-[11px] text-purple-300/70 border-t border-purple-900/20 flex flex-wrap gap-2">
                      {booking.items?.map((item, idx) => (
                        <span key={idx} className="bg-purple-950/40 px-2 py-0.5 rounded-md border border-purple-800/30">
                          {item.ticket_category_name} x {item.quantity}
                        </span>
                      ))}
                    </div>

                    {/* Actions */}
                    <div className="mt-4 pt-3 border-t border-purple-900/40 flex items-center justify-between">
                      <button
                        onClick={() => setSelectedTicket(booking)}
                        className="flex items-center gap-1.5 text-xs font-semibold text-purple-300 hover:text-white transition-colors"
                      >
                        <QrCode className="w-3.5 h-3.5" />
                        <span>View E-Ticket & QR</span>
                      </button>

                      {!isCancelled && (
                        <button
                          onClick={() => setCancellingRef(booking.booking_reference)}
                          className="flex items-center gap-1 text-xs text-red-400 hover:text-red-300 hover:underline transition-colors"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>Cancel Booking (100% Refund)</span>
                        </button>
                      )}
                    </div>

                    {/* Cancellation confirmation box */}
                    {cancellingRef === booking.booking_reference && (
                      <div className="mt-4 p-3 rounded-xl bg-red-950/40 border border-red-500/30 text-xs space-y-2 animate-in fade-in">
                        <p className="font-semibold text-red-200">
                          Are you sure you want to cancel this booking?
                        </p>
                        <p className="text-[11px] text-red-300/80">
                          Full refund of ₹{parseFloat(booking.total_amount).toLocaleString()} will be automatically processed.
                        </p>
                        <input
                          type="text"
                          placeholder="Reason for cancellation (optional)"
                          value={cancelReason}
                          onChange={(e) => setCancelReason(e.target.value)}
                          className="w-full px-3 py-1.5 rounded-lg bg-black/60 border border-red-500/30 text-white text-xs"
                        />
                        <div className="flex items-center gap-2 pt-1">
                          <button
                            onClick={() => handleCancelBooking(booking.booking_reference)}
                            className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold text-xs"
                          >
                            Confirm Cancellation
                          </button>
                          <button
                            onClick={() => setCancellingRef(null)}
                            className="px-3 py-1.5 rounded-lg bg-purple-900/40 text-purple-200 text-xs"
                          >
                            Dismiss
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* View Ticket Modal Overlay */}
        {selectedTicket && (
          <div className="absolute inset-0 bg-black/90 p-6 z-20 flex flex-col items-center justify-center animate-in fade-in">
            <div className="w-full max-w-sm rounded-3xl bg-[#140a25] border border-purple-500/40 p-6 text-center space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-mono uppercase text-purple-400 font-bold">
                  {selectedTicket.booking_reference}
                </span>
                <button
                  onClick={() => setSelectedTicket(null)}
                  className="text-purple-300 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-3 bg-white rounded-2xl mx-auto w-fit shadow-lg">
                <QRCodeSVG
                  value={selectedTicket.qr_code_data || selectedTicket.booking_reference}
                  size={120}
                  level="H"
                />
              </div>

              <div>
                <h4 className="text-sm font-bold text-white">{selectedTicket.event_title}</h4>
                <p className="text-xs text-purple-300 mt-1">{selectedTicket.event_venue}</p>
                <p className="text-xs text-purple-200 mt-0.5">Attendee: {selectedTicket.customer_name}</p>
              </div>

              <button
                onClick={() => window.print()}
                className="w-full py-2 rounded-full bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold"
              >
                Print / Save PDF
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
