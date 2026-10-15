import React from 'react';
import { BusServiceArrival, BusArrivalData, BusLoad } from '../types/bus';
import { OPERATOR_INFO } from '../data/singaporeBuses';
import { Bell, BellRing, Star, Eye, Layers } from 'lucide-react';

interface BusArrivalCardProps {
  service: BusServiceArrival;
  isFavorite: boolean;
  hasAlarm: boolean;
  onToggleFavorite: (serviceNo: string) => void;
  onToggleAlarm: (serviceNo: string) => void;
  onViewRoute: (serviceNo: string) => void;
}

export const BusArrivalCard: React.FC<BusArrivalCardProps> = ({
  service,
  isFavorite,
  hasAlarm,
  onToggleFavorite,
  onToggleAlarm,
  onViewRoute,
}) => {
  const operator = OPERATOR_INFO[service.Operator] || OPERATOR_INFO.SBST;

  const renderArrivalSlot = (arrival: BusArrivalData | null, label: string) => {
    if (!arrival) {
      return (
        <div className="flex-1 bg-slate-50 border border-slate-100 rounded-xl p-3 flex flex-col justify-between min-h-[90px]">
          <span className="text-[11px] font-medium text-slate-400">{label}</span>
          <span className="text-sm font-semibold text-slate-400">Not Operating</span>
          <div className="h-1 bg-slate-200 rounded-full w-full opacity-40"></div>
        </div>
      );
    }

    const seconds = arrival.durationSeconds ?? 0;
    const isArriving = seconds <= 60;
    const minutes = Math.floor(seconds / 60);

    const loadConfig: Record<BusLoad, { text: string; bg: string; border: string; textCol: string; bar: string }> = {
      SEA: {
        text: 'Seats Avail',
        bg: 'bg-emerald-50',
        border: 'border-emerald-200',
        textCol: 'text-emerald-700',
        bar: 'bg-emerald-500',
      },
      SDA: {
        text: 'Standing',
        bg: 'bg-amber-50',
        border: 'border-amber-200',
        textCol: 'text-amber-700',
        bar: 'bg-amber-500',
      },
      LSD: {
        text: 'Crowded',
        bg: 'bg-rose-50',
        border: 'border-rose-200',
        textCol: 'text-rose-700',
        bar: 'bg-rose-500',
      },
    };

    const load = loadConfig[arrival.Load] || loadConfig.SEA;

    return (
      <div className={`flex-1 rounded-xl p-2.5 sm:p-3 border transition-all ${
        isArriving
          ? 'bg-emerald-50/60 border-emerald-300 shadow-xs'
          : 'bg-slate-50 border-slate-200/80 hover:border-slate-300'
      }`}>
        <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
          <span className="font-medium text-slate-600">{label}</span>
          <div className="flex items-center gap-1">
            {arrival.Feature === 'WAB' && (
              <span className="text-sky-600 font-medium" title="Wheelchair Accessible (WAB)">♿</span>
            )}
            <span className="font-mono text-[10px] font-semibold text-slate-600" title={`Bus Type: ${arrival.Type === 'DD' ? 'Double Deck' : arrival.Type === 'BD' ? 'Bendy' : 'Single Deck'}`}>
              {arrival.Type}
            </span>
          </div>
        </div>

        {/* Big countdown badge */}
        <div className="flex items-baseline gap-1 my-1">
          {isArriving ? (
            <span className="text-xl sm:text-2xl font-extrabold text-emerald-700 font-mono tracking-tight animate-pulse">
              Arr
            </span>
          ) : (
            <>
              <span className="text-xl sm:text-2xl font-extrabold text-slate-900 font-mono tracking-tight tabular-nums">
                {minutes}
              </span>
              <span className="text-xs font-semibold text-slate-500">min</span>
            </>
          )}
        </div>

        {/* Load Status Bar & Label */}
        <div className="mt-2">
          <div className="flex items-center justify-between text-[10px] font-medium mb-1">
            <span className={load.textCol}>{load.text}</span>
            {arrival.stopsAway !== undefined && arrival.stopsAway > 0 && (
              <span className="text-slate-400 font-mono text-[10px]">
                {arrival.stopsAway} {arrival.stopsAway === 1 ? 'stop' : 'stops'}
              </span>
            )}
          </div>
          <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
            <div className={`h-full rounded-full ${load.bar}`} style={{ width: arrival.Load === 'SEA' ? '35%' : arrival.Load === 'SDA' ? '70%' : '100%' }}></div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs hover:shadow-md transition-shadow">
      {/* Top Header of Service Card */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          {/* Big Bus Number Badge */}
          <div className="min-w-[64px] h-12 px-3 rounded-xl bg-slate-900 text-white flex items-center justify-center font-mono font-extrabold text-2xl tracking-tight shadow-sm">
            {service.ServiceNo}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-700">
                {operator.name}
              </span>
              <span className="text-slate-300">·</span>
              <span className="text-xs text-slate-500">
                Dir {service.direction || 1}
              </span>
            </div>
            <div className="text-xs text-slate-500 mt-0.5">
              First: <span className="font-mono text-slate-700">{service.firstBusWeekday || '05:30'}</span> · Last: <span className="font-mono text-slate-700">{service.lastBusWeekday || '23:50'}</span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => onToggleAlarm(service.ServiceNo)}
            title={hasAlarm ? 'Cancel arrival alert' : 'Set 2-min arrival alert'}
            className={`p-2 rounded-lg cursor-pointer transition-colors ${
              hasAlarm
                ? 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
            }`}
          >
            {hasAlarm ? <BellRing className="w-4 h-4 text-amber-600 animate-bounce" /> : <Bell className="w-4 h-4" />}
          </button>

          <button
            onClick={() => onViewRoute(service.ServiceNo)}
            title="View route map and stops"
            className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer transition-colors"
          >
            <Eye className="w-4 h-4" />
          </button>

          <button
            onClick={() => onToggleFavorite(service.ServiceNo)}
            title={isFavorite ? 'Remove from favorites' : 'Star this service'}
            className={`p-2 rounded-lg cursor-pointer transition-colors ${
              isFavorite
                ? 'bg-amber-50 text-amber-500 hover:bg-amber-100'
                : 'text-slate-400 hover:text-amber-500 hover:bg-slate-100'
            }`}
          >
            <Star className={`w-4 h-4 ${isFavorite ? 'fill-amber-400 text-amber-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Subsequent Arrivals 3-column row */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        {renderArrivalSlot(service.NextBus, 'Next Bus')}
        {renderArrivalSlot(service.NextBus2, '2nd Bus')}
        {renderArrivalSlot(service.NextBus3, '3rd Bus')}
      </div>
    </div>
  );
};
