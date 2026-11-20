import React, { useState, useEffect } from 'react';
import { X, Shield, Plus, Edit2, Trash2, BarChart3, Users, Ticket, IndianRupee, CheckCircle2, AlertCircle } from 'lucide-react';

export function AdminDashboardModal({ onClose, onRefreshEvents, events }) {
  const [activeTab, setActiveTab] = useState('stats'); // 'stats', 'events', 'bookings'
  const [stats, setStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [showEventForm, setShowEventForm] = useState(false);
  const [editingEventId, setEditingEventId] = useState(null);

  // Form State
  const [eventTitle, setEventTitle] = useState('');
  const [eventCategory, setEventCategory] = useState('concerts');
  const [eventBadge, setEventBadge] = useState('hot');
  const [eventVenue, setEventVenue] = useState('Chennai Indoor Stadium');
  const [eventCity, setEventCity] = useState('Chennai');
  const [eventDate, setEventDate] = useState('2026-12-25T19:00');
  const [eventStartingPrice, setEventStartingPrice] = useState(999);
  const [eventDescription, setEventDescription] = useState('');
  const [eventImage, setEventImage] = useState('/assets/neon_nights.jpg');

  // Ticket Tiers builder
  const [tier1Name, setTier1Name] = useState('General Admission');
  const [tier1Price, setTier1Price] = useState(999);
  const [tier1Quota, setTier1Quota] = useState(200);

  const [tier2Name, setTier2Name] = useState('VIP Pass');
  const [tier2Price, setTier2Price] = useState(1999);
  const [tier2Quota, setTier2Quota] = useState(50);

  const [formMsg, setFormMsg] = useState('');
  const [formError, setFormError] = useState('');

  const fetchStats = async () => {
    try {
      setLoadingStats(true);
      const res = await fetch('/api/admin/stats/');
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch {
      // fallback
    } finally {
      setLoadingStats(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleCreateOrUpdateEvent = async (e) => {
    e.preventDefault();
    setFormMsg('');
    setFormError('');

    const payload = {
      title: eventTitle,
      category: eventCategory,
      badge: eventBadge,
      venue: eventVenue,
      city: eventCity,
      start_date: eventDate,
      starting_price: eventStartingPrice,
      description: eventDescription || 'An exhilarating event hosted on Eventix.',
      banner_image: eventImage,
      ticket_tiers: [
        { name: tier1Name, price: tier1Price, quota: tier1Quota },
        { name: tier2Name, price: tier2Price, quota: tier2Quota }
      ]
    };

    try {
      const url = editingEventId ? `/api/events/${editingEventId}/` : '/api/events/';
      const method = editingEventId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(JSON.stringify(errData));
      }

      setFormMsg(editingEventId ? 'Event updated successfully!' : 'New event created successfully!');
      setShowEventForm(false);
      setEditingEventId(null);
      resetForm();
      fetchStats();
      if (onRefreshEvents) onRefreshEvents();
    } catch (err) {
      setFormError(err.message || 'Failed to save event');
    }
  };

  const handleDeleteEvent = async (id) => {
    if (!window.confirm('Are you sure you want to delete this event?')) return;
    try {
      const res = await fetch(`/api/events/${id}/`, { method: 'DELETE' });
      if (res.ok) {
        if (onRefreshEvents) onRefreshEvents();
        fetchStats();
      }
    } catch {
      //
    }
  };

  const resetForm = () => {
    setEventTitle('');
    setEventCategory('concerts');
    setEventBadge('hot');
    setEventVenue('Chennai Indoor Stadium');
    setEventCity('Chennai');
    setEventStartingPrice(999);
    setEventDescription('');
  };

  const handleEditClick = (ev) => {
    setEditingEventId(ev.id);
    setEventTitle(ev.title);
    setEventCategory(ev.category);
    setEventBadge(ev.badge || 'none');
    setEventVenue(ev.venue);
    setEventCity(ev.city);
    setEventStartingPrice(ev.starting_price);
    setEventDescription(ev.description);
    setEventImage(ev.banner_image);
    setShowEventForm(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl rounded-3xl glass-card border border-purple-500/40 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-[#1e1038]/95 border-b border-purple-500/20 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Shield className="w-5 h-5 text-amber-400" />
            <div>
              <h3 className="text-sm font-bold text-white tracking-wide">
                Admin Operations & Analytics Dashboard
              </h3>
              <p className="text-[10px] text-purple-300">
                Staff Control Center · IEEE 830 Eventix Management
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center text-purple-300 hover:text-white hover:bg-purple-800/40 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 py-2 bg-[#160b28]/80 border-b border-purple-900/40 flex items-center gap-4 text-xs font-semibold">
          <button
            onClick={() => { setActiveTab('stats'); setShowEventForm(false); }}
            className={`py-2 border-b-2 transition-all ${
              activeTab === 'stats'
                ? 'border-purple-400 text-white'
                : 'border-transparent text-purple-300/70 hover:text-white'
            }`}
          >
            Analytics & Reports
          </button>

          <button
            onClick={() => { setActiveTab('events'); setShowEventForm(false); }}
            className={`py-2 border-b-2 transition-all ${
              activeTab === 'events'
                ? 'border-purple-400 text-white'
                : 'border-transparent text-purple-300/70 hover:text-white'
            }`}
          >
            Events & Inventory ({events.length})
          </button>

          <button
            onClick={() => { setActiveTab('bookings'); setShowEventForm(false); }}
            className={`py-2 border-b-2 transition-all ${
              activeTab === 'bookings'
                ? 'border-purple-400 text-white'
                : 'border-transparent text-purple-300/70 hover:text-white'
            }`}
          >
            Recent Bookings ({stats?.recent_bookings?.length || 0})
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto no-scrollbar space-y-6">
          {formMsg && (
            <div className="p-3 rounded-2xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-200 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{formMsg}</span>
            </div>
          )}

          {formError && (
            <div className="p-3 rounded-2xl bg-red-950/60 border border-red-500/40 text-red-200 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {/* TAB 1: STATS & OVERVIEW */}
          {activeTab === 'stats' && (
            <div className="space-y-6">
              {/* Metric Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-4 rounded-2xl bg-[#1e1038]/70 border border-purple-500/30">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-purple-300">Total Revenue</span>
                    <IndianRupee className="w-4 h-4 text-emerald-400" />
                  </div>
                  <p className="text-xl font-extrabold text-white mt-2">
                    ₹{parseFloat(stats?.total_revenue || 0).toLocaleString()}
                  </p>
                  <span className="text-[10px] text-emerald-400">100% Verified</span>
                </div>

                <div className="p-4 rounded-2xl bg-[#1e1038]/70 border border-purple-500/30">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-purple-300">Bookings Made</span>
                    <Ticket className="w-4 h-4 text-purple-400" />
                  </div>
                  <p className="text-xl font-extrabold text-white mt-2">
                    {stats?.total_bookings || 0}
                  </p>
                  <span className="text-[10px] text-purple-300">Confirmed orders</span>
                </div>

                <div className="p-4 rounded-2xl bg-[#1e1038]/70 border border-purple-500/30">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-purple-300">Tickets Sold</span>
                    <BarChart3 className="w-4 h-4 text-pink-400" />
                  </div>
                  <p className="text-xl font-extrabold text-white mt-2">
                    {stats?.total_tickets_sold || 0}
                  </p>
                  <span className="text-[10px] text-pink-300">Across all categories</span>
                </div>

                <div className="p-4 rounded-2xl bg-[#1e1038]/70 border border-purple-500/30">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-purple-300">Active Events</span>
                    <Users className="w-4 h-4 text-blue-400" />
                  </div>
                  <p className="text-xl font-extrabold text-white mt-2">
                    {stats?.active_events || events.length}
                  </p>
                  <span className="text-[10px] text-blue-300">Live in catalog</span>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="p-5 rounded-2xl bg-[#1e1038]/40 border border-purple-500/20 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <h4 className="text-sm font-bold text-white">Create New Event or Ticket Tier</h4>
                  <p className="text-xs text-purple-300/80 mt-0.5">
                    Publish upcoming concerts, expos, and festivals with custom quotas and pricing.
                  </p>
                </div>
                <button
                  onClick={() => {
                    resetForm();
                    setEditingEventId(null);
                    setShowEventForm(true);
                    setActiveTab('events');
                  }}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-xs font-bold shadow-md hover:brightness-110 active:scale-95 transition-all cursor-pointer whitespace-nowrap"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create New Event</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: EVENTS MANAGEMENT & FORM */}
          {activeTab === 'events' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-white">
                  {showEventForm ? (editingEventId ? 'Edit Event' : 'Add New Event') : 'Active Events Catalog'}
                </h4>
                <button
                  onClick={() => {
                    setShowEventForm(!showEventForm);
                    if (showEventForm) setEditingEventId(null);
                  }}
                  className="flex items-center gap-1.5 text-xs text-purple-300 hover:text-white"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{showEventForm ? 'Cancel & View List' : 'Add New Event'}</span>
                </button>
              </div>

              {showEventForm ? (
                <form onSubmit={handleCreateOrUpdateEvent} className="p-5 rounded-2xl bg-[#160b28] border border-purple-500/30 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-semibold text-purple-200 block mb-1">Event Title</label>
                      <input
                        type="text"
                        required
                        value={eventTitle}
                        onChange={(e) => setEventTitle(e.target.value)}
                        placeholder="e.g. Neon Cyber Wave Live"
                        className="w-full px-3 py-2 rounded-xl bg-[#1e1038] border border-purple-500/30 text-white text-xs"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-purple-200 block mb-1">Category</label>
                      <select
                        value={eventCategory}
                        onChange={(e) => setEventCategory(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-[#1e1038] border border-purple-500/30 text-white text-xs"
                      >
                        <option value="concerts">Concerts</option>
                        <option value="conferences">Conferences</option>
                        <option value="festivals">Festivals</option>
                        <option value="exhibitions">Exhibitions</option>
                        <option value="sports">Sports</option>
                        <option value="workshops">Workshops</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-[11px] font-semibold text-purple-200 block mb-1">Venue</label>
                      <input
                        type="text"
                        required
                        value={eventVenue}
                        onChange={(e) => setEventVenue(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-[#1e1038] border border-purple-500/30 text-white text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-purple-200 block mb-1">City</label>
                      <input
                        type="text"
                        required
                        value={eventCity}
                        onChange={(e) => setEventCity(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-[#1e1038] border border-purple-500/30 text-white text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-purple-200 block mb-1">Badge Tag</label>
                      <select
                        value={eventBadge}
                        onChange={(e) => setEventBadge(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-[#1e1038] border border-purple-500/30 text-white text-xs"
                      >
                        <option value="hot">Hot</option>
                        <option value="trending">Trending</option>
                        <option value="limited">Limited Seats</option>
                        <option value="new">New</option>
                        <option value="none">None</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-semibold text-purple-200 block mb-1">Start Date & Time</label>
                      <input
                        type="datetime-local"
                        required
                        value={eventDate}
                        onChange={(e) => setEventDate(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-[#1e1038] border border-purple-500/30 text-white text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-purple-200 block mb-1">Starting Price (₹)</label>
                      <input
                        type="number"
                        required
                        value={eventStartingPrice}
                        onChange={(e) => setEventStartingPrice(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-[#1e1038] border border-purple-500/30 text-white text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-purple-200 block mb-1">Description</label>
                    <textarea
                      rows={2}
                      value={eventDescription}
                      onChange={(e) => setEventDescription(e.target.value)}
                      placeholder="Write an exciting overview..."
                      className="w-full px-3 py-2 rounded-xl bg-[#1e1038] border border-purple-500/30 text-white text-xs"
                    />
                  </div>

                  {/* Tier 1 & 2 Config */}
                  {!editingEventId && (
                    <div className="pt-2 border-t border-purple-900/40">
                      <p className="text-[11px] font-bold text-white mb-2">Configure Initial Ticket Tiers</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="p-3 bg-purple-950/40 rounded-xl space-y-2">
                          <input
                            type="text"
                            value={tier1Name}
                            onChange={(e) => setTier1Name(e.target.value)}
                            placeholder="Tier 1 Name"
                            className="w-full px-2 py-1 rounded bg-[#1e1038] text-xs text-white"
                          />
                          <div className="grid grid-cols-2 gap-2">
                            <input
                              type="number"
                              value={tier1Price}
                              onChange={(e) => setTier1Price(e.target.value)}
                              placeholder="Price (₹)"
                              className="px-2 py-1 rounded bg-[#1e1038] text-xs text-white"
                            />
                            <input
                              type="number"
                              value={tier1Quota}
                              onChange={(e) => setTier1Quota(e.target.value)}
                              placeholder="Quota"
                              className="px-2 py-1 rounded bg-[#1e1038] text-xs text-white"
                            />
                          </div>
                        </div>

                        <div className="p-3 bg-purple-950/40 rounded-xl space-y-2">
                          <input
                            type="text"
                            value={tier2Name}
                            onChange={(e) => setTier2Name(e.target.value)}
                            placeholder="Tier 2 Name"
                            className="w-full px-2 py-1 rounded bg-[#1e1038] text-xs text-white"
                          />
                          <div className="grid grid-cols-2 gap-2">
                            <input
                              type="number"
                              value={tier2Price}
                              onChange={(e) => setTier2Price(e.target.value)}
                              placeholder="Price (₹)"
                              className="px-2 py-1 rounded bg-[#1e1038] text-xs text-white"
                            />
                            <input
                              type="number"
                              value={tier2Quota}
                              onChange={(e) => setTier2Quota(e.target.value)}
                              placeholder="Quota"
                              className="px-2 py-1 rounded bg-[#1e1038] text-xs text-white"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="pt-3 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowEventForm(false)}
                      className="px-4 py-2 rounded-xl text-xs text-purple-300 hover:text-white"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold"
                    >
                      {editingEventId ? 'Save Changes' : 'Publish Event'}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-3">
                  {events.map((ev) => (
                    <div
                      key={ev.id}
                      className="p-4 rounded-2xl bg-[#1e1038]/50 border border-purple-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={ev.banner_image}
                          alt={ev.title}
                          className="w-14 h-14 rounded-xl object-cover border border-purple-400/40 shrink-0 filter contrast-110 saturate-120"
                          onError={(e) => {
                            e.target.src = '/assets/neon_nights_hd.jpg';
                          }}
                        />
                        <div>
                          <h5 className="font-bold text-white text-sm">{ev.title}</h5>
                          <p className="text-xs text-purple-300">
                            {ev.venue} · ₹{parseFloat(ev.starting_price).toLocaleString()} onwards
                          </p>
                          <div className="flex gap-2 text-[10px] text-purple-400 mt-1">
                            {ev.ticket_categories?.map((tc) => (
                              <span key={tc.id} className="bg-purple-950/40 px-1.5 py-0.5 rounded">
                                {tc.name}: {tc.available_quota} left
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center">
                        <button
                          onClick={() => handleEditClick(ev)}
                          className="p-2 rounded-xl bg-purple-900/40 text-purple-300 hover:text-white hover:bg-purple-800/50 transition-colors"
                          title="Edit Event"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteEvent(ev.id)}
                          className="p-2 rounded-xl bg-red-950/40 text-red-300 hover:text-red-100 hover:bg-red-800/50 transition-colors"
                          title="Delete Event"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: BOOKINGS MANAGEMENT */}
          {activeTab === 'bookings' && (
            <div className="space-y-3">
              <h4 className="text-sm font-bold text-white">System Bookings List</h4>
              {stats?.recent_bookings?.length === 0 ? (
                <p className="text-xs text-purple-300">No bookings recorded yet.</p>
              ) : (
                <div className="space-y-2.5">
                  {stats?.recent_bookings?.map((b) => (
                    <div
                      key={b.id}
                      className="p-3.5 rounded-2xl bg-[#1e1038]/60 border border-purple-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs"
                    >
                      <div>
                        <span className="font-mono text-purple-400 font-bold block text-[11px]">
                          {b.booking_reference}
                        </span>
                        <p className="font-semibold text-white mt-0.5">{b.event_title}</p>
                        <p className="text-purple-300/70 text-[11px]">
                          Customer: {b.customer_name} ({b.customer_email})
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          b.status === 'CANCELLED'
                            ? 'bg-red-500/20 text-red-300'
                            : 'bg-emerald-500/20 text-emerald-300'
                        }`}>
                          {b.status}
                        </span>
                        <span className="font-bold text-white">
                          ₹{parseFloat(b.total_amount).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
