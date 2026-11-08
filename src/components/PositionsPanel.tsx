import React, { useState } from 'react';
import { ClosedTrade, Position } from '../types/trading';
import { ALL_SYMBOLS } from '../constants/symbols';
import { CheckCircle2, XCircle, Shield, X, AlertTriangle, Zap } from 'lucide-react';

interface PositionsPanelProps {
  positions: Position[];
  history: ClosedTrade[];
  onClosePosition: (ticket: number) => void;
  onCloseAll: () => void;
  onCloseProfitable: () => void;
  onBreakEvenPosition: (ticket: number) => void;
}

export const PositionsPanel: React.FC<PositionsPanelProps> = ({
  positions,
  history,
  onClosePosition,
  onCloseAll,
  onCloseProfitable,
  onBreakEvenPosition
}) => {
  const [activeTab, setActiveTab] = useState<'open' | 'history'>('open');

  const totalFloatingUSD = positions.reduce((acc, p) => acc + p.profit, 0);
  const totalFloatingPips = positions.reduce((acc, p) => acc + p.profitPips, 0);

  // Performance stats for closed trades
  const wins = history.filter((t) => t.profit > 0);
  const losses = history.filter((t) => t.profit < 0);
  const winRate = history.length > 0 ? (wins.length / history.length) * 100 : 0;
  const totalRealizedUSD = history.reduce((acc, t) => acc + t.profit, 0);
  const totalGrossWin = wins.reduce((acc, t) => acc + t.profit, 0);
  const totalGrossLoss = Math.abs(losses.reduce((acc, t) => acc + t.profit, 0));
  const profitFactor = totalGrossLoss > 0 ? totalGrossWin / totalGrossLoss : totalGrossWin > 0 ? 9.99 : 1.0;

  return (
    <div className="flex flex-col h-full bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
      {/* Panel Top Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-slate-950/60 border-b border-slate-800">
        <div className="flex items-center gap-2">
          {/* Tab Selector */}
          <div className="flex items-center gap-1 p-0.5 bg-slate-900 rounded-md border border-slate-800 text-xs">
            <button
              onClick={() => setActiveTab('open')}
              className={`px-3 py-1 font-medium rounded transition-colors ${
                activeTab === 'open'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Open Positions ({positions.length})
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-3 py-1 font-medium rounded transition-colors ${
                activeTab === 'history'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Trade History ({history.length})
            </button>
          </div>

          {/* Floating PnL Summary */}
          {activeTab === 'open' && (
            <div className="hidden sm:flex items-center gap-2 text-xs font-mono tabular-nums ml-2">
              <span className="text-slate-400">Floating:</span>
              <span
                className={`font-bold ${
                  totalFloatingUSD >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {totalFloatingUSD >= 0 ? '+' : ''}${totalFloatingUSD.toFixed(2)}
              </span>
              <span className="text-slate-500">
                ({totalFloatingPips >= 0 ? '+' : ''}{totalFloatingPips.toFixed(1)} pips)
              </span>
            </div>
          )}
        </div>

        {/* Global Position Controls */}
        {activeTab === 'open' && positions.length > 0 && (
          <div className="flex items-center gap-2">
            <button
              onClick={onCloseProfitable}
              className="px-2.5 py-1 text-xs font-medium rounded bg-emerald-950 text-emerald-300 hover:bg-emerald-900 border border-emerald-800 transition-colors"
            >
              Close In-Profit
            </button>
            <button
              onClick={onCloseAll}
              className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded bg-rose-950 text-rose-300 hover:bg-rose-900 border border-rose-800 transition-colors"
            >
              <AlertTriangle className="w-3 h-3" />
              <span>Close All</span>
            </button>
          </div>
        )}

        {/* History Stats Bar */}
        {activeTab === 'history' && (
          <div className="flex items-center gap-4 text-xs font-mono tabular-nums">
            <span>Win Rate: <strong className="text-emerald-400">{winRate.toFixed(1)}%</strong></span>
            <span>Profit Factor: <strong className="text-sky-400">{profitFactor.toFixed(2)}</strong></span>
            <span>
              Realized PnL:{' '}
              <strong className={totalRealizedUSD >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                {totalRealizedUSD >= 0 ? '+' : ''}${totalRealizedUSD.toFixed(2)}
              </strong>
            </span>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-x-auto overflow-y-auto">
        {activeTab === 'open' ? (
          positions.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center text-slate-400">
              <Shield className="w-9 h-9 text-slate-600 mb-2" />
              <p className="text-sm font-medium text-slate-300">No Open Positions</p>
              <p className="text-xs text-slate-500 max-w-sm mt-1">
                The M5 algorithm is actively scanning market pairs. When criteria match, trades will automatically execute here.
              </p>
            </div>
          ) : (
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/80 text-slate-400 font-medium">
                  <th className="py-2 px-3">Ticket</th>
                  <th className="py-2 px-3">Pair</th>
                  <th className="py-2 px-3">Type</th>
                  <th className="py-2 px-3 text-right">Volume</th>
                  <th className="py-2 px-3 text-right">Open Price</th>
                  <th className="py-2 px-3 text-right">Current Price</th>
                  <th className="py-2 px-3 text-right">S / L</th>
                  <th className="py-2 px-3 text-right">T / P</th>
                  <th className="py-2 px-3 text-right">Profit ($)</th>
                  <th className="py-2 px-3 text-right">Pips</th>
                  <th className="py-2 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono tabular-nums">
                {positions.map((pos) => {
                  const symbolDef = ALL_SYMBOLS.find((s) => s.symbol === pos.symbol);
                  const digits = symbolDef?.digits || 5;

                  return (
                    <tr key={pos.id} className="hover:bg-slate-800/40">
                      <td className="py-2 px-3 text-slate-400">#{pos.ticket}</td>
                      <td className="py-2 px-3 font-sans font-bold text-white">
                        <div className="flex items-center gap-1.5">
                          <span>{pos.symbol}</span>
                          {pos.atrTrailActive && (
                            <span
                              className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-sans font-semibold bg-amber-950/80 text-amber-300 border border-amber-800/80"
                              title={`Volatility-Adjusted Auto-Trail Active: Ratcheting Stop Loss (${pos.currentAtrDistance ? pos.currentAtrDistance + 'p ATR buffer' : 'Dynamic ATR'})`}
                            >
                              <Zap className="w-2.5 h-2.5 text-amber-400" />
                              <span>Auto-Trail</span>
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-2 px-3">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            pos.type === 'BUY'
                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                              : 'bg-rose-950 text-rose-400 border border-rose-800'
                          }`}
                        >
                          {pos.type}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-right text-slate-200">{pos.lot.toFixed(2)}</td>
                      <td className="py-2 px-3 text-right text-slate-300">
                        {pos.openPrice.toFixed(digits)}
                      </td>
                      <td className="py-2 px-3 text-right text-slate-200 font-semibold">
                        {pos.currentPrice.toFixed(digits)}
                      </td>
                      <td className="py-2 px-3 text-right">
                        <div className="text-rose-400/90 font-mono">{pos.sl.toFixed(digits)}</div>
                        {pos.atrTrailActive ? (
                          <div className="text-[9px] font-sans text-amber-400 font-medium flex items-center justify-end gap-0.5 mt-0.5">
                            <Zap className="w-2.5 h-2.5" />
                            <span>ATR Locked</span>
                          </div>
                        ) : pos.ghostSL ? (
                          <div className="text-[9px] font-sans text-purple-400 mt-0.5">Stealth Ghost</div>
                        ) : null}
                      </td>
                      <td className="py-2 px-3 text-right text-emerald-400/90">{pos.tp.toFixed(digits)}</td>
                      <td
                        className={`py-2 px-3 text-right font-bold ${
                          pos.profit >= 0 ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {pos.profit >= 0 ? '+' : ''}${pos.profit.toFixed(2)}
                      </td>
                      <td
                        className={`py-2 px-3 text-right ${
                          pos.profitPips >= 0 ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {pos.profitPips >= 0 ? '+' : ''}{pos.profitPips.toFixed(1)}
                      </td>
                      <td className="py-2 px-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => onBreakEvenPosition(pos.ticket)}
                            title="Lock Break-Even (Move SL to Entry)"
                            className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-sky-400 font-medium text-[10px] transition-colors"
                          >
                            B/E
                          </button>
                          <button
                            onClick={() => onClosePosition(pos.ticket)}
                            title="Close Order"
                            className="p-1 rounded bg-rose-950/80 hover:bg-rose-900 text-rose-300 transition-colors"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )
        ) : history.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-center text-slate-400">
            <CheckCircle2 className="w-9 h-9 text-slate-600 mb-2" />
            <p className="text-sm font-medium text-slate-300">No Closed Trades Yet</p>
            <p className="text-xs text-slate-500 max-w-sm mt-1">
              Executed and closed positions from MT5 / Paper engine will be archived here with detailed PnL metrics.
            </p>
          </div>
        ) : (
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/80 text-slate-400 font-medium">
                <th className="py-2 px-3">Ticket</th>
                <th className="py-2 px-3">Pair</th>
                <th className="py-2 px-3">Type</th>
                <th className="py-2 px-3 text-right">Volume</th>
                <th className="py-2 px-3 text-right">Open Price</th>
                <th className="py-2 px-3 text-right">Close Price</th>
                <th className="py-2 px-3 text-center">Exit Reason</th>
                <th className="py-2 px-3 text-right">Profit ($)</th>
                <th className="py-2 px-3 text-right">Pips</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono tabular-nums">
              {history.map((t) => {
                const symbolDef = ALL_SYMBOLS.find((s) => s.symbol === t.symbol);
                const digits = symbolDef?.digits || 5;

                return (
                  <tr key={t.id} className="hover:bg-slate-800/40">
                    <td className="py-2 px-3 text-slate-400">#{t.ticket}</td>
                    <td className="py-2 px-3 font-sans font-bold text-white">{t.symbol}</td>
                    <td className="py-2 px-3">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          t.type === 'BUY'
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                            : 'bg-rose-950 text-rose-400 border border-rose-800'
                        }`}
                      >
                        {t.type}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-right text-slate-200">{t.lot.toFixed(2)}</td>
                    <td className="py-2 px-3 text-right text-slate-300">
                      {t.openPrice.toFixed(digits)}
                    </td>
                    <td className="py-2 px-3 text-right text-slate-200">
                      {t.closePrice.toFixed(digits)}
                    </td>
                    <td className="py-2 px-3 text-center">
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded ${
                          t.reason === 'TP_HIT'
                            ? 'bg-emerald-950 text-emerald-300'
                            : t.reason === 'TRAILING_SL'
                            ? 'bg-sky-950 text-sky-300'
                            : 'bg-rose-950 text-rose-300'
                        }`}
                      >
                        {t.reason.replace('_', ' ')}
                      </span>
                    </td>
                    <td
                      className={`py-2 px-3 text-right font-bold ${
                        t.profit >= 0 ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {t.profit >= 0 ? '+' : ''}${t.profit.toFixed(2)}
                    </td>
                    <td
                      className={`py-2 px-3 text-right ${
                        t.profitPips >= 0 ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {t.profitPips >= 0 ? '+' : ''}{t.profitPips.toFixed(1)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
