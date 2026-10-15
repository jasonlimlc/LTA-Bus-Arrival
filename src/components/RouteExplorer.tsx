import React, { useState } from 'react';
import { BusRouteInfo, LiveBusVehicle, BusStop } from '../types/bus';
import { BUS_ROUTES, OPERATOR_INFO, MRT_LINE_COLORS } from '../data/singaporeBuses';
import { Route as RouteIcon, Bus, Clock, MapPin, ArrowRight, ExternalLink } from 'lucide-react';

interface RouteExplorerProps {
  onSelectStopCode: (stopCode: string) => void;
  liveVehicles: LiveBusVehicle[];
  activeRouteKey: string | null;
  onSelectRoute: (serviceNo: string) => void;
}

export const RouteExplorer: React.FC<RouteExplorerProps> = ({
  onSelectStopCode,
  liveVehicles,
  activeRouteKey,
  onSelectRoute,
}) => {
  const availableServices = Object.keys(BUS_ROUTES);
  const [selectedService, setSelectedService] = useState<string>(activeRouteKey || '190');

  const currentRoute: BusRouteInfo = BUS_ROUTES[selectedService] || BUS_ROUTES['190'];
  const operator = OPERATOR_INFO[currentRoute.operator] || OPERATOR_INFO.SBST;

  // Find active vehicles on this route
  const activeRouteVehicles = liveVehicles.filter((v) => v.serviceNo === selectedService);

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-xs">
      {/* Route Selector Chips */}
      <div className="mb-6">
        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-2">
          Select Bus Service to Explore
        </label>
        <div className="flex items-center gap-2 flex-wrap">
          {availableServices.map((svc) => (
            <button
              key={svc}
              onClick={() => {
                setSelectedService(svc);
                onSelectRoute(svc);
              }}
              className={`min-w-[48px] h-10 px-3 rounded-xl font-mono font-bold text-sm transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                selectedService === svc
                  ? 'bg-slate-900 text-white shadow-xs scale-105'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              <Bus className="w-3.5 h-3.5 opacity-70" />
              <span>{svc}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Route Header Banner */}
      <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xl font-extrabold text-slate-900">
                Service {currentRoute.serviceNo}
              </span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded text-white bg-slate-800">
                {operator.name}
              </span>
              <span className="text-xs text-slate-500">Direction {currentRoute.direction}</span>
            </div>

            <div className="text-sm font-semibold text-slate-800 mt-1 flex items-center gap-1.5 flex-wrap">
              <span>{currentRoute.originName}</span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              <span>{currentRoute.destinationName}</span>
            </div>
          </div>

          <div className="text-xs text-slate-500 space-y-1">
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>Operating Hours: 05:30 – 23:55</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Bus className="w-3.5 h-3.5 text-emerald-600" />
              <span>{activeRouteVehicles.length} active buses tracked live</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stop Sequence Vertical Transit Line */}
      <div>
        <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">
          Route Stops Sequence ({currentRoute.stops.length} stops)
        </h4>

        <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-emerald-500">
          {currentRoute.stops.map((stop, idx) => {
            // Check if any bus is approaching this stop
            const approachingBus = activeRouteVehicles.find(
              (b) => b.nextStopCode === stop.stopCode
            );

            return (
              <div key={stop.stopCode} className="relative group">
                {/* Station dot on line */}
                <div className={`absolute -left-6 top-1 w-4 h-4 rounded-full border-2 border-white transition-all ${
                  approachingBus
                    ? 'bg-emerald-600 ring-4 ring-emerald-200'
                    : 'bg-slate-700 group-hover:bg-emerald-600'
                }`} />

                <div className="flex items-start justify-between gap-3 bg-white hover:bg-slate-50/80 p-3 rounded-xl border border-slate-100 transition-colors">
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-1.5 py-0.2 rounded">
                        {stop.stopCode}
                      </span>
                      <span className="text-[11px] text-slate-400 font-mono">
                        {stop.distanceKm.toFixed(1)} km
                      </span>
                    </div>

                    <div className="text-sm font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                      {stop.stopName}
                    </div>
                    <div className="text-xs text-slate-500">
                      {stop.roadName}
                    </div>

                    {/* Approaching bus badge */}
                    {approachingBus && (
                      <div className="inline-flex items-center gap-1.5 mt-2 bg-emerald-50 border border-emerald-200 text-emerald-800 px-2 py-0.5 rounded-md text-xs font-medium">
                        <Bus className="w-3 h-3 text-emerald-600" />
                        <span>Bus {approachingBus.plate} approaching (~{Math.round(approachingBus.etaSeconds / 60)}m)</span>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => onSelectStopCode(stop.stopCode)}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-900 hover:text-white text-slate-700 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer shrink-0"
                  >
                    <span>View Stop</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
