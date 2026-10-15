import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { BusStop, LiveBusVehicle, BusRouteInfo } from '../types/bus';
import { BUS_ROUTES } from '../data/singaporeBuses';
import { Crosshair, Layers, Navigation, Bus, Info, Clock, Gauge, ArrowRight } from 'lucide-react';

interface InteractiveBusMapProps {
  stops: BusStop[];
  selectedStop: BusStop | null;
  onSelectStop: (stop: BusStop) => void;
  liveVehicles: LiveBusVehicle[];
  activeRouteKey: string | null;
  onSelectRoute: (serviceNo: string | null) => void;
  userCoords: { lat: number; lng: number; name?: string } | null;
}

export const InteractiveBusMap: React.FC<InteractiveBusMapProps> = ({
  stops,
  selectedStop,
  onSelectStop,
  liveVehicles,
  activeRouteKey,
  onSelectRoute,
  userCoords,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const stopMarkersLayerRef = useRef<L.LayerGroup | null>(null);
  const vehicleMarkersLayerRef = useRef<L.LayerGroup | null>(null);
  const polylineLayerRef = useRef<L.Polyline | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);

  const [selectedVehicle, setSelectedVehicle] = useState<LiveBusVehicle | null>(null);
  const [showStops, setShowStops] = useState(true);
  const [showVehicles, setShowVehicles] = useState(true);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: selectedStop ? [selectedStop.lat, selectedStop.lng] : [1.3521, 103.8198],
      zoom: selectedStop ? 15 : 12,
      zoomControl: false,
    });

    // High quality CartoDB Voyager raster tiles (modern, legible, transit-friendly)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
      maxZoom: 19,
    }).addTo(map);

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    stopMarkersLayerRef.current = L.layerGroup().addTo(map);
    vehicleMarkersLayerRef.current = L.layerGroup().addTo(map);

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update User Location Marker
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !userCoords) return;

    if (userMarkerRef.current) {
      userMarkerRef.current.setLatLng([userCoords.lat, userCoords.lng]);
    } else {
      const userIcon = L.divIcon({
        className: 'user-location-pin',
        html: `
          <div style="position:relative; width:22px; height:22px; display:flex; align-items:center; justify-content:center;">
            <div style="position:absolute; width:22px; height:22px; background:rgba(14, 165, 233, 0.25); border-radius:50%; animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
            <div style="width:14px; height:14px; background:#0284c7; border:2.5px solid #ffffff; border-radius:50%; box-shadow:0 2px 6px rgba(0,0,0,0.3);"></div>
          </div>
        `,
        iconSize: [22, 22],
        iconAnchor: [11, 11],
      });

      userMarkerRef.current = L.marker([userCoords.lat, userCoords.lng], { icon: userIcon })
        .addTo(map)
        .bindPopup(`<b>Your Location</b><br/>${userCoords.name || 'Simulated GPS'}`);
    }
  }, [userCoords]);

  // Center on Selected Stop when changed
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !selectedStop) return;

    map.flyTo([selectedStop.lat, selectedStop.lng], 16, {
      duration: 1.2,
      easeLinearity: 0.25,
    });
  }, [selectedStop]);

  // Draw or clear route polyline
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (polylineLayerRef.current) {
      map.removeLayer(polylineLayerRef.current);
      polylineLayerRef.current = null;
    }

    if (activeRouteKey && BUS_ROUTES[activeRouteKey]) {
      const route = BUS_ROUTES[activeRouteKey];
      polylineLayerRef.current = L.polyline(route.waypoints, {
        color: '#059669',
        weight: 5,
        opacity: 0.85,
        lineCap: 'round',
        lineJoin: 'round',
        dashArray: undefined,
      }).addTo(map);

      // Fit bounds to polyline
      map.fitBounds(polylineLayerRef.current.getBounds(), { padding: [40, 40] });
    }
  }, [activeRouteKey]);

  // Render Stop Markers
  useEffect(() => {
    const layer = stopMarkersLayerRef.current;
    if (!layer) return;
    layer.clearLayers();

    if (!showStops) return;

    stops.forEach((stop) => {
      const isSelected = selectedStop?.code === stop.code;

      const stopIcon = L.divIcon({
        className: 'custom-stop-marker',
        html: `
          <div style="
            background: ${isSelected ? '#059669' : '#0f172a'};
            color: #ffffff;
            border: 2px solid #ffffff;
            border-radius: 8px;
            padding: 3px 6px;
            font-family: 'JetBrains Mono', monospace;
            font-size: 10px;
            font-weight: 700;
            box-shadow: 0 4px 10px rgba(0,0,0,0.25);
            display: inline-flex;
            align-items: center;
            gap: 4px;
            transform: ${isSelected ? 'scale(1.2)' : 'scale(1)'};
            transition: transform 0.2s;
            cursor: pointer;
            white-space: nowrap;
          ">
            <span style="display:inline-block; width:6px; height:6px; border-radius:50%; background:${isSelected ? '#6ee7b7' : '#94a3b8'};"></span>
            ${stop.code}
          </div>
        `,
        iconSize: [52, 24],
        iconAnchor: [26, 12],
      });

      const marker = L.marker([stop.lat, stop.lng], { icon: stopIcon });
      marker.on('click', () => {
        onSelectStop(stop);
      });
      layer.addLayer(marker);
    });
  }, [stops, selectedStop, showStops]);

  // Render Live Vehicle Markers
  useEffect(() => {
    const layer = vehicleMarkersLayerRef.current;
    if (!layer) return;
    layer.clearLayers();

    if (!showVehicles) return;

    liveVehicles.forEach((bus) => {
      // Filter if route is chosen
      if (activeRouteKey && bus.serviceNo !== activeRouteKey) return;

      const loadColor =
        bus.load === 'SEA' ? '#10b981' : bus.load === 'SDA' ? '#f59e0b' : '#ef4444';

      const busIcon = L.divIcon({
        className: 'custom-bus-marker',
        html: `
          <div style="
            background: #ffffff;
            border: 2px solid ${loadColor};
            border-radius: 9999px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
            padding: 2px 7px;
            display: inline-flex;
            align-items: center;
            gap: 4px;
            font-family: 'JetBrains Mono', monospace;
            cursor: pointer;
            transform: scale(${selectedVehicle?.id === bus.id ? '1.25' : '1'});
            transition: transform 0.2s;
          ">
            <span style="
              width: 8px;
              height: 8px;
              border-radius: 50%;
              background: ${loadColor};
              display: inline-block;
            "></span>
            <span style="font-size: 11px; font-weight: 800; color: #0f172a;">${bus.serviceNo}</span>
            <span style="font-size: 9px; font-weight: 700; color: #64748b;">${bus.type}</span>
          </div>
        `,
        iconSize: [60, 26],
        iconAnchor: [30, 13],
      });

      const marker = L.marker([bus.lat, bus.lng], { icon: busIcon });
      marker.on('click', () => {
        setSelectedVehicle(bus);
      });
      layer.addLayer(marker);
    });
  }, [liveVehicles, activeRouteKey, selectedVehicle, showVehicles]);

  const handleResetSingaporeView = () => {
    mapInstanceRef.current?.flyTo([1.3521, 103.8198], 12, { duration: 1.2 });
  };

  const handleCenterSelectedStop = () => {
    if (selectedStop) {
      mapInstanceRef.current?.flyTo([selectedStop.lat, selectedStop.lng], 16, { duration: 1.2 });
    }
  };

  return (
    <div className="relative w-full h-[620px] rounded-2xl overflow-hidden border border-slate-200 shadow-xs bg-slate-100">
      {/* Map Element */}
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Map Floating Header Controls */}
      <div className="absolute top-4 left-4 z-10 flex flex-wrap items-center gap-2">
        <div className="bg-white/95 backdrop-blur-md border border-slate-200/80 rounded-xl px-3 py-1.5 shadow-xs flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            <span className="text-slate-600 font-medium">Seats Avail</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
            <span className="text-slate-600 font-medium">Standing</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
            <span className="text-slate-600 font-medium">Crowded</span>
          </div>
        </div>

        {activeRouteKey && (
          <div className="bg-emerald-800 text-white rounded-xl px-3 py-1.5 shadow-xs flex items-center gap-2 text-xs font-semibold">
            <span>Route: Bus {activeRouteKey}</span>
            <button
              onClick={() => onSelectRoute(null)}
              className="text-emerald-200 hover:text-white cursor-pointer ml-1"
            >
              ✕ Clear
            </button>
          </div>
        )}
      </div>

      {/* Floating Action Buttons */}
      <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
        <button
          onClick={handleCenterSelectedStop}
          disabled={!selectedStop}
          title="Center on currently selected bus stop"
          className="p-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl shadow-xs cursor-pointer disabled:opacity-40 transition-colors"
        >
          <Navigation className="w-4 h-4 text-emerald-600" />
        </button>

        <button
          onClick={handleResetSingaporeView}
          title="Singapore Island overview"
          className="p-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl shadow-xs cursor-pointer transition-colors"
        >
          <Crosshair className="w-4 h-4" />
        </button>

        <button
          onClick={() => setShowVehicles(!showVehicles)}
          title={showVehicles ? 'Hide moving bus fleet' : 'Show moving bus fleet'}
          className={`p-2.5 border rounded-xl shadow-xs cursor-pointer transition-colors ${
            showVehicles
              ? 'bg-emerald-600 text-white border-emerald-700'
              : 'bg-white text-slate-400 border-slate-200'
          }`}
        >
          <Bus className="w-4 h-4" />
        </button>
      </div>

      {/* Vehicle Inspector Card Popup */}
      {selectedVehicle && (
        <div className="absolute bottom-5 left-4 right-4 sm:left-6 sm:right-auto sm:w-96 z-10 bg-white/95 backdrop-blur-md border border-slate-200 rounded-2xl p-4 shadow-xl animate-fade-in">
          <div className="flex items-start justify-between gap-2 mb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-mono font-bold text-lg">
                {selectedVehicle.serviceNo}
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono text-xs font-bold text-slate-900">
                    {selectedVehicle.plate}
                  </span>
                  <span className="text-[10px] bg-slate-100 font-semibold text-slate-600 px-1.5 py-0.5 rounded">
                    {selectedVehicle.type === 'DD' ? 'Double Deck' : selectedVehicle.type === 'BD' ? 'Bendy' : 'Single Deck'}
                  </span>
                  {selectedVehicle.wab && (
                    <span className="text-sky-600 text-xs" title="Wheelchair Accessible">♿</span>
                  )}
                </div>
                <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                  <Gauge className="w-3 h-3 text-slate-400" />
                  <span>{selectedVehicle.speedKmH} km/h</span>
                  <span className="text-slate-300">·</span>
                  <span className={
                    selectedVehicle.load === 'SEA' ? 'text-emerald-600 font-semibold' :
                    selectedVehicle.load === 'SDA' ? 'text-amber-600 font-semibold' : 'text-rose-600 font-semibold'
                  }>
                    {selectedVehicle.load === 'SEA' ? 'Seats Available' : selectedVehicle.load === 'SDA' ? 'Standing Only' : 'Limited Standing'}
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setSelectedVehicle(null)}
              className="text-slate-400 hover:text-slate-700 text-xs w-6 h-6 flex items-center justify-center rounded-full hover:bg-slate-100 cursor-pointer"
            >
              ✕
            </button>
          </div>

          <div className="bg-slate-50 border border-slate-100 rounded-xl p-2.5 mb-3 text-xs">
            <div className="text-slate-400 text-[10px] font-medium mb-0.5">Next Approaching Stop</div>
            <div className="font-semibold text-slate-900 flex items-center justify-between">
              <span>{selectedVehicle.nextStopName}</span>
              <span className="font-mono text-emerald-700 bg-emerald-100/60 px-1.5 py-0.5 rounded text-[11px]">
                ~{Math.round(selectedVehicle.etaSeconds / 60)} min
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onSelectRoute(selectedVehicle.serviceNo);
                setSelectedVehicle(null);
              }}
              className="flex-1 py-2 px-3 text-xs font-semibold bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>Trace Bus {selectedVehicle.serviceNo} Route</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
