import React, { useState } from 'react';
import { Candle, GroqAIDeepSearchResult, SMCOverview, TickQuote } from '../types/trading';
import { ALL_SYMBOLS } from '../constants/symbols';
import {
  Sparkles,
  Zap,
  TrendingUp,
  TrendingDown,
  Shield,
  EyeOff,
  CheckCircle,
  X,
  RefreshCw,
  Cpu,
  Layers,
  ArrowRight
} from 'lucide-react';

interface GroqAIDeepSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  symbol: string;
  quote?: TickQuote;
  candles: Candle[];
  smc?: SMCOverview;
  onExecuteTrade: (symbol: string, direction: 'BUY' | 'SELL', sl: number, tp: number, reason: string) => void;
}

export const GroqAIDeepSearchModal: React.FC<GroqAIDeepSearchModalProps> = ({
  isOpen,
  onClose,
  symbol,
  quote,
  candles,
  smc,
  onExecuteTrade
}) => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GroqAIDeepSearchResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const symbolDef = ALL_SYMBOLS.find((s) => s.symbol === symbol) || ALL_SYMBOLS[0];
  const lastCandle = candles[candles.length - 1];

  const handleRunDeepSearch = async () => {
    setLoading(true);
    setError(null);

    try {
      const payload = {
        symbol,
        price: quote?.bid || symbolDef.basePrice,
        spread: quote?.spread || symbolDef.spreadPips,
        digits: symbolDef.digits,
        pipSize: symbolDef.pipSize,
        ema9: lastCandle?.ema9,
        ema21: lastCandle?.ema21,
        ema50: lastCandle?.ema50,
        rsi: lastCandle?.rsi,
        atr: lastCandle?.atr,
        smcData: smc || {}
      };

      const res = await fetch('/api/ai/deep-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        throw new Error(`Server returned HTTP ${res.status}`);
      }

      const data: GroqAIDeepSearchResult = await res.json();
      setResult(data);
    } catch (err: any) {
      setError(err?.message || 'Failed to complete deep search');
    } finally {
      setLoading(false);
    }
  };

  const handleExecute = () => {
    if (!result || result.direction === 'WAIT') return;
    onExecuteTrade(symbol, result.direction, result.ghostSL, result.ghostTP, `Groq AI Deep Search (${result.confidence}%)`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className="relative flex flex-col w-full max-w-2xl max-h-[92vh] bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Sparkles className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>Groq AI Market Deep Search</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-sky-950 text-sky-300 font-mono">
                  LPU Ultra-Fast Inference
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Institutional market deep search for {symbol} ({symbolDef.name})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 p-6 space-y-5 overflow-y-auto text-xs">
          {/* Quick Context Summary */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-950 border border-slate-800 rounded-lg">
            <div className="flex items-center gap-3">
              <span className="font-bold text-white text-sm">{symbol}</span>
              <span className="text-slate-400 font-mono">
                Price: <strong className="text-emerald-400">{quote?.bid.toFixed(symbolDef.digits)}</strong>
              </span>
              <span className="text-slate-500">·</span>
              <span className="text-slate-400 font-mono">
                Spread: <strong>{quote?.spread.toFixed(1)} pips</strong>
              </span>
            </div>

            <button
              onClick={handleRunDeepSearch}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 font-bold text-xs rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-colors disabled:opacity-50 shadow-sm"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Deep Searching Market...</span>
                </>
              ) : (
                <>
                  <Zap className="w-3.5 h-3.5" />
                  <span>Execute Groq AI Deep Search</span>
                </>
              )}
            </button>
          </div>

          {/* Deep Search Results Card */}
          {result ? (
            <div className="space-y-4">
              {/* Decision Strip */}
              <div
                className={`p-4 rounded-xl border flex items-center justify-between ${
                  result.direction === 'BUY'
                    ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                    : result.direction === 'SELL'
                    ? 'bg-rose-950/40 border-rose-500/40 text-rose-300'
                    : 'bg-amber-950/40 border-amber-500/40 text-amber-300'
                }`}
              >
                <div>
                  <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
                    Groq AI Trade Verdict
                  </div>
                  <div className="text-2xl font-black mt-0.5 flex items-center gap-2">
                    {result.direction === 'BUY' ? (
                      <TrendingUp className="w-6 h-6 text-emerald-400" />
                    ) : result.direction === 'SELL' ? (
                      <TrendingDown className="w-6 h-6 text-rose-400" />
                    ) : (
                      <Shield className="w-6 h-6 text-amber-400" />
                    )}
                    <span>{result.direction}</span>
                    <span className="text-sm font-semibold text-slate-300 font-mono">
                      ({result.confidence}% Confidence)
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-[11px] font-mono text-slate-400">Inference Engine</div>
                  <div className="text-xs font-bold text-white mt-0.5">{result.provider}</div>
                  <div className="text-[10px] text-slate-500 font-mono">{result.model}</div>
                </div>
              </div>

              {/* Levels & Ghost SL Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg">
                  <div className="text-[10px] text-slate-500 font-mono">Optimal Entry</div>
                  <div className="text-sm font-bold font-mono text-white mt-0.5">
                    {result.entryPrice.toFixed(symbolDef.digits)}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Market Order</div>
                </div>

                <div className="p-3 bg-slate-950 border border-purple-900/40 rounded-lg">
                  <div className="text-[10px] text-purple-400 font-mono flex items-center gap-1">
                    <EyeOff className="w-3 h-3" /> Ghost Stop Loss
                  </div>
                  <div className="text-sm font-bold font-mono text-rose-400 mt-0.5">
                    {result.ghostSL.toFixed(symbolDef.digits)}
                  </div>
                  <div className="text-[10px] text-purple-400 mt-0.5">Invisible to Broker</div>
                </div>

                <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg">
                  <div className="text-[10px] text-slate-500 font-mono">Ghost Take Profit</div>
                  <div className="text-sm font-bold font-mono text-emerald-400 mt-0.5">
                    {result.ghostTP.toFixed(symbolDef.digits)}
                  </div>
                  <div className="text-[10px] text-emerald-400 mt-0.5">1:2+ R:R Target</div>
                </div>

                <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg">
                  <div className="text-[10px] text-slate-500 font-mono">Risk / Reward</div>
                  <div className="text-sm font-bold font-mono text-sky-400 mt-0.5">
                    {result.riskRewardRatio}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">{result.macroBias}</div>
                </div>
              </div>

              {/* Deep Search Reasoning */}
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg space-y-2">
                <div className="font-semibold text-white flex items-center gap-1.5">
                  <Cpu className="w-4 h-4 text-sky-400" />
                  <span>Deep Search Institutional Analysis</span>
                </div>
                <p className="text-slate-300 leading-relaxed text-[11px] font-sans">
                  {result.deepSearchSummary}
                </p>

                <div className="pt-2 border-t border-slate-800 space-y-1">
                  <span className="text-[10px] uppercase font-mono text-slate-400 block font-semibold">
                    Key Order Flow Confluences:
                  </span>
                  {result.institutionalFactors.map((factor, i) => (
                    <div key={i} className="flex items-start gap-2 text-[11px] text-slate-300">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{factor}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-slate-400 bg-slate-950/40 border border-slate-800/80 rounded-xl space-y-2">
              <Sparkles className="w-8 h-8 text-slate-600 mx-auto" />
              <p className="text-sm font-semibold text-slate-300">
                Ready for Groq AI Market Deep Search
              </p>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Click &quot;Execute Groq AI Deep Search&quot; to perform multi-factor quantitative institutional reasoning on {symbol}&apos;s M5 order flow, SMC Fair Value Gaps, and liquidity sweeps.
              </p>
            </div>
          )}

          {error && (
            <div className="p-3 bg-rose-950/40 border border-rose-800 text-rose-300 rounded-lg text-xs">
              Error during Deep Search: {error}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-6 py-3.5 border-t border-slate-800 bg-slate-950/70">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white rounded-lg transition-colors"
          >
            Close
          </button>

          {result && result.direction !== 'WAIT' && (
            <button
              onClick={handleExecute}
              className="flex items-center gap-2 px-5 py-2 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-colors shadow-sm"
            >
              <span>Execute 0.01 Lot {result.direction} via MT5</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
