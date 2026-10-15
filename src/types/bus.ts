export type BusLoad = 'SEA' | 'SDA' | 'LSD'; // Seats Available, Standing Available, Limited Standing
export type BusType = 'SD' | 'DD' | 'BD'; // Single Deck, Double Deck, Bendy
export type BusOperator = 'SBST' | 'SMRT' | 'TTS' | 'GAS'; // SBS Transit, SMRT, Tower Transit, Go-Ahead

export interface BusArrivalData {
  EstimatedArrival: string; // ISO string e.g. "2026-10-15T06:45:00+08:00"
  Latitude: string;
  Longitude: string;
  VisitNumber: string;
  Load: BusLoad;
  Feature: 'WAB' | '';
  Type: BusType;
  durationSeconds?: number;
  minutesAway?: number;
  stopsAway?: number;
}

export interface BusServiceArrival {
  ServiceNo: string;
  Operator: BusOperator;
  NextBus: BusArrivalData | null;
  NextBus2: BusArrivalData | null;
  NextBus3: BusArrivalData | null;
  direction?: 1 | 2;
  originStopCode?: string;
  destinationStopCode?: string;
  firstBusWeekday?: string;
  lastBusWeekday?: string;
  firstBusSat?: string;
  lastBusSat?: string;
  firstBusSun?: string;
  lastBusSun?: string;
}

export interface BusStop {
  id: string;
  code: string; // 5-digit LTA stop code (e.g. "09048")
  name: string; // e.g. "Orchard Stn/Tang Plaza"
  road: string; // e.g. "Orchard Rd"
  lat: number;
  lng: number;
  mrtLines?: ('NSL' | 'EWL' | 'CCL' | 'DTL' | 'TEL' | 'NEL')[];
  mrtStationName?: string;
  services: string[]; // List of bus numbers serving this stop
  distanceMeters?: number;
}

export interface BusRouteInfo {
  serviceNo: string;
  operator: BusOperator;
  direction: 1 | 2;
  originStopCode: string;
  originName: string;
  destinationStopCode: string;
  destinationName: string;
  loopDescription?: string;
  stops: {
    sequence: number;
    stopCode: string;
    stopName: string;
    roadName: string;
    distanceKm: number;
    lat: number;
    lng: number;
  }[];
  waypoints: [number, number][]; // LatLng points for map route line
}

export interface LiveBusVehicle {
  id: string;
  plate: string;
  serviceNo: string;
  operator: BusOperator;
  lat: number;
  lng: number;
  bearing: number;
  speedKmH: number;
  load: BusLoad;
  type: BusType;
  wab: boolean;
  nextStopCode: string;
  nextStopName: string;
  etaSeconds: number;
  routeProgress: number; // 0 to 1 along route
}

export interface FavoriteItem {
  id: string; // composite key e.g. "09048-190" or "stop-09048"
  type: 'stop' | 'service';
  stopCode: string;
  stopName: string;
  roadName: string;
  serviceNo?: string;
  customLabel?: string;
  addedAt: number;
}
