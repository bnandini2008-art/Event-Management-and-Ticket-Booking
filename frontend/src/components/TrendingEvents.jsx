import React, { useState } from 'react';
import { Sparkles, Calendar, MapPin, Heart, ArrowRight, Flame, Zap, Clock, Search } from 'lucide-react';

export function TrendingEvents({
  events,
  onBookNow,
  onViewDetails,
  onToggleFavorite,
  favorites,
  searchQuery,
  setSearchQuery,
  sortBy,
  setSortBy
}) {
  const [showAllEvents, setShowAllEvents] = useState(false);

  // Filter events
  let displayedEvents = [...events];
  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase();
    displayedEvents = displayedEvents.filter(
      (e) =>
        e.title.toLowerCase().includes(q) ||
        e.venue.toLowerCase().includes(q) ||
        e.category.toLowerCase().includes(q)
    );
  }

  // Limit to 3 cards for exact replica layout unless "View All" is toggled or user is searching
  const isLimited = !showAllEvents && !searchQuery.trim();
  const visibleCards = isLimited ? displayedEvents.slice(0, 3) : displayedEvents;

  const renderBadge = (badge) => {
    switch (badge?.toLowerCase()) {
      case 'hot':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-gradient-to-r from-red-500 to-orange-500 text-white shadow-[0_0_15px_rgba(239,68,68,0.7)] border border-red-300/50">
            <Flame className="w-3 h-3 fill-white" />
            <span>Hot</span>
          </span>
        );
      case 'trending':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-gradient-to-r from-purple-500 to-fuchsia-500 text-white shadow-[0_0_15px_rgba(168,85,247,0.7)] border border-purple-300/50">
            <Zap className="w-3 h-3 fill-white" />
            <span>Trending</span>
          </span>
        );
      case 'limited':
      case 'limited seats':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-gradient-to-r from-amber-500 to-yellow-500 text-white shadow-[0_0_15px_rgba(245,158,11,0.7)] border border-amber-300/50">
            <Clock className="w-3 h-3" />
            <span>Limited Seats</span>
          </span>
        );
      default:
        return null;
    }
  };

  const formatPrice = (price) => {
    const p = parseFloat(price);
    if (!isNaN(p)) {
      return p % 1 === 0 ? p.toLocaleString('en-IN') : p.toFixed(2);
    }
    return price;
  };

  const formatDate = (dateString) => {
    try {
      const d = new Date(dateString);
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const month = months[d.getMonth()];
      const day = d.getDate();
      const year = d.getFullYear();
      let hours = d.getHours();
      const minutes = d.getMinutes();
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12 || 12;
      const minStr = minutes < 10 ? `0${minutes}` : minutes;
      return `${month} ${day}, ${year} • ${hours}:${minStr} ${ampm}`;
    } catch {
      return dateString;
    }
  };

  // Helper to prioritize high-def renders
  const getHighDefImage = (title, defaultUrl) => {
    if (defaultUrl) return defaultUrl;
    const t = title.toLowerCase();
    if (t.includes('neon nights')) return '/assets/neon_nights_hd.jpg';
    if (t.includes('anime expo')) return '/assets/anime_expo_hd.jpg';
    if (t.includes('music festival')) return '/assets/music_festival_hd.jpg';
    if (t.includes('cybertech')) return '/assets/cybertech_summit_hd.jpg';
    if (t.includes('cosmic light')) return '/assets/cosmic_light_hd.jpg';
    if (t.includes('pro gaming')) return '/assets/pro_gaming_hd.jpg';
    if (t.includes('workshop')) return '/assets/genai_workshop_hd.jpg';
    return '/assets/neon_nights_hd.jpg';
  };

  return (
    <section id="trending-section" className="w-full max-w-7xl mx-auto px-6 sm:px-12 py-6">
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-400 drop-shadow-[0_0_10px_rgba(168,85,247,0.8)]" />
          <h2 className="text-2xl font-bold text-white tracking-wide drop-shadow">
            Trending Events
          </h2>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          {/* Live Search */}
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 text-purple-300 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search concerts, expos..."
              className="w-full pl-9 pr-3 py-1.5 rounded-full bg-[#160b28]/80 border border-purple-400/40 text-xs text-white placeholder-purple-300/50 focus:outline-none focus:border-purple-300 backdrop-blur-md shadow-inner"
            />
          </div>

          <button
            onClick={() => setShowAllEvents(!showAllEvents)}
            className="flex items-center gap-1 text-xs font-semibold text-purple-300 hover:text-white transition-colors cursor-pointer whitespace-nowrap"
          >
            <span>{showAllEvents ? 'Show Less' : 'View All'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Event Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {visibleCards.map((event) => {
          const isFav = favorites.includes(event.id);
          const hdImage = getHighDefImage(event.title, event.banner_image);

          return (
            <div
              key={event.id}
              className="glass-card rounded-2xl overflow-hidden flex flex-col justify-between group border border-purple-500/30 hover:border-purple-400/60 shadow-[0_8px_30px_rgba(0,0,0,0.6)]"
            >
              {/* Card Image & Badges */}
              <div 
                onClick={() => onViewDetails(event)}
                className="relative h-48 overflow-hidden cursor-pointer bg-[#140a25]"
              >
                <img
                  src={hdImage}
                  alt={event.title}
                  className="w-full h-full object-cover filter contrast-115 saturate-130 brightness-105 group-hover:scale-105 transition-all duration-500"
                  onError={(e) => {
                    e.target.src = event.banner_image;
                  }}
                />
                {/* Subtle bottom vignette to ensure readability without muddying the artwork */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#100820] via-transparent to-transparent opacity-60" />

                {/* Top Badges */}
                <div className="absolute top-3 left-3 flex items-center gap-2">
                  {renderBadge(event.badge)}
                </div>

                {/* Favorite Heart Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleFavorite(event.id);
                  }}
                  title={isFav ? "Remove Favorite" : "Add to Favorites"}
                  className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/50 backdrop-blur-md border border-white/30 flex items-center justify-center text-white hover:text-pink-400 hover:scale-110 active:scale-95 transition-all shadow-md"
                >
                  <Heart className={`w-4 h-4 ${isFav ? 'text-pink-500 fill-pink-500' : 'text-white'}`} />
                </button>
              </div>

              {/* Card Body */}
              <div className="p-5 flex-1 flex flex-col justify-between bg-gradient-to-b from-[#180c30]/90 to-[#0f071e]/95">
                <div>
                  <h3 
                    onClick={() => onViewDetails(event)}
                    className="text-lg font-bold text-white hover:text-purple-300 transition-colors cursor-pointer line-clamp-1 drop-shadow"
                  >
                    {event.title}
                  </h3>

                  <div className="mt-2.5 space-y-1.5 text-xs text-purple-200/85">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                      <span className="line-clamp-1 font-medium">{formatDate(event.start_date)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                      <span className="line-clamp-1 font-medium">{event.venue}</span>
                    </div>
                  </div>
                </div>

                {/* Bottom Row: Price & Book Now */}
                <div className="mt-5 pt-3 border-t border-purple-900/40 flex items-center justify-between">
                  <div>
                    <span className="text-lg font-extrabold text-white text-glow-purple">
                      ₹{formatPrice(event.starting_price)}
                    </span>
                    <span className="text-[11px] text-purple-300/80 ml-1 font-medium">
                      onwards
                    </span>
                  </div>

                  <button
                    onClick={() => onBookNow(event)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-gradient-to-r from-purple-600 via-purple-700 to-indigo-600 text-white font-semibold text-xs shadow-[0_0_20px_rgba(147,51,234,0.5)] hover:shadow-[0_0_25px_rgba(147,51,234,0.8)] border border-purple-400/40 hover:brightness-115 active:scale-95 transition-all cursor-pointer"
                  >
                    <span>Book Now</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {visibleCards.length === 0 && (
        <div className="text-center py-12 glass-panel rounded-2xl">
          <p className="text-purple-300 text-sm">No events found matching your search.</p>
        </div>
      )}
    </section>
  );
}
