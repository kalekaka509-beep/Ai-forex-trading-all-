import React, { useState } from 'react';
import { BotConfig, Candle, DecisionLineInfo, MarketCategory, TickQuote } from '../types/trading';
import { ALL_SYMBOLS, CATEGORY_LABELS } from '../constants/symbols';
import { analyzeM5Signal } from '../utils/technicalAnalysis';
import { Eye, Play, CheckSquare, Square, TrendingUp, TrendingDown, Clock, ShieldAlert } from 'lucide-react';

interface M5ScannerPanelProps {
  quotes: Record<string, TickQuote>;
  candles: Record<string, Candle[]>;
  config: BotConfig;
  decisionLines?: Record<string, DecisionLineInfo>;
  selectedSymbol: string;
  onSelectSymbol: (symbol: string) => void;
  onTogglePair: (symbol: string) => void;
  onToggleAllPairs: (enable: boolean) => void;
  onManualTrade: (symbol: string, direction: 'BUY' | 'SELL') => void;
}

export const M5ScannerPanel: React.FC<M5ScannerPanelProps> = ({
  quotes,
  candles,
  config,
  decisionLines,
  selectedSymbol,
  onSelectSymbol,
  onTogglePair,
  onToggleAllPairs,
  onManualTrade
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Calculate 5-minute candle remaining seconds
  const now = Date.now();
  const fiveMinMs = 5 * 60 * 1000;
  const candleRemainingSec = Math.floor((fiveMinMs - (now % fiveMinMs)) / 1000);
  const minutesLeft = Math.floor(candleRemainingSec / 60);
  const secondsLeft = candleRemainingSec % 60;
  const formattedCountdown = `${String(minutesLeft).padStart(2, '0')}:${String(secondsLeft).padStart(2, '0')}`;

  const filteredSymbols = ALL_SYMBOLS.filter((s) => {
    const matchesCategory = selectedCategory === 'all' || s.category === selectedCategory;
    const matchesSearch =
      s.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const allActive = ALL_SYMBOLS.every((s) => config.selectedPairs.includes(s.symbol));

  return (
    <div className="flex flex-col h-full bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
      {/* Scanner Header */}
      <div className="p-4 border-b border-slate-800 bg-slate-950/50">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <span>M5 Real-Time Multi-Pair Scanner</span>
              <span className="text-xs text-slate-400 font-normal">
                ({config.selectedPairs.length} of {ALL_SYMBOLS.length} Pairs Armed)
              </span>
            </h2>
            <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
              <span>Strategy: <strong className="text-slate-200 capitalize">{config.strategy.replace('_', ' ')}</strong></span>
              <span aria-hidden="true">·</span>
              <span className="flex items-center gap-1 font-mono text-amber-400">
                <Clock className="w-3.5 h-3.5" /> M5 Candle Close: {formattedCountdown}
              </span>
            </div>
          </div>

          {/* All pairs bulk toggle */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => onToggleAllPairs(!allActive)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
            >
              {allActive ? <CheckSquare className="w-3.5 h-3.5 text-emerald-400" /> : <Square className="w-3.5 h-3.5" />}
              <span>{allActive ? 'Deselect All' : 'Select All Pairs'}</span>
            </button>
          </div>
        </div>

        {/* Filter Bar & Search */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          {/* Category Tabs */}
          <div className="flex items-center gap-1 p-1 bg-slate-900 rounded-lg border border-slate-800 text-xs">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-2.5 py-1 rounded transition-colors whitespace-nowrap ${
                selectedCategory === 'all'
                  ? 'bg-slate-800 text-white font-medium shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All Pairs ({ALL_SYMBOLS.length})
            </button>
            {(['forex_major', 'forex_cross', 'metal_commodity', 'crypto_index'] as MarketCategory[]).map(
              (cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-2.5 py-1 rounded transition-colors whitespace-nowrap ${
                    selectedCategory === cat
                      ? 'bg-slate-800 text-white font-medium shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {CATEGORY_LABELS[cat]}
                </button>
              )
            )}
          </div>

          {/* Search Input */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search pair (e.g. XAUUSD)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="px-3 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-md text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500 w-44"
            />
          </div>
        </div>
      </div>

      {/* Table of Pairs */}
      <div className="flex-1 overflow-x-auto overflow-y-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-950/80 text-slate-400 font-medium">
              <th className="py-2.5 px-3 w-10">Auto</th>
              <th className="py-2.5 px-3">Symbol / Pair</th>
              <th className="py-2.5 px-3 text-right">Bid / Ask</th>
              <th className="py-2.5 px-3 text-right">Spread</th>
              <th className="py-2.5 px-3 text-center">EMA Ribbon</th>
              <th className="py-2.5 px-3 text-center">🎯 Decision Line</th>
              <th className="py-2.5 px-3 text-center">RSI (14)</th>
              <th className="py-2.5 px-3 text-center">M5 Signal</th>
              <th className="py-2.5 px-3 text-center">Confidence</th>
              <th className="py-2.5 px-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {filteredSymbols.map((item) => {
              const isSelected = selectedSymbol === item.symbol;
              const isArmed = config.selectedPairs.includes(item.symbol);
              const quote = quotes[item.symbol];
              const symbolCandles = candles[item.symbol] || [];
              const lastCandle = symbolCandles[symbolCandles.length - 1];

              // Indicator states
              const ema9 = lastCandle?.ema9;
              const ema21 = lastCandle?.ema21;
              const ema50 = lastCandle?.ema50;
              const rsi = lastCandle?.rsi ?? 50;

              let ribbonStatus = 'Neutral';
              let ribbonColor = 'text-slate-400';
              if (ema9 && ema21 && ema50) {
                if (ema9 > ema21 && ema21 > ema50) {
                  ribbonStatus = 'Bullish';
                  ribbonColor = 'text-emerald-400 font-semibold';
                } else if (ema9 < ema21 && ema21 < ema50) {
                  ribbonStatus = 'Bearish';
                  ribbonColor = 'text-rose-400 font-semibold';
                }
              }

              // Evaluate Signal
              const signal = analyzeM5Signal(
                item.symbol,
                symbolCandles,
                config.strategy,
                config.slPips,
                config.tpPips
              );

              const spreadExcess = (quote?.spread || 0) > config.maxSpreadPips;

              return (
                <tr
                  key={item.symbol}
                  onClick={() => onSelectSymbol(item.symbol)}
                  className={`cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-sky-950/40 border-l-2 border-l-sky-500'
                      : 'hover:bg-slate-800/40'
                  }`}
                >
                  {/* Auto-trade checkbox */}
                  <td
                    className="py-2 px-3"
                    onClick={(e) => {
                      e.stopPropagation();
                      onTogglePair(item.symbol);
                    }}
                  >
                    <button className="text-slate-400 hover:text-white">
                      {isArmed ? (
                        <CheckSquare className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-600" />
                      )}
                    </button>
                  </td>

                  {/* Symbol & Name */}
                  <td className="py-2 px-3">
                    <div className="flex items-center gap-1.5 font-bold text-white">
                      <span>{item.symbol}</span>
                      <span className="text-[10px] text-slate-400 font-normal">
                        {item.name}
                      </span>
                    </div>
                  </td>

                  {/* Bid / Ask */}
                  <td className="py-2 px-3 text-right font-mono tabular-nums">
                    {quote ? (
                      <div>
                        <span className="text-emerald-400 font-medium">
                          {quote.bid.toFixed(item.digits)}
                        </span>
                        <span className="text-slate-500 mx-1">/</span>
                        <span className="text-slate-300">
                          {quote.ask.toFixed(item.digits)}
                        </span>
                      </div>
                    ) : (
                      <span className="text-slate-500">--</span>
                    )}
                  </td>

                  {/* Spread */}
                  <td className="py-2 px-3 text-right font-mono tabular-nums">
                    {quote ? (
                      <div className="flex items-center justify-end gap-1">
                        {spreadExcess && (
                          <span title="Spread exceeds max limit">
                            <ShieldAlert className="w-3 h-3 text-amber-400" />
                          </span>
                        )}
                        <span
                          className={
                            spreadExcess ? 'text-amber-400 font-medium' : 'text-slate-300'
                          }
                        >
                          {quote.spread.toFixed(1)} p
                        </span>
                      </div>
                    ) : (
                      <span className="text-slate-500">--</span>
                    )}
                  </td>

                  {/* EMA Ribbon */}
                  <td className="py-2 px-3 text-center">
                    <span className={ribbonColor}>{ribbonStatus}</span>
                  </td>

                  {/* Decision Line */}
                  <td className="py-2 px-3 text-center font-mono tabular-nums">
                    {(() => {
                      const dl = decisionLines ? decisionLines[item.symbol] : undefined;
                      if (!dl) return <span className="text-slate-600">--</span>;
                      const isBull = dl.bias === 'BULL';
                      const isBear = dl.bias === 'BEAR';
                      return (
                        <div className="flex flex-col items-center">
                          <span
                            className={`text-[11px] font-bold ${
                              isBull
                                ? 'text-emerald-400'
                                : isBear
                                ? 'text-rose-400'
                                : 'text-slate-400'
                            }`}
                          >
                            {isBull ? '▲ ' : isBear ? '▼ ' : '● '}
                            {dl.price.toFixed(item.digits)}
                          </span>
                          <span className="text-[9px] text-slate-400">
                            {dl.distancePips >= 0 ? '+' : ''}
                            {dl.distancePips}p ({dl.bias})
                          </span>
                        </div>
                      );
                    })()}
                  </td>

                  {/* RSI */}
                  <td className="py-2 px-3 text-center font-mono tabular-nums">
                    <span
                      className={
                        rsi >= 70
                          ? 'text-rose-400 font-semibold'
                          : rsi <= 30
                          ? 'text-emerald-400 font-semibold'
                          : 'text-slate-300'
                      }
                    >
                      {rsi.toFixed(1)}
                    </span>
                  </td>

                  {/* M5 Signal */}
                  <td className="py-2 px-3 text-center">
                    {signal ? (
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold ${
                          signal.direction === 'BUY'
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                            : 'bg-rose-950 text-rose-400 border border-rose-800'
                        }`}
                      >
                        {signal.direction === 'BUY' ? (
                          <TrendingUp className="w-3 h-3" />
                        ) : (
                          <TrendingDown className="w-3 h-3" />
                        )}
                        {signal.direction}
                      </span>
                    ) : (
                      <span className="text-slate-500 text-[11px]">Hold</span>
                    )}
                  </td>

                  {/* Score */}
                  <td className="py-2 px-3 text-center font-mono tabular-nums">
                    {signal ? (
                      <div className="flex items-center justify-center gap-1.5">
                        <div className="w-12 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${
                              signal.score >= 85
                                ? 'bg-emerald-500'
                                : signal.score >= 75
                                ? 'bg-sky-500'
                                : 'bg-amber-500'
                            }`}
                            style={{ width: `${signal.score}%` }}
                          />
                        </div>
                        <span className="text-[11px] font-semibold text-slate-200">
                          {signal.score}%
                        </span>
                      </div>
                    ) : (
                      <span className="text-slate-500 text-[11px]">--</span>
                    )}
                  </td>

                  {/* Actions */}
                  <td
                    className="py-2 px-3 text-right"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => onSelectSymbol(item.symbol)}
                        title="View M5 Chart"
                        className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onManualTrade(item.symbol, 'BUY')}
                        className="px-2 py-0.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-[11px] transition-colors"
                      >
                        BUY
                      </button>
                      <button
                        onClick={() => onManualTrade(item.symbol, 'SELL')}
                        className="px-2 py-0.5 rounded bg-rose-600 hover:bg-rose-500 text-white font-semibold text-[11px] transition-colors"
                      >
                        SELL
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
