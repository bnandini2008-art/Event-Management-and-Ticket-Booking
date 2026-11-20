import React from 'react';
import { Star, Music, Mic, Sparkles, Box, Trophy, Laptop, MoreHorizontal } from 'lucide-react';

export function CategoryTabs({ selectedCategory, onSelectCategory }) {
  const categories = [
    { id: 'all', label: 'All Events', icon: Star },
    { id: 'concerts', label: 'Concerts', icon: Music },
    { id: 'conferences', label: 'Conferences', icon: Mic },
    { id: 'festivals', label: 'Festivals', icon: Sparkles },
    { id: 'exhibitions', label: 'Exhibitions', icon: Box },
    { id: 'sports', label: 'Sports', icon: Trophy },
    { id: 'workshops', label: 'Workshops', icon: Laptop },
    { id: 'more', label: 'More', icon: MoreHorizontal },
  ];

  return (
    <div className="w-full max-w-7xl mx-auto px-6 sm:px-12 my-6">
      <div className="relative overflow-x-auto no-scrollbar py-2">
        <div className="inline-flex items-center min-w-full justify-between sm:justify-start gap-1 p-1.5 rounded-full bg-[#160b28]/80 border border-purple-500/20 backdrop-blur-md shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
          {categories.map((cat, idx) => {
            const Icon = cat.icon;
            const isSelected = selectedCategory === cat.id;

            return (
              <React.Fragment key={cat.id}>
                <button
                  onClick={() => onSelectCategory(cat.id)}
                  className={`flex items-center gap-2 px-5 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-200 cursor-pointer ${
                    isSelected
                      ? 'bg-gradient-to-r from-purple-600 via-purple-700 to-indigo-600 text-white shadow-[0_0_20px_rgba(147,51,234,0.7)] border border-purple-400/50'
                      : 'text-purple-200/70 hover:text-white hover:bg-purple-900/30'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-purple-400'}`} />
                  <span>{cat.label}</span>
                </button>
                {/* Subtle vertical separator */}
                {idx < categories.length - 1 && (
                  <div className="hidden lg:block w-[1px] h-4 bg-purple-900/40" />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
}
