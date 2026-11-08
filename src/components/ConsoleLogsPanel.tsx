import React, { useState } from 'react';
import { BotLog } from '../types/trading';
import { Terminal, Trash2, ShieldAlert, CheckCircle, TrendingUp, Info } from 'lucide-react';

interface ConsoleLogsPanelProps {
  logs: BotLog[];
  onClearLogs: () => void;
}

export const ConsoleLogsPanel: React.FC<ConsoleLogsPanelProps> = ({ logs, onClearLogs }) => {
  const [filter, setFilter] = useState<string>('all');

  const filteredLogs = logs.filter((log) => {
    if (filter === 'all') return true;
    return log.type === filter;
  });

  return (
    <div className="flex flex-col h-full bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
      {/* Console Header */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-950/70 border-b border-slate-800 text-xs">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-emerald-400" />
          <span className="font-semibold text-white">Automated M5 Engine Console</span>
          <span className="text-[11px] text-slate-500 font-mono">({logs.length} events)</span>
        </div>

        {/* Filter buttons */}
        <div className="flex items-center gap-1">
          {['all', 'signal', 'execution', 'autotrail', 'ghost', 'alert'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-2 py-0.5 text-[10px] uppercase font-semibold rounded transition-colors ${
                filter === f
                  ? 'bg-slate-800 text-white'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              {f === 'autotrail' ? 'auto-trail' : f}
            </button>
          ))}
          <button
            onClick={onClearLogs}
            title="Clear Console"
            className="p-1 text-slate-500 hover:text-rose-400 transition-colors ml-2"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Logs Scroll Area */}
      <div className="flex-1 p-3 font-mono text-[11px] space-y-1.5 overflow-y-auto bg-slate-950/90 text-slate-300 max-h-[220px]">
        {filteredLogs.length === 0 ? (
          <div className="text-slate-600 italic py-2">Listening for M5 ticks and bridge events...</div>
        ) : (
          filteredLogs.map((log) => {
            const timeStr = new Date(log.timestamp).toLocaleTimeString([], {
              hour12: false,
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit'
            });

            let badgeColor = 'text-sky-400';
            if (log.type === 'signal') badgeColor = 'text-yellow-400';
            if (log.type === 'execution') badgeColor = 'text-emerald-400 font-bold';
            if (log.type === 'autotrail') badgeColor = 'text-amber-400 font-bold';
            if (log.type === 'ghost') badgeColor = 'text-purple-400 font-bold';
            if (log.type === 'alert') badgeColor = 'text-orange-400 font-bold';
            if (log.type === 'error') badgeColor = 'text-rose-400 font-bold';

            return (
              <div key={log.id} className="flex items-start gap-2 leading-relaxed">
                <span className="text-slate-500 shrink-0 tabular-nums">[{timeStr}]</span>
                <span className={`shrink-0 uppercase text-[10px] ${badgeColor}`}>
                  [{log.type}]
                </span>
                {log.symbol && (
                  <span className="text-slate-200 font-semibold shrink-0">
                    {log.symbol}:
                  </span>
                )}
                <span className="text-slate-300 break-words">{log.message}</span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
