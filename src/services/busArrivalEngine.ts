import { BusStop, BusServiceArrival, LiveBusVehicle, BusLoad, BusType, BusOperator, BusArrivalData } from '../types/bus';
import { BUS_STOPS, BUS_ROUTES } from '../data/singaporeBuses';

// Seeded state for buses so they move predictably along waypoints
interface BusSimulationState {
  id: string;
  serviceNo: string;
  operator: BusOperator;
  plate: string;
  type: BusType;
  wab: boolean;
  load: BusLoad;
  routeKey: string;
  progress: number; // 0 to 1 along waypoint polyline
  speed: number; // progress increment per second
  heading: number;
}

const INITIAL_FLEET: BusSimulationState[] = [
  { id: 'v-190-1', serviceNo: '190', operator: 'SMRT', plate: 'SMB5012S', type: 'DD', wab: true, load: 'SEA', routeKey: '190', progress: 0.45, speed: 0.0035, heading: 140 },
  { id: 'v-190-2', serviceNo: '190', operator: 'SMRT', plate: 'SG5812B', type: 'DD', wab: true, load: 'SDA', routeKey: '190', progress: 0.15, speed: 0.004, heading: 130 },
  { id: 'v-190-3', serviceNo: '190', operator: 'SMRT', plate: 'SMB3119X', type: 'BD', wab: true, load: 'LSD', routeKey: '190', progress: 0.75, speed: 0.003, heading: 155 },
  { id: 'v-36-1', serviceNo: '36', operator: 'GAS', plate: 'SBS6821P', type: 'SD', wab: true, load: 'SEA', routeKey: '36', progress: 0.62, speed: 0.0042, heading: 240 },
  { id: 'v-36-2', serviceNo: '36', operator: 'GAS', plate: 'SG1045E', type: 'SD', wab: true, load: 'SDA', routeKey: '36', progress: 0.28, speed: 0.0045, heading: 235 },
  { id: 'v-65-1', serviceNo: '65', operator: 'SBST', plate: 'SBS3982D', type: 'DD', wab: true, load: 'SEA', routeKey: '65', progress: 0.38, speed: 0.0038, heading: 220 },
  { id: 'v-65-2', serviceNo: '65', operator: 'SBST', plate: 'SBS7721L', type: 'DD', wab: true, load: 'SDA', routeKey: '65', progress: 0.68, speed: 0.0036, heading: 210 },
  { id: 'v-147-1', serviceNo: '147', operator: 'SBST', plate: 'SBS8841Z', type: 'SD', wab: true, load: 'SEA', routeKey: '147', progress: 0.32, speed: 0.0039, heading: 195 },
  { id: 'v-147-2', serviceNo: '147', operator: 'SBST', plate: 'SG5540M', type: 'DD', wab: true, load: 'SDA', routeKey: '147', progress: 0.72, speed: 0.0041, heading: 260 },
  { id: 'v-106-1', serviceNo: '106', operator: 'TTS', plate: 'SG5048T', type: 'DD', wab: true, load: 'SEA', routeKey: '106', progress: 0.42, speed: 0.0037, heading: 110 },
  { id: 'v-106-2', serviceNo: '106', operator: 'TTS', plate: 'SG1088A', type: 'SD', wab: true, load: 'LSD', routeKey: '106', progress: 0.81, speed: 0.0038, heading: 130 },
  { id: 'v-960-1', serviceNo: '960', operator: 'SMRT', plate: 'SMB5881H', type: 'DD', wab: true, load: 'SEA', routeKey: '960', progress: 0.52, speed: 0.0043, heading: 170 },
];

let liveFleetState = [...INITIAL_FLEET];
let lastUpdateTime = Date.now();

// Calculate position along polyline from progress (0 to 1)
function interpolatePolyline(waypoints: [number, number][], progress: number): { lat: number; lng: number } {
  if (waypoints.length === 0) return { lat: 1.3521, lng: 103.8198 };
  if (waypoints.length === 1) return { lat: waypoints[0][0], lng: waypoints[0][1] };

  const clamped = Math.max(0, Math.min(0.9999, progress));
  const totalSegments = waypoints.length - 1;
  const floatIdx = clamped * totalSegments;
  const segmentIdx = Math.floor(floatIdx);
  const segmentT = floatIdx - segmentIdx;

  const p1 = waypoints[segmentIdx];
  const p2 = waypoints[segmentIdx + 1];

  const lat = p1[0] + (p2[0] - p1[0]) * segmentT;
  const lng = p1[1] + (p2[1] - p1[1]) * segmentT;

  return { lat, lng };
}

// Haversine distance in meters
export function getDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // metres
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
}

// Update simulation step
export function tickFleetSimulation(): LiveBusVehicle[] {
  const now = Date.now();
  const dtSeconds = Math.max(0.2, (now - lastUpdateTime) / 1000);
  lastUpdateTime = now;

  liveFleetState = liveFleetState.map((bus) => {
    let nextProgress = bus.progress + bus.speed * dtSeconds;
    if (nextProgress > 1) {
      nextProgress = 0; // loop back
    }

    return {
      ...bus,
      progress: nextProgress,
    };
  });

  return getLiveVehicles();
}

export function getLiveVehicles(): LiveBusVehicle[] {
  return liveFleetState.map((bus) => {
    const route = BUS_ROUTES[bus.routeKey];
    const waypoints = route?.waypoints || [[1.3521, 103.8198], [1.3525, 103.8202]];
    const pos = interpolatePolyline(waypoints, bus.progress);

    // Find next stop on this route
    let nextStop = route?.stops[0];
    let nextStopDist = 999999;
    if (route) {
      for (const stop of route.stops) {
        const d = getDistanceMeters(pos.lat, pos.lng, stop.lat, stop.lng);
        if (d < nextStopDist) {
          nextStopDist = d;
          nextStop = stop;
        }
      }
    }

    const etaSeconds = Math.max(25, Math.round(nextStopDist / 9)); // ~32 km/h avg speed

    return {
      id: bus.id,
      plate: bus.plate,
      serviceNo: bus.serviceNo,
      operator: bus.operator,
      lat: Number(pos.lat.toFixed(5)),
      lng: Number(pos.lng.toFixed(5)),
      bearing: bus.heading,
      speedKmH: Math.round(28 + Math.sin(bus.progress * 10) * 8),
      load: bus.load,
      type: bus.type,
      wab: bus.wab,
      nextStopCode: nextStop?.stopCode || '00000',
      nextStopName: nextStop?.stopName || 'Upcoming Stop',
      etaSeconds,
      routeProgress: bus.progress,
    };
  });
}

// Generate realistic LTA Arrival payload for a bus stop
export function generateSimulatedArrivals(stopCode: string): BusServiceArrival[] {
  const stop = BUS_STOPS.find((s) => s.code === stopCode) || BUS_STOPS[0];
  const now = Date.now();

  return stop.services.map((serviceNo, idx) => {
    // Generate deterministic yet time-varying arrivals based on current time & index
    const timeCycle = Math.floor(now / 1000);
    const offset = (idx * 173 + parseInt(stopCode, 10)) % 600;
    const cycle = (timeCycle + offset) % 900; // 15 min headway cycle

    const eta1Seconds = Math.max(15, (cycle % 360) + 20); // 20s to ~6min
    const eta2Seconds = eta1Seconds + 420 + ((idx * 37) % 240); // +7-11 mins
    const eta3Seconds = eta2Seconds + 600 + ((idx * 53) % 300); // +10-15 mins

    const loadOptions: BusLoad[] = ['SEA', 'SEA', 'SDA', 'SEA', 'LSD', 'SDA'];
    const typeOptions: BusType[] = ['DD', 'SD', 'DD', 'BD', 'SD'];
    const operators: BusOperator[] = ['SBST', 'SMRT', 'TTS', 'GAS'];

    const operator = (
      ['190', '960', '857'].includes(serviceNo) ? 'SMRT' :
      ['36'].includes(serviceNo) ? 'GAS' :
      ['106'].includes(serviceNo) ? 'TTS' : 'SBST'
    ) as BusOperator;

    const makeArrival = (seconds: number, arrivalIndex: number): BusArrivalData => {
      const targetTime = new Date(now + seconds * 1000).toISOString();
      const load = loadOptions[(idx + arrivalIndex + Math.floor(now / 60000)) % loadOptions.length];
      const type = typeOptions[(idx * 2 + arrivalIndex) % typeOptions.length];
      const stopsAway = Math.max(0, Math.ceil(seconds / 150));

      return {
        EstimatedArrival: targetTime,
        Latitude: (stop.lat - 0.005 * (arrivalIndex + 1)).toFixed(5),
        Longitude: (stop.lng - 0.004 * (arrivalIndex + 1)).toFixed(5),
        VisitNumber: '1',
        Load: load,
        Feature: 'WAB',
        Type: type,
        durationSeconds: seconds,
        minutesAway: Math.floor(seconds / 60),
        stopsAway,
      };
    };

    return {
      ServiceNo: serviceNo,
      Operator: operator,
      NextBus: makeArrival(eta1Seconds, 0),
      NextBus2: makeArrival(eta2Seconds, 1),
      NextBus3: makeArrival(eta3Seconds, 2),
      direction: 1,
      firstBusWeekday: '05:30',
      lastBusWeekday: '23:55',
      firstBusSat: '05:45',
      lastBusSat: '23:50',
      firstBusSun: '06:00',
      lastBusSun: '23:45',
    };
  });
}

// User-configurable backend integration settings
export interface ApiConfig {
  useLiveBackend: boolean;
  endpointUrl: string;
  apiKey?: string;
  autoRefreshIntervalSeconds: number;
}

const STORAGE_KEY = 'sg_bus_api_config_v1';

export function getStoredApiConfig(): ApiConfig {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch {
    // fallback
  }
  return {
    useLiveBackend: false,
    endpointUrl: '/api/busarrival',
    apiKey: '',
    autoRefreshIntervalSeconds: 20,
  };
}

export function saveApiConfig(config: ApiConfig) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch (err) {
    console.error('Failed to save API config', err);
  }
}

// Fetch arrivals using either custom backend or simulation
export async function fetchStopArrivals(stopCode: string): Promise<BusServiceArrival[]> {
  const config = getStoredApiConfig();

  if (config.useLiveBackend && config.endpointUrl) {
    try {
      const url = new URL(config.endpointUrl, window.location.origin);
      url.searchParams.set('BusStopCode', stopCode);

      const headers: Record<string, string> = {
        'Accept': 'application/json',
      };
      if (config.apiKey) {
        headers['AccountKey'] = config.apiKey;
      }

      const res = await fetch(url.toString(), { headers });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }

      const data = await res.json();
      // Handle standard LTA DataMall v2 format: { BusStopCode: "...", Services: [...] }
      if (data && Array.isArray(data.Services)) {
        return data.Services.map((svc: any) => {
          const mapArrival = (raw: any): BusArrivalData | null => {
            if (!raw || !raw.EstimatedArrival) return null;
            const diffMs = new Date(raw.EstimatedArrival).getTime() - Date.now();
            const durationSeconds = Math.max(0, Math.floor(diffMs / 1000));
            return {
              EstimatedArrival: raw.EstimatedArrival,
              Latitude: raw.Latitude || '',
              Longitude: raw.Longitude || '',
              VisitNumber: raw.VisitNumber || '1',
              Load: (raw.Load as BusLoad) || 'SEA',
              Feature: raw.Feature === 'WAB' ? 'WAB' : '',
              Type: (raw.Type as BusType) || 'SD',
              durationSeconds,
              minutesAway: Math.floor(durationSeconds / 60),
              stopsAway: Math.max(0, Math.ceil(durationSeconds / 150)),
            };
          };

          return {
            ServiceNo: svc.ServiceNo,
            Operator: (svc.Operator as BusOperator) || 'SBST',
            NextBus: mapArrival(svc.NextBus),
            NextBus2: mapArrival(svc.NextBus2),
            NextBus3: mapArrival(svc.NextBus3),
          };
        });
      }
    } catch (err) {
      console.warn('Backend API request failed, falling back to simulated data', err);
      // Fallback seamlessly to high-fidelity simulation so the UI never breaks
    }
  }

  // Realistic simulation fallback / default
  return generateSimulatedArrivals(stopCode);
}
