
import React from 'react';
import { SecurityEvent } from '../types';
import { CheckCircle, XCircle, Clock } from 'lucide-react';

interface ActivityLogProps {
  events: SecurityEvent[];
}

const ActivityLog: React.FC<ActivityLogProps> = ({ events }) => {
  return (
    <div className="glass rounded-2xl p-6 h-1/2 flex flex-col overflow-hidden">
      <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-zinc-100">
        <Clock className="text-zinc-400 w-5 h-5" />
        Live Event Stream
      </h2>
      <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-thin scrollbar-thumb-zinc-800">
        {events.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-zinc-600 italic">
            <p>No activity recorded</p>
          </div>
        )}
        {events.map((event) => (
          <div key={event.id} className="p-3 bg-zinc-900 border border-zinc-800 rounded-xl flex gap-3 animate-in slide-in-from-right duration-300">
            <div className="mt-1">
              {event.status === 'SUCCESS' ? (
                <CheckCircle className="w-4 h-4 text-emerald-500" />
              ) : event.status === 'FAILURE' ? (
                <XCircle className="w-4 h-4 text-red-500" />
              ) : (
                <Clock className="w-4 h-4 text-zinc-500" />
              )}
            </div>
            <div className="flex-1 flex flex-col">
              <div className="flex justify-between items-start">
                <span className="text-xs font-bold text-zinc-400 mono">
                  {String(event.phase).replace('_VERIFIED', '')}
                </span>
                <span className="text-[10px] text-zinc-500">
                  {event.timestamp.toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
              </div>
              <p className="text-sm text-zinc-300 mt-1">{String(event.details)}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ActivityLog;
