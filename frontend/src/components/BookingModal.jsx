import React, { useState, useEffect } from 'react';
import { X, Clock, ShieldCheck, Ticket, CreditCard, QrCode, CheckCircle2, Download, Printer, AlertTriangle, ArrowRight } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import confetti from 'canvas-confetti';

export function BookingModal({ event, onClose, onBookingSuccess, currentUser }) {
  const [step, setStep] = useState(1); // 1: Select tickets, 2: Details & Pay, 3: Confirmation
  const [quantities, setQuantities] = useState({});
  const [customerName, setCustomerName] = useState(currentUser?.name || 'Alex Morgan');
  const [customerEmail, setCustomerEmail] = useState(currentUser?.email || 'alex@example.com');
  const [customerPhone, setCustomerPhone] = useState('+91 98765 43210');
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [cardNumber, setCardNumber] = useState('4532 •••• •••• 8892');
  const [cardExpiry, setCardExpiry] = useState('12/28');
  const [cardCvv, setCardCvv] = useState('789');
  const [upiId, setUpiId] = useState('alex@okaxis');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [confirmedBooking, setConfirmedBooking] = useState(null);

  // 10-Minute Hold Countdown Timer (SRS requirement)
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes

  useEffect(() => {
    // Initialize first tier quantity = 1
    if (event?.ticket_categories?.length > 0) {
      const initial = {};
      event.ticket_categories.forEach((tc, idx) => {
        initial[tc.id] = idx === 0 ? 1 : 0;
      });
      setQuantities(initial);
    }
  }, [event]);

  useEffect(() => {
    if (step === 2) {
      const timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            setErrorMsg('Reservation hold expired. Please reselect your tickets.');
            setStep(1);
            return 600;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [step]);

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleQuantityChange = (categoryId, delta) => {
    setQuantities((prev) => {
      const current = prev[categoryId] || 0;
      const tc = event.ticket_categories.find((c) => c.id === categoryId);
      const maxAvailable = tc?.available_quota || 10;
      const updated = Math.max(0, Math.min(maxAvailable, current + delta));
      return { ...prev, [categoryId]: updated };
    });
  };

  const calculateTotal = () => {
    if (!event?.ticket_categories) return 0;
    return event.ticket_categories.reduce((sum, tc) => {
      const qty = quantities[tc.id] || 0;
      return sum + tc.price * qty;
    }, 0);
  };

  const totalTickets = Object.values(quantities).reduce((a, b) => a + b, 0);
  const totalAmount = calculateTotal();

  const handleProceedToPayment = async () => {
    if (totalTickets === 0) {
      setErrorMsg('Please select at least 1 ticket to proceed.');
      return;
    }
    setErrorMsg('');
    setStep(2);
  };

  const handleConfirmPayment = async (e) => {
    e.preventDefault();
    if (!customerEmail || !customerName) {
      setErrorMsg('Name and email are required.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    const items = Object.entries(quantities)
      .filter(([_, qty]) => qty > 0)
      .map(([catId, qty]) => ({
        category_id: parseInt(catId),
        quantity: qty
      }));

    try {
      const res = await fetch('/api/bookings/confirm/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event_id: event.id,
          items,
          customer_name: customerName,
          customer_email: customerEmail,
          customer_phone: customerPhone,
          payment_method: paymentMethod
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to complete booking');
      }

      setConfirmedBooking(data);
      setStep(3);
      if (onBookingSuccess) onBookingSuccess(data);

      // Trigger Confetti!
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    } catch (err) {
      setErrorMsg(err.message || 'Payment simulation failed.');
    } finally {
      setLoading(false);
    }
  };

  const handlePrintTicket = () => {
    window.print();
  };

  const handleDownloadICS = () => {
    const icsData = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Eventix Platform//Event Calendar//EN
BEGIN:VEVENT
SUMMARY:${event.title}
LOCATION:${event.venue}, ${event.city}
DESCRIPTION:Eventix Booking Reference: ${confirmedBooking?.booking_reference}
STATUS:CONFIRMED
END:VEVENT
END:VCALENDAR`;

    const blob = new Blob([icsData], { type: 'text/calendar;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${event.slug}-ticket.ics`;
    a.click();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl rounded-3xl glass-card border border-purple-500/40 shadow-[0_20px_60px_rgba(0,0,0,0.9)] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-[#1e1038]/90 border-b border-purple-500/20 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Ticket className="w-5 h-5 text-purple-400" />
            <div>
              <h3 className="text-sm font-bold text-white tracking-wide">
                {step === 3 ? 'Booking Confirmed!' : `Book Tickets · ${event?.title}`}
              </h3>
              <p className="text-[10px] text-purple-300">
                {event?.venue} · ₹{parseFloat(event?.starting_price).toLocaleString()} onwards
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-purple-300 hover:text-white hover:bg-purple-800/40 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Hold Reservation Countdown Timer Banner (Step 2) */}
        {step === 2 && (
          <div className="px-6 py-2.5 bg-gradient-to-r from-purple-900/50 via-indigo-900/50 to-purple-900/50 border-b border-purple-500/30 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-purple-200 font-medium">
              <Clock className="w-4 h-4 text-amber-400 animate-spin" />
              <span>Tickets Reserved (Hold Active)</span>
            </div>
            <div className="font-mono font-bold text-amber-300 bg-black/40 px-3 py-1 rounded-full border border-amber-500/30">
              {formatTimer(timeLeft)}
            </div>
          </div>
        )}

        {/* Content Body */}
        <div className="p-6 max-h-[75vh] overflow-y-auto no-scrollbar">
          {errorMsg && (
            <div className="mb-4 p-3 rounded-2xl bg-red-950/60 border border-red-500/40 text-red-200 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* STEP 1: SELECT TICKET TIERS */}
          {step === 1 && (
            <div className="space-y-4">
              <p className="text-xs text-purple-200/80">
                Select your ticket tier and quantity below:
              </p>

              <div className="space-y-3">
                {event?.ticket_categories?.map((tc) => {
                  const qty = quantities[tc.id] || 0;
                  return (
                    <div
                      key={tc.id}
                      className="p-4 rounded-2xl bg-[#1e1038]/60 border border-purple-500/25 flex items-center justify-between gap-4"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-white">{tc.name}</h4>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-900/50 text-purple-300 font-mono">
                            {tc.available_quota} left
                          </span>
                        </div>
                        <p className="text-xs text-purple-300/70 mt-1">{tc.description}</p>
                        <p className="text-sm font-extrabold text-white mt-1.5">
                          ₹{parseFloat(tc.price).toLocaleString()}
                        </p>
                      </div>

                      {/* +/- Stepper */}
                      <div className="flex items-center gap-3 bg-[#100720] px-3 py-1.5 rounded-full border border-purple-500/30">
                        <button
                          type="button"
                          onClick={() => handleQuantityChange(tc.id, -1)}
                          disabled={qty <= 0}
                          className="w-6 h-6 rounded-full flex items-center justify-center text-purple-300 hover:text-white disabled:opacity-30 cursor-pointer"
                        >
                          -
                        </button>
                        <span className="text-xs font-bold text-white w-4 text-center">
                          {qty}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleQuantityChange(tc.id, 1)}
                          disabled={qty >= tc.available_quota}
                          className="w-6 h-6 rounded-full flex items-center justify-center text-purple-300 hover:text-white disabled:opacity-30 cursor-pointer"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Subtotal & Proceed */}
              <div className="mt-6 pt-4 border-t border-purple-900/40 flex items-center justify-between">
                <div>
                  <span className="text-xs text-purple-300 block">Total Amount</span>
                  <span className="text-xl font-extrabold text-white">
                    ₹{totalAmount.toLocaleString()}
                  </span>
                  <span className="text-[11px] text-purple-300/70 ml-2">
                    ({totalTickets} {totalTickets === 1 ? 'ticket' : 'tickets'})
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleProceedToPayment}
                  disabled={totalTickets === 0}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold text-xs shadow-[0_0_20px_rgba(147,51,234,0.5)] hover:brightness-110 active:scale-95 disabled:opacity-50 transition-all cursor-pointer"
                >
                  <span>Proceed to Pay</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: ATTENDEE DETAILS & SECURE PAYMENT */}
          {step === 2 && (
            <form onSubmit={handleConfirmPayment} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-purple-200 block mb-1">
                    Attendee Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-[#1e1038]/80 border border-purple-500/30 text-xs text-white focus:outline-none focus:border-purple-400"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-purple-200 block mb-1">
                    Email for E-Ticket Delivery
                  </label>
                  <input
                    type="email"
                    required
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-[#1e1038]/80 border border-purple-500/30 text-xs text-white focus:outline-none focus:border-purple-400"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-purple-200 block mb-1">
                  Mobile Number (SMS Updates)
                </label>
                <input
                  type="text"
                  required
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-[#1e1038]/80 border border-purple-500/30 text-xs text-white focus:outline-none focus:border-purple-400"
                />
              </div>

              {/* Payment Methods */}
              <div className="pt-2">
                <label className="text-[11px] font-semibold text-purple-200 block mb-2 flex items-center justify-between">
                  <span>Select Payment Gateway Mode (Sandbox)</span>
                  <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" /> 256-Bit SSL Encrypted
                  </span>
                </label>

                <div className="grid grid-cols-3 gap-2">
                  {['UPI', 'CARD', 'NETBANKING'].map((method) => (
                    <button
                      key={method}
                      type="button"
                      onClick={() => setPaymentMethod(method)}
                      className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                        paymentMethod === method
                          ? 'bg-purple-600 text-white border-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.5)]'
                          : 'bg-[#1e1038]/50 text-purple-300 border-purple-500/20 hover:bg-purple-900/30'
                      }`}
                    >
                      {method === 'UPI' && <QrCode className="w-3.5 h-3.5" />}
                      {method === 'CARD' && <CreditCard className="w-3.5 h-3.5" />}
                      <span>{method}</span>
                    </button>
                  ))}
                </div>

                {/* Method Specific Fields */}
                <div className="mt-3 p-3.5 rounded-2xl bg-[#140a25]/80 border border-purple-500/20 text-xs">
                  {paymentMethod === 'UPI' && (
                    <div className="space-y-2">
                      <p className="text-[11px] text-purple-300">Scan & Pay via any UPI App (GPay, PhonePe, Paytm):</p>
                      <input
                        type="text"
                        value={upiId}
                        onChange={(e) => setUpiId(e.target.value)}
                        placeholder="yourname@okaxis"
                        className="w-full px-3 py-1.5 rounded-lg bg-[#1e1038] border border-purple-500/30 text-white text-xs"
                      />
                    </div>
                  )}

                  {paymentMethod === 'CARD' && (
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={cardNumber}
                        onChange={(e) => setCardNumber(e.target.value)}
                        placeholder="Card Number"
                        className="w-full px-3 py-1.5 rounded-lg bg-[#1e1038] border border-purple-500/30 text-white text-xs font-mono"
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          value={cardExpiry}
                          onChange={(e) => setCardExpiry(e.target.value)}
                          placeholder="MM/YY"
                          className="w-full px-3 py-1.5 rounded-lg bg-[#1e1038] border border-purple-500/30 text-white text-xs font-mono"
                        />
                        <input
                          type="password"
                          value={cardCvv}
                          onChange={(e) => setCardCvv(e.target.value)}
                          placeholder="CVV"
                          maxLength={4}
                          className="w-full px-3 py-1.5 rounded-lg bg-[#1e1038] border border-purple-500/30 text-white text-xs font-mono"
                        />
                      </div>
                    </div>
                  )}

                  {paymentMethod === 'NETBANKING' && (
                    <p className="text-purple-300">
                      You will be securely routed to your bank's instant verification gateway.
                    </p>
                  )}
                </div>
              </div>

              {/* Total & Pay button */}
              <div className="mt-5 pt-3 border-t border-purple-900/40 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-xs text-purple-300 hover:text-white"
                >
                  ← Back to Tickets
                </button>

                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold text-xs shadow-[0_0_20px_rgba(147,51,234,0.6)] hover:brightness-110 active:scale-95 disabled:opacity-50 transition-all cursor-pointer"
                >
                  {loading ? (
                    <span>Authorizing Payment...</span>
                  ) : (
                    <span>Pay ₹{totalAmount.toLocaleString()} & Confirm</span>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* STEP 3: CONFIRMATION & E-TICKET WITH QR CODE */}
          {step === 3 && confirmedBooking && (
            <div className="space-y-5 text-center">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-400 mx-auto flex items-center justify-center text-emerald-400 shadow-[0_0_20px_rgba(52,211,153,0.5)]">
                <CheckCircle2 className="w-9 h-9" />
              </div>

              <div>
                <h3 className="text-xl font-bold text-white">Tickets Booked Successfully!</h3>
                <p className="text-xs text-purple-300 mt-1">
                  A confirmation email has been dispatched to{' '}
                  <span className="text-white font-medium">{confirmedBooking.customer_email}</span>.
                </p>
              </div>

              {/* Printable Ticket Card */}
              <div className="p-4 rounded-3xl bg-[#140a25] border border-purple-500/30 text-left shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-purple-600/10 rounded-full blur-2xl pointer-events-none" />

                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-purple-900/40 pb-4">
                  <div>
                    <span className="text-[10px] uppercase tracking-wider text-purple-400 font-bold block">
                      Booking Reference
                    </span>
                    <span className="text-base font-extrabold text-white font-mono">
                      {confirmedBooking.booking_reference}
                    </span>
                  </div>

                  <div className="p-2 bg-white rounded-xl shadow-md">
                    <QRCodeSVG
                      value={confirmedBooking.qr_code_data || confirmedBooking.booking_reference}
                      size={80}
                      level="H"
                    />
                  </div>
                </div>

                <div className="mt-3 space-y-1.5 text-xs text-purple-200">
                  <p>
                    <strong className="text-white">Event:</strong> {event.title}
                  </p>
                  <p>
                    <strong className="text-white">Venue:</strong> {event.venue}, {event.city}
                  </p>
                  <p>
                    <strong className="text-white">Attendee:</strong> {confirmedBooking.customer_name}
                  </p>
                  <p>
                    <strong className="text-white">Total Amount Paid:</strong> ₹
                    {parseFloat(confirmedBooking.total_amount).toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Actions: Print / Download ICS / Close */}
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={handlePrintTicket}
                  className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#1e1038] border border-purple-500/30 text-purple-200 hover:text-white text-xs font-semibold"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Ticket</span>
                </button>

                <button
                  type="button"
                  onClick={handleDownloadICS}
                  className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#1e1038] border border-purple-500/30 text-purple-200 hover:text-white text-xs font-semibold"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Add to Calendar (.ics)</span>
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-2 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-xs font-bold shadow-[0_0_15px_rgba(147,51,234,0.5)] cursor-pointer"
                >
                  Done
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
