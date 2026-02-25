
import React from 'react';
import { SecurityEvent } from '../types';
import { CheckCircle, XCircle, Clock } from 'lucide-react';

interface ActivityLogProps {
  events: SecurityEvent[];
}

const ActivityLog: React.FC<ActivityLogProps> = ({ events }) => {
  return (
    <div className="glass rounded-3xl p-5 md:p-6 h-1/2 flex flex-col overflow-hidden relative">
      <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-cyan-500/5 to-transparent pointer-events-none rounded-t-3xl" />

      <div className="relative flex items-center justify-between mb-4">
        <h2 className="text-base md:text-lg font-bold flex items-center gap-2">
          <div className="p-2 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-xl">
            <Clock className="text-cyan-400 w-4 h-4 md:w-5 md:h-5" />
          </div>
          <span className="bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
            Live Event Stream
          </span>
        </h2>
        {events.length > 0 && (
          <span className="px-3 py-1 bg-cyan-500/10 border border-cyan-500/20 rounded-full text-xs font-bold text-cyan-400">
            {events.length}
          </span>
        )}
      </div>

      <div className="flex-1 overflow-y-auto space-y-2.5 pr-2 scrollbar-thin">
        {events.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center p-6">
            <div className="w-16 h-16 rounded-full bg-slate-800/30 flex items-center justify-center mb-3">
              <Clock className="w-8 h-8 text-slate-700" />
            </div>
            <p className="text-sm text-slate-600 font-medium">No activity recorded</p>
            <p className="text-xs text-slate-700 mt-1">Events will appear here in real-time</p>
          </div>
        )}
        {events.map((event) => (
          <div
            key={event.id}
            className="group p-3 md:p-4 bg-gradient-to-r from-white/5 to-white/[0.02] hover:from-white/10 hover:to-white/5 border border-white/5 hover:border-white/10 rounded-2xl flex gap-3 transition-all duration-300 animate-in"
          >
            <div className="mt-1 flex-shrink-0">
              {event.status === 'SUCCESS' ? (
                <div className="p-1.5 bg-green-500/10 rounded-lg">
                  <CheckCircle className="w-3.5 h-3.5 md:w-4 md:h-4 text-green-400" />
                </div>
              ) : event.status === 'FAILURE' ? (
                <div className="p-1.5 bg-red-500/10 rounded-lg">
                  <XCircle className="w-3.5 h-3.5 md:w-4 md:h-4 text-red-400" />
                </div>
              ) : (
                <div className="p-1.5 bg-slate-500/10 rounded-lg">
                  <Clock className="w-3.5 h-3.5 md:w-4 md:h-4 text-slate-400" />
                </div>
              )}
            </div>
            <div className="flex-1 flex flex-col min-w-0">
              <div className="flex justify-between items-start gap-2">
                <span className="text-xs font-bold text-slate-300 mono truncate">
                  {String(event.phase).replace('_VERIFIED', '')}
                </span>
                <span className="text-[10px] text-slate-500 mono flex-shrink-0">
                  {event.timestamp.toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
              </div>
              <p className="text-xs md:text-sm text-slate-400 group-hover:text-slate-300 mt-1.5 leading-relaxed transition-colors">
                {String(event.details)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ActivityLog;
