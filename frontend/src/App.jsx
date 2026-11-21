import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { CategoryTabs } from './components/CategoryTabs';
import { TrendingEvents } from './components/TrendingEvents';
import { EventixAssistant } from './components/EventixAssistant';
import { FooterBanner } from './components/FooterBanner';

// Modals
import { BookingModal } from './components/BookingModal';
import { MyBookingsModal } from './components/MyBookingsModal';
import { EventDetailModal } from './components/EventDetailModal';
import { AdminDashboardModal } from './components/AdminDashboardModal';
import { AuthModal } from './components/AuthModal';
import { TrailerModal } from './components/TrailerModal';
import { FavoritesModal } from './components/FavoritesModal';

export function App() {
  const [activeNav, setActiveNav] = useState('home');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [events, setEvents] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [favorites, setFavorites] = useState([1, 2]); // Neon Nights and Anime Expo favorited by default
  const [darkMode, setDarkMode] = useState(true);

  // User state (default: logged in user 'Alex Morgan', can be toggled to 'admin' or 'guest')
  const [currentUser, setCurrentUser] = useState({
    role: 'user',
    name: 'Alex Morgan',
    email: 'alex@example.com',
    username: 'demo_user'
  });

  // Modals state
  const [bookingModalEvent, setBookingModalEvent] = useState(null);
  const [detailModalEvent, setDetailModalEvent] = useState(null);
  const [showMyBookings, setShowMyBookings] = useState(false);
  const [showFavorites, setShowFavorites] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [showContact, setShowContact] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [showTrailer, setShowTrailer] = useState(false);

  // Fetch events from Django backend
  const fetchEvents = async (category = 'all') => {
    try {
      setLoadingEvents(true);
      const url = category === 'all' ? '/api/events/' : `/api/events/?category=${category}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setEvents(data);
      }
    } catch (err) {
      console.error('Failed to load events:', err);
    } finally {
      setLoadingEvents(false);
    }
  };

  useEffect(() => {
    fetchEvents(selectedCategory);
  }, [selectedCategory]);

  const handleSelectCategory = (catId) => {
    setSelectedCategory(catId);
    if (catId !== 'all') {
      const section = document.getElementById('trending-section');
      section?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleToggleFavorite = (eventId) => {
    setFavorites((prev) =>
      prev.includes(eventId) ? prev.filter((id) => id !== eventId) : [...prev, eventId]
    );
  };

  const handleQuickRoleSwitch = async (role) => {
    try {
      const res = await fetch('/api/auth/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'quick_switch', role })
      });
      if (res.ok) {
        const data = await res.json();
        setCurrentUser(data);
      }
    } catch {
      // Local fallback
      setCurrentUser({
        role,
        name: role === 'admin' ? 'Administrator' : role === 'guest' ? 'Guest Visitor' : 'Alex Morgan',
        email: role === 'guest' ? '' : `${role}@eventix.in`
      });
    }
  };

  const handleBookNow = (event) => {
    setBookingModalEvent(event);
  };

  const handleViewDetails = (event) => {
    setDetailModalEvent(event);
  };

  return (
    <div className={`min-h-screen ${darkMode ? 'dark bg-[#0b0716]' : 'bg-[#0f0a1c]'} text-white relative selection:bg-purple-600 selection:text-white`}>
      {/* Background ambient lighting effects */}
      <div className="fixed top-0 left-1/4 w-[500px] h-[500px] bg-purple-700/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="fixed bottom-0 right-1/4 w-[600px] h-[600px] bg-indigo-700/10 rounded-full blur-[160px] pointer-events-none" />

      {/* 1. Header Navigation */}
      <Header
        activeNav={activeNav}
        setActiveNav={setActiveNav}
        currentUser={currentUser}
        onOpenAuth={() => setShowAuth(true)}
        onOpenAdmin={() => setShowAdmin(true)}
        onOpenMyBookings={() => setShowMyBookings(true)}
        onOpenFavorites={() => setShowFavorites(true)}
        onOpenAbout={() => setShowAbout(true)}
        onOpenContact={() => setShowContact(true)}
        onQuickRoleSwitch={handleQuickRoleSwitch}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
      />

      {/* Main Content Area */}
      <main className="relative z-10 pb-12">
        {/* 2. Hero Section */}
        <Hero
          onExploreClick={() => {
            const el = document.getElementById('trending-section');
            el?.scrollIntoView({ behavior: 'smooth' });
          }}
          onWatchTrailerClick={() => setShowTrailer(true)}
        />

        {/* 3. Category Tabs Bar */}
        <CategoryTabs
          selectedCategory={selectedCategory}
          onSelectCategory={handleSelectCategory}
        />

        {/* 4. Trending Events Section */}
        <TrendingEvents
          events={events}
          onBookNow={handleBookNow}
          onViewDetails={handleViewDetails}
          onToggleFavorite={handleToggleFavorite}
          favorites={favorites}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          sortBy={sortBy}
          setSortBy={setSortBy}
        />

        {/* 5. Footer Value Props & Newsletter */}
        <FooterBanner />
      </main>

      {/* 6. Eventix Assistant Chatbot (Docked Floating Widget) */}
      <EventixAssistant
        onBookEvent={handleBookNow}
        events={events}
        onOpenMyBookings={() => setShowMyBookings(true)}
        onOpenFavorites={() => setShowFavorites(true)}
        onOpenAdmin={() => setShowAdmin(true)}
        onExploreCatalog={() => {
          const el = document.getElementById('trending-section');
          el?.scrollIntoView({ behavior: 'smooth' });
        }}
      />

      {/* MODALS */}
      {bookingModalEvent && (
        <BookingModal
          event={bookingModalEvent}
          currentUser={currentUser}
          onClose={() => setBookingModalEvent(null)}
          onBookingSuccess={() => {
            fetchEvents(selectedCategory);
          }}
        />
      )}

      {detailModalEvent && (
        <EventDetailModal
          event={detailModalEvent}
          onClose={() => setDetailModalEvent(null)}
          onBookNow={handleBookNow}
        />
      )}

      {showMyBookings && (
        <MyBookingsModal
          currentUser={currentUser}
          onClose={() => setShowMyBookings(false)}
          onBookNew={() => {
            setShowMyBookings(false);
            const el = document.getElementById('trending-section');
            el?.scrollIntoView({ behavior: 'smooth' });
          }}
        />
      )}

      {showFavorites && (
        <FavoritesModal
          favorites={favorites}
          events={events}
          onClose={() => setShowFavorites(false)}
          onBookNow={handleBookNow}
          onToggleFavorite={handleToggleFavorite}
        />
      )}

      {showAbout && <AboutModal onClose={() => setShowAbout(false)} />}
      {showContact && <ContactModal onClose={() => setShowContact(false)} />}
      {showTrailer && <TrailerModal onClose={() => setShowTrailer(false)} />}

      {showAdmin && (
        <AdminDashboardModal
          onClose={() => setShowAdmin(false)}
          events={events}
          onRefreshEvents={() => fetchEvents(selectedCategory)}
        />
      )}

      {showAuth && (
        <AuthModal
          onClose={() => setShowAuth(false)}
          onLoginSuccess={(user) => setCurrentUser(user)}
          onQuickRoleSwitch={handleQuickRoleSwitch}
        />
      )}
    </div>
  );
}

export default App;
