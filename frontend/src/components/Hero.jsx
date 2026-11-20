import React, { useState } from 'react';
import { ArrowRight, Play, ChevronLeft, ChevronRight, Mouse } from 'lucide-react';

export function Hero({ onExploreClick, onWatchTrailerClick }) {
  const [activeSlide, setActiveSlide] = useState(0);

  const slides = [
    {
      title: "Create Memories That Last",
      highlight: "Forever",
      subtitle: "Concerts. Conferences. Expos. Festivals & More — All in One Place.",
      tag: "More Than Just Events...",
    },
    {
      title: "Experience Unforgettable",
      highlight: "Moments",
      subtitle: "Join over 500,000 passionate event-goers across South India.",
      tag: "Live The Music & Magic...",
    },
    {
      title: "Discover Premier Shows &",
      highlight: "Exhibitions",
      subtitle: "From Anime Expo to Grand Tech Summits — Book your seats instantly.",
      tag: "Unrivalled Experiences...",
    }
  ];

  const nextSlide = () => setActiveSlide((prev) => (prev + 1) % slides.length);
  const prevSlide = () => setActiveSlide((prev) => (prev - 1 + slides.length) % slides.length);

  const cur = slides[activeSlide];

  return (
    <section className="relative w-full min-h-[480px] md:min-h-[560px] flex items-center overflow-hidden">
      {/* Background Anime Moon & Gothic Castle Atmosphere (High Vibrancy & Sharpness) */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <img
          src="/assets/hero_bg_hd.jpg"
          alt="Eventix Hero Atmosphere"
          className="w-full h-full object-cover object-top filter brightness-110 contrast-115 saturate-135 transition-all duration-700"
          onError={(e) => {
            // Fallback to enhanced master crop
            e.target.src = '/assets/hero_bg.jpg';
          }}
        />
        {/* Soft luminous vignette that keeps colors rich and punchy without dulling the artwork */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0b0716] via-transparent to-black/25" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0b0716]/80 via-transparent to-[#0b0716]/60" />
        <div className="absolute top-1/6 left-1/3 w-[500px] h-[500px] bg-purple-600/30 rounded-full blur-[140px] animate-pulse-glow" />
      </div>

      {/* Floating Vertical "Scroll Down" Indicator (Left Edge) */}
      <div className="hidden lg:flex absolute left-4 top-1/2 -translate-y-1/2 z-20 flex-col items-center gap-2">
        <div className="flex items-center gap-2 -rotate-90 origin-center text-[11px] tracking-widest text-purple-200/90 uppercase font-semibold py-2 drop-shadow-md">
          <Mouse className="w-3.5 h-3.5 rotate-90 text-purple-300" />
          <span>Scroll Down</span>
        </div>
      </div>

      {/* Hero Content Container */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-6 sm:px-12 py-12 flex flex-col justify-between">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Column: Headlines & Call to Actions */}
          <div className="lg:col-span-7 space-y-6">
            {/* Tagline */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-950/60 border border-purple-400/40 text-purple-200 text-xs tracking-wider shadow-[0_0_15px_rgba(168,85,247,0.4)] backdrop-blur-md">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-ping" />
              <span>{cur.tag}</span>
            </div>

            {/* Main Heading */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-white leading-tight tracking-tight drop-shadow-[0_4px_16px_rgba(0,0,0,0.8)]">
              {cur.title}{' '}
              <span className="font-script text-5xl sm:text-6xl md:text-7xl text-purple-300 text-glow-purple italic font-normal tracking-normal drop-shadow-[0_0_20px_rgba(192,132,252,0.9)]">
                {cur.highlight}
              </span>
            </h1>

            {/* Description */}
            <p className="text-sm sm:text-base text-purple-100/90 max-w-lg leading-relaxed drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
              {cur.subtitle}
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <button
                onClick={onExploreClick}
                className="group relative flex items-center gap-3 px-6 py-3 rounded-full bg-gradient-to-r from-purple-600 via-fuchsia-600 to-indigo-600 text-white font-semibold text-sm shadow-[0_0_30px_rgba(147,51,234,0.7)] border border-purple-300/50 hover:brightness-125 active:scale-95 transition-all duration-200 cursor-pointer"
              >
                <span>Explore Events</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                onClick={onWatchTrailerClick}
                className="flex items-center gap-2.5 px-6 py-3 rounded-full bg-[#1e1038]/85 border border-purple-400/40 text-purple-100 hover:text-white hover:bg-purple-900/60 font-medium text-sm transition-all duration-200 backdrop-blur-md cursor-pointer shadow-[0_0_20px_rgba(147,51,234,0.3)]"
              >
                <div className="w-5 h-5 rounded-full bg-purple-500/30 flex items-center justify-center border border-purple-400/50">
                  <Play className="w-2.5 h-2.5 text-purple-200 fill-purple-200 ml-0.5" />
                </div>
                <span>Watch Trailer</span>
              </button>
            </div>

            {/* Social Proof: Happy Attendees */}
            <div className="flex items-center gap-4 pt-3">
              <div className="flex -space-x-2">
                {[1, 2, 3, 4].map((i) => (
                  <img
                    key={i}
                    src="/assets/user_avatar_hd.jpg"
                    alt="Attendee"
                    className="w-8 h-8 rounded-full border-2 border-[#160b28] object-cover ring-2 ring-purple-400/80 shadow-[0_0_10px_rgba(168,85,247,0.4)] filter contrast-110 brightness-105"
                    onError={(e) => {
                      e.target.src = '/assets/user_avatar.jpg';
                    }}
                  />
                ))}
              </div>
              <div className="text-xs">
                <span className="font-extrabold text-white text-sm block drop-shadow">500K+</span>
                <span className="text-purple-200/90 font-medium">Happy Attendees</span>
              </div>
            </div>
          </div>

          {/* Right Column: Decorative Neon Script */}
          <div className="lg:col-span-5 relative flex justify-end items-start min-h-[140px] pointer-events-none">
            <div className="text-right">
              <span className="font-script text-4xl sm:text-5xl md:text-6xl text-purple-200 text-glow-purple block -rotate-6 select-none drop-shadow-[0_0_20px_rgba(192,132,252,0.9)]">
                Live
              </span>
              <span className="font-script text-4xl sm:text-5xl md:text-6xl text-pink-200 text-glow-pink block -rotate-6 select-none -mt-2 drop-shadow-[0_0_20px_rgba(236,72,153,0.9)]">
                The Moment
              </span>
            </div>
          </div>
        </div>

        {/* Carousel Slider Controls */}
        <div className="flex items-center justify-center gap-4 mt-8">
          <button
            onClick={prevSlide}
            aria-label="Previous Slide"
            className="w-8 h-8 rounded-full flex items-center justify-center border border-purple-500/40 bg-[#160b28]/80 text-purple-200 hover:text-white hover:border-purple-300 transition-colors shadow-md"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2">
            {slides.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setActiveSlide(idx)}
                aria-label={`Slide ${idx + 1}`}
                className={`transition-all duration-300 ${
                  activeSlide === idx
                    ? 'w-8 h-2 bg-gradient-to-r from-purple-400 to-fuchsia-400 rounded-full shadow-[0_0_15px_rgba(168,85,247,0.9)]'
                    : 'w-2 h-2 bg-purple-900/70 hover:bg-purple-600/70 rounded-full'
                }`}
              />
            ))}
          </div>

          <button
            onClick={nextSlide}
            aria-label="Next Slide"
            className="w-8 h-8 rounded-full flex items-center justify-center border border-purple-500/40 bg-[#160b28]/80 text-purple-200 hover:text-white hover:border-purple-300 transition-colors shadow-md"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </section>
  );
}
