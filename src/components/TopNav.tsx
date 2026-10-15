import React from 'react';
import { Navigation, Radio, Star, Route as RouteIcon, MapPin, Server } from 'lucide-react';

export type ActiveTab = 'stops' | 'map' | 'routes' | 'favorites' | 'api-docs';

interface TopNavProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  onLocateNearest: () => void;
  isLocating?: boolean;
}

export const TopNav: React.FC<TopNavProps> = ({
  activeTab,
  onTabChange,
  onLocateNearest,
  isLocating = false,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Brand Wordmark (Single text element) */}
        <button
          onClick={() => onTabChange('stops')}
          className="text-left flex items-center gap-2 group cursor-pointer"
        >
          <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white shadow-sm font-bold text-sm tracking-wider">
            SG
          </div>
          <div>
            <span className="text-base sm:text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0 group-hover:text-emerald-700 transition-colors">
              SG Bus Tracker
            </span>
          </div>
        </button>

        {/* Zone 2: Navigation Links (4-5 clean single-line links) */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
          <button
            onClick={() => onTabChange('stops')}
            className={`whitespace-nowrap shrink-0 hover:text-slate-900 transition-colors py-1 cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'stops' ? 'text-emerald-600 font-semibold border-b-2 border-emerald-600' : ''
            }`}
          >
            <Radio className="w-4 h-4" />
            <span>Live Stops</span>
          </button>

          <button
            onClick={() => onTabChange('map')}
            className={`whitespace-nowrap shrink-0 hover:text-slate-900 transition-colors py-1 cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'map' ? 'text-emerald-600 font-semibold border-b-2 border-emerald-600' : ''
            }`}
          >
            <Navigation className="w-4 h-4" />
            <span>Interactive Map</span>
          </button>

          <button
            onClick={() => onTabChange('routes')}
            className={`whitespace-nowrap shrink-0 hover:text-slate-900 transition-colors py-1 cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'routes' ? 'text-emerald-600 font-semibold border-b-2 border-emerald-600' : ''
            }`}
          >
            <RouteIcon className="w-4 h-4" />
            <span>Route Explorer</span>
          </button>

          <button
            onClick={() => onTabChange('favorites')}
            className={`whitespace-nowrap shrink-0 hover:text-slate-900 transition-colors py-1 cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'favorites' ? 'text-emerald-600 font-semibold border-b-2 border-emerald-600' : ''
            }`}
          >
            <Star className="w-4 h-4" />
            <span>Favorites</span>
          </button>

          <button
            onClick={() => onTabChange('api-docs')}
            className={`whitespace-nowrap shrink-0 hover:text-slate-900 transition-colors py-1 cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'api-docs' ? 'text-emerald-600 font-semibold border-b-2 border-emerald-600' : ''
            }`}
          >
            <Server className="w-4 h-4" />
            <span>Backend Scaffolding</span>
          </button>
        </nav>

        {/* Zone 3: 1 Primary Action */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={onLocateNearest}
            disabled={isLocating}
            className="px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 active:scale-95 transition-all shadow-xs flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <MapPin className="w-3.5 h-3.5 text-emerald-400" />
            <span className="whitespace-nowrap shrink-0">
              {isLocating ? 'Locating GPS...' : 'Nearest Stop'}
            </span>
          </button>
        </div>
      </div>

      {/* Mobile Tab Scroller (Single-line touch controls for mobile viewports) */}
      <div className="md:hidden flex items-center gap-2 px-4 py-2 border-t border-slate-100 overflow-x-auto no-scrollbar">
        <button
          onClick={() => onTabChange('stops')}
          className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap cursor-pointer transition-colors ${
            activeTab === 'stops' ? 'bg-emerald-50 text-emerald-800 font-semibold' : 'text-slate-600'
          }`}
        >
          Live Stops
        </button>
        <button
          onClick={() => onTabChange('map')}
          className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap cursor-pointer transition-colors ${
            activeTab === 'map' ? 'bg-emerald-50 text-emerald-800 font-semibold' : 'text-slate-600'
          }`}
        >
          Live Map
        </button>
        <button
          onClick={() => onTabChange('routes')}
          className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap cursor-pointer transition-colors ${
            activeTab === 'routes' ? 'bg-emerald-50 text-emerald-800 font-semibold' : 'text-slate-600'
          }`}
        >
          Routes
        </button>
        <button
          onClick={() => onTabChange('favorites')}
          className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap cursor-pointer transition-colors ${
            activeTab === 'favorites' ? 'bg-emerald-50 text-emerald-800 font-semibold' : 'text-slate-600'
          }`}
        >
          Favorites
        </button>
        <button
          onClick={() => onTabChange('api-docs')}
          className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap cursor-pointer transition-colors ${
            activeTab === 'api-docs' ? 'bg-emerald-50 text-emerald-800 font-semibold' : 'text-slate-600'
          }`}
        >
          Backend Setup
        </button>
      </div>
    </header>
  );
};
