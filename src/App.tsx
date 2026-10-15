import React, { useState, useEffect, useCallback, useRef } from 'react';
import { BusStop, BusServiceArrival, LiveBusVehicle } from './types/bus';
import { BUS_STOPS, BUS_ROUTES, MRT_LINE_COLORS } from './data/singaporeBuses';
import {
  tickFleetSimulation,
  fetchStopArrivals,
  getDistanceMeters,
  getStoredApiConfig,
} from './services/busArrivalEngine';
import { TopNav, ActiveTab } from './components/TopNav';
import { BusStopSelector } from './components/BusStopSelector';
import { BusArrivalCard } from './components/BusArrivalCard';
import { InteractiveBusMap } from './components/InteractiveBusMap';
import { RouteExplorer } from './components/RouteExplorer';
import { FavoritesView } from './components/FavoritesView';
import { BackendScaffoldingModal } from './components/BackendScaffoldingModal';
import {
  RefreshCw,
  MapPin,
  Clock,
  Radio,
  Bell,
  ArrowRight,
  ShieldCheck,
  Compass,
  Bus,
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('stops');
  const [selectedStop, setSelectedStop] = useState<BusStop>(BUS_STOPS[0]); // Orchard Stn / Tang Plaza
  const [arrivals, setArrivals] = useState<BusServiceArrival[]>([]);
  const [liveVehicles, setLiveVehicles] = useState<LiveBusVehicle[]>([]);
  const [activeRouteKey, setActiveRouteKey] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [isLoadingArrivals, setIsLoadingArrivals] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());
  const [secondsUntilRefresh, setSecondsUntilRefresh] = useState(20);

  // Simulated GPS or actual GPS coordinates
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number; name?: string }>({
    lat: 1.3045,
    lng: 103.8328,
    name: 'Orchard Rd',
  });

  // Favorites
  const [favoriteStops, setFavoriteStops] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('sg_fav_stops_v1');
      return saved ? JSON.parse(saved) : ['09048', '03218', '75009'];
    } catch {
      return ['09048', '03218'];
    }
  });

  const [favoriteServices, setFavoriteServices] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('sg_fav_services_v1');
      return saved ? JSON.parse(saved) : ['190', '36', '65'];
    } catch {
      return ['190', '36'];
    }
  });

  const [activeAlarms, setActiveAlarms] = useState<string[]>([]);
  const [bannerAlert, setBannerAlert] = useState<{ text: string; time: number } | null>(null);

  // Save favorites to storage
  useEffect(() => {
    try {
      localStorage.setItem('sg_fav_stops_v1', JSON.stringify(favoriteStops));
    } catch (err) {
      console.error(err);
    }
  }, [favoriteStops]);

  useEffect(() => {
    try {
      localStorage.setItem('sg_fav_services_v1', JSON.stringify(favoriteServices));
    } catch (err) {
      console.error(err);
    }
  }, [favoriteServices]);

  // Load arrivals for active stop
  const loadArrivals = useCallback(async (stopCode: string) => {
    setIsLoadingArrivals(true);
    try {
      const data = await fetchStopArrivals(stopCode);
      setArrivals(data);
      setLastRefreshed(new Date());
      const config = getStoredApiConfig();
      setSecondsUntilRefresh(config.autoRefreshIntervalSeconds || 20);
    } catch (err) {
      console.error('Failed to load arrivals', err);
    } finally {
      setIsLoadingArrivals(false);
    }
  }, []);

  // When selectedStop changes, fetch arrivals
  useEffect(() => {
    if (selectedStop) {
      loadArrivals(selectedStop.code);
    }
  }, [selectedStop, loadArrivals]);

  // 1-second simulation clock:
  // - Moves live vehicles smoothly along Singapore roads
  // - Decrements countdowns down to seconds
  // - Checks alarms
  useEffect(() => {
    const interval = setInterval(() => {
      // 1. Move vehicles
      const updatedFleet = tickFleetSimulation();
      setLiveVehicles(updatedFleet);

      // 2. Decrement arrival countdowns
      setArrivals((prev) =>
        prev.map((svc) => {
          const dec = (arr: any) => {
            if (!arr) return null;
            const nextSec = Math.max(0, (arr.durationSeconds ?? 0) - 1);
            return {
              ...arr,
              durationSeconds: nextSec,
              minutesAway: Math.floor(nextSec / 60),
            };
          };
          return {
            ...svc,
            NextBus: dec(svc.NextBus),
            NextBus2: dec(svc.NextBus2),
            NextBus3: dec(svc.NextBus3),
          };
        })
      );

      // 3. Decrement auto-refresh timer
      setSecondsUntilRefresh((prev) => {
        if (prev <= 1) {
          if (selectedStop) loadArrivals(selectedStop.code);
          return 20;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [selectedStop, loadArrivals]);

  // Check alarm alerts
  useEffect(() => {
    if (activeAlarms.length === 0) return;

    arrivals.forEach((svc) => {
      if (activeAlarms.includes(svc.ServiceNo) && svc.NextBus) {
        const secs = svc.NextBus.durationSeconds ?? 999;
        if (secs <= 90 && secs >= 80) {
          setBannerAlert({
            text: `Bus ${svc.ServiceNo} is approaching ${selectedStop.name} in ~1 min!`,
            time: Date.now(),
          });
        }
      }
    });
  }, [arrivals, activeAlarms, selectedStop]);

  // Compute distances from userCoords to each stop
  const stopsWithDistance: BusStop[] = BUS_STOPS.map((stop) => {
    if (!userCoords) return stop;
    const distanceMeters = getDistanceMeters(userCoords.lat, userCoords.lng, stop.lat, stop.lng);
    return {
      ...stop,
      distanceMeters,
    };
  }).sort((a, b) => (a.distanceMeters ?? 999999) - (b.distanceMeters ?? 999999));

  // Geolocation trigger
  const handleLocateNearest = () => {
    setIsLocating(true);
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setIsLocating(false);
          const coords = {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            name: 'Device GPS',
          };
          setUserCoords(coords);

          // Find closest stop
          let closest = BUS_STOPS[0];
          let minDist = 9999999;
          BUS_STOPS.forEach((s) => {
            const dist = getDistanceMeters(coords.lat, coords.lng, s.lat, s.lng);
            if (dist < minDist) {
              minDist = dist;
              closest = s;
            }
          });
          setSelectedStop(closest);
          setActiveTab('stops');
          setBannerAlert({
            text: `Located closest stop: ${closest.name} (${minDist < 1000 ? `${minDist}m` : `${(minDist / 1000).toFixed(1)}km`} away)`,
            time: Date.now(),
          });
        },
        (err) => {
          setIsLocating(false);
          // Fallback to Orchard
          setUserCoords({ lat: 1.3045, lng: 103.8328, name: 'Orchard (Default)' });
          setSelectedStop(BUS_STOPS[0]);
          setBannerAlert({
            text: 'GPS permission unavailable in sandbox. Defaulted to Orchard Corridor.',
            time: Date.now(),
          });
        },
        { timeout: 5000 }
      );
    } else {
      setIsLocating(false);
      setUserCoords({ lat: 1.3045, lng: 103.8328, name: 'Orchard Rd' });
    }
  };

  const handleSimulateLocation = (name: string, lat: number, lng: number) => {
    setUserCoords({ lat, lng, name });
    let closest = BUS_STOPS[0];
    let minDist = 9999999;
    BUS_STOPS.forEach((s) => {
      const dist = getDistanceMeters(lat, lng, s.lat, s.lng);
      if (dist < minDist) {
        minDist = dist;
        closest = s;
      }
    });
    setSelectedStop(closest);
    setBannerAlert({
      text: `Location switched to ${name}. Closest stop: ${closest.name}`,
      time: Date.now(),
    });
  };

  const handleToggleFavoriteStop = (stopCode: string) => {
    setFavoriteStops((prev) =>
      prev.includes(stopCode) ? prev.filter((c) => c !== stopCode) : [...prev, stopCode]
    );
  };

  const handleToggleFavoriteService = (serviceNo: string) => {
    setFavoriteServices((prev) =>
      prev.includes(serviceNo) ? prev.filter((s) => s !== serviceNo) : [...prev, serviceNo]
    );
  };

  const handleToggleAlarm = (serviceNo: string) => {
    setActiveAlarms((prev) => {
      const exists = prev.includes(serviceNo);
      if (exists) {
        return prev.filter((s) => s !== serviceNo);
      } else {
        setBannerAlert({
          text: `Arrival reminder set for Bus ${serviceNo}! We will alert you when it is 1 minute away.`,
          time: Date.now(),
        });
        return [...prev, serviceNo];
      }
    });
  };

  const handleSelectRoute = (serviceNo: string | null) => {
    setActiveRouteKey(serviceNo);
    if (serviceNo) {
      setActiveTab('map');
    }
  };

  const handleViewRouteFromCard = (serviceNo: string) => {
    setActiveRouteKey(serviceNo);
    setActiveTab('routes');
  };

  const handleSelectStopCode = (code: string) => {
    const stop = BUS_STOPS.find((s) => s.code === code);
    if (stop) {
      setSelectedStop(stop);
      setActiveTab('stops');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Top Bar adhering to strict 3-zone contract */}
      <TopNav
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onLocateNearest={handleLocateNearest}
        isLocating={isLocating}
      />

      {/* Alert Banner */}
      {bannerAlert && (
        <div className="bg-emerald-700 text-white px-4 py-2 text-xs flex items-center justify-between shadow-xs animate-fade-in">
          <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="w-3.5 h-3.5 text-emerald-200 shrink-0" />
              <span>{bannerAlert.text}</span>
            </div>
            <button
              onClick={() => setBannerAlert(null)}
              className="text-emerald-200 hover:text-white text-xs px-2 cursor-pointer font-bold"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6">
        {activeTab === 'stops' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column: Search, Stop Selector & GPS Presets (5 cols on lg) */}
            <div className="lg:col-span-5 space-y-4">
              <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-emerald-600" />
                    <span>LTA Bus Stops</span>
                  </h3>
                  <span className="text-xs text-slate-400 font-mono">
                    {BUS_STOPS.length} stations
                  </span>
                </div>

                <BusStopSelector
                  stops={stopsWithDistance}
                  selectedStop={selectedStop}
                  onSelectStop={(stop) => setSelectedStop(stop)}
                  userCoords={userCoords}
                  onSimulateLocation={handleSimulateLocation}
                  favoriteStops={favoriteStops}
                  onToggleFavoriteStop={handleToggleFavoriteStop}
                />
              </div>

              {/* Quick Map Preview Widget */}
              <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-700">Live Vehicle Fleet</span>
                  <button
                    onClick={() => setActiveTab('map')}
                    className="text-xs text-emerald-600 hover:text-emerald-700 font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <span>Open Full Map</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <div className="flex items-center gap-2">
                    <Bus className="w-4 h-4 text-emerald-600" />
                    <span>{liveVehicles.length} Buses Tracking Live</span>
                  </div>
                  <span className="font-mono text-emerald-700 font-bold">25-45 km/h</span>
                </div>
              </div>
            </div>

            {/* Right Column: Live Stop Arrival Board (7 cols on lg) */}
            <div className="lg:col-span-7 space-y-4">
              {/* Active Stop Header */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <span className="font-mono text-sm font-extrabold bg-slate-900 text-white px-2.5 py-0.5 rounded-lg tracking-wider">
                        {selectedStop.code}
                      </span>

                      {selectedStop.mrtLines && selectedStop.mrtLines.length > 0 && (
                        <div className="flex items-center gap-1">
                          {selectedStop.mrtLines.map((line) => {
                            const lineCfg = MRT_LINE_COLORS[line];
                            return (
                              <span
                                key={line}
                                className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                                style={{ backgroundColor: lineCfg?.bg, color: lineCfg?.text }}
                              >
                                {line}
                              </span>
                            );
                          })}
                          <span className="text-xs text-slate-500 font-medium ml-0.5">
                            {selectedStop.mrtStationName} MRT
                          </span>
                        </div>
                      )}
                    </div>

                    <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
                      {selectedStop.name}
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {selectedStop.road} · Singapore
                    </p>
                  </div>

                  {/* Auto-Refresh Timer & Manual Refresh */}
                  <div className="flex items-center gap-3 shrink-0 self-start sm:self-center">
                    <div className="text-right text-xs">
                      <div className="text-slate-400 font-medium">Auto-refresh</div>
                      <div className="font-mono font-semibold text-emerald-700">
                        in {secondsUntilRefresh}s
                      </div>
                    </div>

                    <button
                      onClick={() => loadArrivals(selectedStop.code)}
                      disabled={isLoadingArrivals}
                      title="Refresh arrival predictions now"
                      className="p-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl cursor-pointer disabled:opacity-50 transition-colors shadow-xs"
                    >
                      <RefreshCw className={`w-4 h-4 ${isLoadingArrivals ? 'animate-spin' : ''}`} />
                    </button>
                  </div>
                </div>

                {/* Capacity Legend Bar */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between flex-wrap gap-2 text-xs">
                  <div className="flex items-center gap-4 text-[11px] text-slate-500">
                    <span className="font-semibold text-slate-700">Capacity:</span>
                    <span className="flex items-center gap-1 text-emerald-700 font-medium">
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Seats
                    </span>
                    <span className="flex items-center gap-1 text-amber-700 font-medium">
                      <span className="w-2 h-2 rounded-full bg-amber-500"></span> Standing
                    </span>
                    <span className="flex items-center gap-1 text-rose-700 font-medium">
                      <span className="w-2 h-2 rounded-full bg-rose-500"></span> Crowded
                    </span>
                  </div>

                  <div className="text-[11px] text-slate-400">
                    Updated: <span className="font-mono">{lastRefreshed.toLocaleTimeString()}</span>
                  </div>
                </div>
              </div>

              {/* Service Arrival Cards */}
              <div className="space-y-3">
                {isLoadingArrivals && arrivals.length === 0 ? (
                  <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center">
                    <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin mx-auto mb-2" />
                    <p className="text-sm font-semibold text-slate-700">Loading LTA arrival predictions...</p>
                  </div>
                ) : arrivals.length === 0 ? (
                  <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center">
                    <Bus className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-sm font-semibold text-slate-700">No active bus services at this stop</p>
                  </div>
                ) : (
                  arrivals.map((svc) => (
                    <BusArrivalCard
                      key={svc.ServiceNo}
                      service={svc}
                      isFavorite={favoriteServices.includes(svc.ServiceNo)}
                      hasAlarm={activeAlarms.includes(svc.ServiceNo)}
                      onToggleFavorite={handleToggleFavoriteService}
                      onToggleAlarm={handleToggleAlarm}
                      onViewRoute={handleViewRouteFromCard}
                    />
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* Map Tab */}
        {activeTab === 'map' && (
          <div className="space-y-4">
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Compass className="w-5 h-5 text-emerald-600" />
                  <span>Singapore Real-Time Bus &amp; Stop Fleet Map</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Click on any bus stop or live vehicle marker to view its real-time speed, load, and countdown timings.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveTab('stops')}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer transition-colors"
                >
                  Back to Arrival Board
                </button>
              </div>
            </div>

            <InteractiveBusMap
              stops={stopsWithDistance}
              selectedStop={selectedStop}
              onSelectStop={(stop) => {
                setSelectedStop(stop);
                setActiveTab('stops');
              }}
              liveVehicles={liveVehicles}
              activeRouteKey={activeRouteKey}
              onSelectRoute={setActiveRouteKey}
              userCoords={userCoords}
            />
          </div>
        )}

        {/* Route Explorer Tab */}
        {activeTab === 'routes' && (
          <RouteExplorer
            onSelectStopCode={handleSelectStopCode}
            liveVehicles={liveVehicles}
            activeRouteKey={activeRouteKey}
            onSelectRoute={handleSelectRoute}
          />
        )}

        {/* Favorites Tab */}
        {activeTab === 'favorites' && (
          <FavoritesView
            favoriteStops={favoriteStops}
            favoriteServices={favoriteServices}
            onSelectStopCode={handleSelectStopCode}
            onRemoveFavoriteStop={handleToggleFavoriteStop}
            onRemoveFavoriteService={handleToggleFavoriteService}
          />
        )}

        {/* API Scaffolding & Setup Tab */}
        {activeTab === 'api-docs' && (
          <BackendScaffoldingModal
            onConfigUpdated={() => {
              if (selectedStop) loadArrivals(selectedStop.code);
            }}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-200 bg-white py-4 px-4 sm:px-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-700">SG Bus Tracker</span>
            <span className="text-slate-300">·</span>
            <span>Compatible with Singapore Land Transport Authority (LTA) DataMall v2</span>
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <span>SBS Transit · SMRT · Tower Transit · Go-Ahead</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
