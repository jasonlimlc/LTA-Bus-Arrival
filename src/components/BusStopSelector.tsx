import React, { useState } from 'react';
import { BusStop } from '../types/bus';
import { MRT_LINE_COLORS } from '../data/singaporeBuses';
import { Search, MapPin, Star, Compass, Check, ArrowRight } from 'lucide-react';

interface BusStopSelectorProps {
  stops: BusStop[];
  selectedStop: BusStop | null;
  onSelectStop: (stop: BusStop) => void;
  userCoords: { lat: number; lng: number } | null;
  onSimulateLocation: (name: string, lat: number, lng: number) => void;
  favoriteStops: string[];
  onToggleFavoriteStop: (stopCode: string) => void;
}

export const BusStopSelector: React.FC<BusStopSelectorProps> = ({
  stops,
  selectedStop,
  onSelectStop,
  userCoords,
  onSimulateLocation,
  favoriteStops,
  onToggleFavoriteStop,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeRegion, setActiveRegion] = useState<string>('all');

  const REGIONS = [
    { id: 'all', label: 'All Stops' },
    { id: 'orchard', label: 'Orchard & Somerset' },
    { id: 'city', label: 'Downtown & Marina' },
    { id: 'east', label: 'Tampines & Bedok' },
    { id: 'west', label: 'Jurong & Clementi' },
    { id: 'north', label: 'Woodlands & Bishan' },
  ];

  const SIMULATION_PRESETS = [
    { name: 'Orchard Rd', lat: 1.3045, lng: 103.8328 },
    { name: 'Raffles Place', lat: 1.2863, lng: 103.8531 },
    { name: 'Tampines Int', lat: 1.3533, lng: 103.9452 },
    { name: 'Jurong East', lat: 1.3337, lng: 103.7422 },
  ];

  const filteredStops = stops.filter((stop) => {
    const q = searchTerm.toLowerCase().trim();
    const matchesQuery =
      !q ||
      stop.code.includes(q) ||
      stop.name.toLowerCase().includes(q) ||
      stop.road.toLowerCase().includes(q) ||
      stop.services.some((s) => s.toLowerCase() === q);

    if (!matchesQuery) return false;

    if (activeRegion === 'orchard') {
      return ['09048', '09047', '08121', '08057', '08031'].includes(stop.code);
    }
    if (activeRegion === 'city') {
      return ['03218', '04121', '02151', '02149', '01113', '03222', '05013'].includes(stop.code);
    }
    if (activeRegion === 'east') {
      return ['75009', '84009', '95129'].includes(stop.code);
    }
    if (activeRegion === 'west') {
      return ['20019', '17009'].includes(stop.code);
    }
    if (activeRegion === 'north') {
      return ['54009', '46009', '14141'].includes(stop.code);
    }

    return true;
  });

  return (
    <div className="space-y-4">
      {/* Search Input Box */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search 5-digit code (e.g. 09048), road, or stop name..."
          className="w-full pl-10 pr-10 py-3 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 shadow-2xs transition-all placeholder:text-slate-400 font-medium"
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-full w-5 h-5 flex items-center justify-center cursor-pointer"
          >
            ×
          </button>
        )}
      </div>

      {/* Quick Region Selector Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
        {REGIONS.map((region) => (
          <button
            key={region.id}
            onClick={() => setActiveRegion(region.id)}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap font-medium cursor-pointer transition-all ${
              activeRegion === region.id
                ? 'bg-slate-900 text-white shadow-2xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
            }`}
          >
            {region.label}
          </button>
        ))}
      </div>

      {/* Simulated GPS Location Bar */}
      <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-xl p-3 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2 text-emerald-950 font-medium">
          <Compass className="w-3.5 h-3.5 text-emerald-600" />
          <span>Simulate GPS location:</span>
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          {SIMULATION_PRESETS.map((preset) => (
            <button
              key={preset.name}
              onClick={() => onSimulateLocation(preset.name, preset.lat, preset.lng)}
              className="px-2.5 py-1 bg-white hover:bg-emerald-100/60 text-emerald-900 border border-emerald-200 rounded-md font-semibold text-[11px] cursor-pointer transition-colors"
            >
              {preset.name}
            </button>
          ))}
        </div>
      </div>

      {/* Stop List Display */}
      <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
        {filteredStops.length === 0 ? (
          <div className="text-center py-10 bg-white border border-dashed border-slate-200 rounded-2xl p-6">
            <MapPin className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-700">No bus stops found</p>
            <p className="text-xs text-slate-500 mt-1">Try searching by 5-digit code or clearing filters</p>
          </div>
        ) : (
          filteredStops.map((stop) => {
            const isSelected = selectedStop?.code === stop.code;
            const isFav = favoriteStops.includes(stop.code);

            return (
              <div
                key={stop.code}
                onClick={() => onSelectStop(stop)}
                className={`group p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                  isSelected
                    ? 'bg-emerald-50/80 border-emerald-500 shadow-xs'
                    : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/70'
                }`}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    {/* 5-digit Stop Code */}
                    <span className="font-mono font-bold text-xs bg-slate-900 text-white px-2 py-0.5 rounded-md tracking-wider">
                      {stop.code}
                    </span>

                    {/* MRT Lines Badges */}
                    {stop.mrtLines && stop.mrtLines.length > 0 && (
                      <div className="flex items-center gap-1">
                        {stop.mrtLines.map((line) => {
                          const config = MRT_LINE_COLORS[line];
                          return (
                            <span
                              key={line}
                              className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                              style={{ backgroundColor: config?.bg, color: config?.text }}
                              title={`${config?.name} (${stop.mrtStationName})`}
                            >
                              {line}
                            </span>
                          );
                        })}
                      </div>
                    )}

                    {/* Distance from simulated/actual user location */}
                    {stop.distanceMeters !== undefined && (
                      <span className="text-[11px] font-mono text-emerald-700 font-semibold ml-auto">
                        {stop.distanceMeters < 1000
                          ? `${stop.distanceMeters}m`
                          : `${(stop.distanceMeters / 1000).toFixed(1)}km`}
                      </span>
                    )}
                  </div>

                  <h4 className="text-sm font-bold text-slate-900 group-hover:text-emerald-700 transition-colors truncate">
                    {stop.name}
                  </h4>
                  <p className="text-xs text-slate-500 truncate mt-0.5">
                    {stop.road}
                  </p>

                  {/* List of bus services available */}
                  <div className="flex items-center gap-1 mt-2 flex-wrap">
                    <span className="text-[10px] text-slate-400 font-medium">Buses:</span>
                    {stop.services.slice(0, 7).map((svc) => (
                      <span
                        key={svc}
                        className="font-mono text-[10px] font-semibold text-slate-600 bg-slate-100 px-1.5 py-0.2 rounded"
                      >
                        {svc}
                      </span>
                    ))}
                    {stop.services.length > 7 && (
                      <span className="text-[10px] text-slate-400">+{stop.services.length - 7} more</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleFavoriteStop(stop.code);
                    }}
                    title={isFav ? 'Remove stop from favorites' : 'Star this stop'}
                    className={`p-2 rounded-lg cursor-pointer transition-colors ${
                      isFav ? 'text-amber-500 hover:text-amber-600' : 'text-slate-300 hover:text-slate-500'
                    }`}
                  >
                    <Star className={`w-4 h-4 ${isFav ? 'fill-amber-400 text-amber-400' : ''}`} />
                  </button>

                  <div className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors ${
                    isSelected ? 'bg-emerald-600 text-white' : 'text-slate-400 group-hover:text-slate-700'
                  }`}>
                    {isSelected ? <Check className="w-4 h-4" /> : <ArrowRight className="w-3.5 h-3.5" />}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
