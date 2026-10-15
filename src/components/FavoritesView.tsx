import React from 'react';
import { BusStop, BusServiceArrival } from '../types/bus';
import { BUS_STOPS } from '../data/singaporeBuses';
import { Star, MapPin, Bus, Trash2, ArrowRight } from 'lucide-react';

interface FavoritesViewProps {
  favoriteStops: string[];
  favoriteServices: string[];
  onSelectStopCode: (code: string) => void;
  onRemoveFavoriteStop: (code: string) => void;
  onRemoveFavoriteService: (serviceNo: string) => void;
}

export const FavoritesView: React.FC<FavoritesViewProps> = ({
  favoriteStops,
  favoriteServices,
  onSelectStopCode,
  onRemoveFavoriteStop,
  onRemoveFavoriteService,
}) => {
  const stops = BUS_STOPS.filter((s) => favoriteStops.includes(s.code));

  const hasAnyFavorites = favoriteStops.length > 0 || favoriteServices.length > 0;

  if (!hasAnyFavorites) {
    return (
      <div className="bg-white border border-dashed border-slate-300 rounded-2xl p-12 text-center max-w-lg mx-auto">
        <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-500 flex items-center justify-center mx-auto mb-3">
          <Star className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-slate-900">No Starred Favorites Yet</h3>
        <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
          Tap the star icon on any bus stop or bus arrival card to quickly access your daily commute timings here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Starred Bus Stops */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-emerald-600" />
            <span>Saved Bus Stops ({stops.length})</span>
          </h3>
        </div>

        {stops.length === 0 ? (
          <p className="text-xs text-slate-400 italic">No bus stops bookmarked yet.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {stops.map((stop) => (
              <div
                key={stop.code}
                className="bg-white border border-slate-200 hover:border-slate-300 rounded-xl p-4 shadow-xs flex items-center justify-between gap-3 group transition-all"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-xs font-bold bg-slate-900 text-white px-2 py-0.5 rounded-md">
                      {stop.code}
                    </span>
                    <span className="text-xs text-slate-500">{stop.road}</span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                    {stop.name}
                  </h4>
                  <div className="text-[11px] text-slate-400 mt-1">
                    Services: {stop.services.slice(0, 5).join(', ')}
                    {stop.services.length > 5 ? ` +${stop.services.length - 5} more` : ''}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => onRemoveFavoriteStop(stop.code)}
                    title="Remove bookmark"
                    className="p-2 text-slate-300 hover:text-rose-600 rounded-lg cursor-pointer transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onSelectStopCode(stop.code)}
                    className="p-2 bg-emerald-50 hover:bg-emerald-600 hover:text-white text-emerald-700 rounded-lg cursor-pointer transition-colors"
                    title="View live arrivals"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pinned Bus Services */}
      {favoriteServices.length > 0 && (
        <div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-3">
            <Bus className="w-4 h-4 text-emerald-600" />
            <span>Pinned Bus Services ({favoriteServices.length})</span>
          </h3>

          <div className="flex flex-wrap gap-2">
            {favoriteServices.map((svc) => (
              <div
                key={svc}
                className="bg-white border border-slate-200 rounded-xl px-3 py-2 flex items-center gap-2 shadow-xs"
              >
                <span className="font-mono font-bold text-sm text-slate-900">
                  Bus {svc}
                </span>
                <button
                  onClick={() => onRemoveFavoriteService(svc)}
                  className="text-slate-300 hover:text-rose-500 cursor-pointer text-xs ml-1"
                  title="Remove from favorites"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
