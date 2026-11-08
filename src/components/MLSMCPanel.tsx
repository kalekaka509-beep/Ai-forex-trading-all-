import React from 'react';
import { MLPrediction, SMCOverview } from '../types/trading';
import { BrainCircuit, Cpu, TrendingUp, TrendingDown, Target, Shield, EyeOff } from 'lucide-react';

interface MLSMCPanelProps {
  symbol: string;
  ml?: MLPrediction;
  smc?: SMCOverview;
  dailyTradesTaken: number;
  dailyMaxTrades: number;
  openPositionsCount: number;
  maxOpenTrades: number;
}

export const MLSMCPanel: React.FC<MLSMCPanelProps> = ({
  symbol,
  ml,
  smc,
  dailyTradesTaken,
  dailyMaxTrades,
  openPositionsCount,
  maxOpenTrades
}) => {
  if (!ml) {
    return (
      <div className="flex items-center justify-center h-full p-4 text-xs text-slate-500">
        Initializing Machine Learning & SMC models...
      </div>
    );
  }

  const isBullish = ml.direction === 'BULLISH';
  const isBearish = ml.direction === 'BEARISH';

  return (
    <div className="flex flex-col h-full bg-slate-900 border border-slate-800 rounded-lg overflow-hidden text-xs">
      {/* Top Header */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-950/70 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <BrainCircuit className="w-4 h-4 text-sky-400" />
          <span className="font-bold text-white">ML Inference & Smart Money (SMC)</span>
        </div>
        <span className="text-[11px] font-mono text-slate-400">{symbol}</span>
      </div>

      <div className="flex-1 p-4 space-y-4 overflow-y-auto">
        {/* ML Prediction Meter */}
        <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 font-medium">ML Model Signal:</span>
            <div className="flex items-center gap-1.5 font-bold font-mono">
              {isBullish ? (
                <span className="text-emerald-400 flex items-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5" /> {ml.bullishProbability}% BULLISH
                </span>
              ) : isBearish ? (
                <span className="text-rose-400 flex items-center gap-1">
                  <TrendingDown className="w-3.5 h-3.5" /> {ml.bearishProbability}% BEARISH
                </span>
              ) : (
                <span className="text-amber-400">NEUTRAL (50/50)</span>
              )}
            </div>
          </div>

          {/* Probability Bar */}
          <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden flex">
            <div
              className="h-full bg-emerald-500 transition-all duration-300"
              style={{ width: `${ml.bullishProbability}%` }}
            />
            <div
              className="h-full bg-rose-500 transition-all duration-300"
              style={{ width: `${ml.bearishProbability}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-500">
            <span>Regime: <strong className="text-slate-300">{ml.regime}</strong></span>
            <span>Confidence: <strong className="text-sky-400">{ml.confidenceScore}%</strong></span>
          </div>
        </div>

        {/* Feature Importance Weights */}
        <div className="space-y-2">
          <span className="text-[11px] font-semibold text-slate-300">Feature Importance Breakdown</span>
          <div className="space-y-1.5">
            {ml.features.map((feat, idx) => (
              <div
                key={idx}
                className="p-2 bg-slate-950/60 border border-slate-800/80 rounded flex items-center justify-between"
              >
                <div>
                  <div className="text-[11px] text-slate-300 font-medium">{feat.name}</div>
                  <div className="text-[10px] text-slate-500">{feat.value}</div>
                </div>
                <div className="text-right font-mono tabular-nums">
                  <span
                    className={`text-[11px] font-bold ${
                      feat.impact === 'bullish'
                        ? 'text-emerald-400'
                        : feat.impact === 'bearish'
                        ? 'text-rose-400'
                        : 'text-slate-400'
                    }`}
                  >
                    {feat.weight}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Smart Money Concepts (SMC) Structure */}
        {smc && (
          <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg space-y-2">
            <span className="text-[11px] font-semibold text-white block">SMC Institutional Structure</span>
            <div className="grid grid-cols-2 gap-2 text-[11px] font-mono tabular-nums">
              <div className="p-2 bg-slate-900 border border-slate-800 rounded">
                <div className="text-slate-500 text-[10px]">Break of Structure (BOS)</div>
                <div className="font-bold text-sky-400 mt-0.5">
                  {smc.bosLevel ? `${smc.bosLevel.type.toUpperCase()} @ ${smc.bosLevel.price}` : 'Scanning...'}
                </div>
              </div>

              <div className="p-2 bg-slate-900 border border-slate-800 rounded">
                <div className="text-slate-500 text-[10px]">Change of Character</div>
                <div className="font-bold text-amber-400 mt-0.5">
                  {smc.chochLevel ? `${smc.chochLevel.price}` : 'Consolidation'}
                </div>
              </div>

              <div className="p-2 bg-slate-900 border border-slate-800 rounded">
                <div className="text-slate-500 text-[10px]">Buy-Side Liquidity (BSL)</div>
                <div className="font-bold text-slate-200 mt-0.5">
                  {smc.liquidityPools[0]?.price || '--'}
                </div>
              </div>

              <div className="p-2 bg-slate-900 border border-slate-800 rounded">
                <div className="text-slate-500 text-[10px]">Sell-Side Liquidity (SSL)</div>
                <div className="font-bold text-slate-200 mt-0.5">
                  {smc.liquidityPools[1]?.price || '--'}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* $50 Account Hard Risk Rules Checklist */}
        <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-lg space-y-2">
          <div className="flex items-center gap-1.5 font-semibold text-white">
            <Shield className="w-3.5 h-3.5 text-emerald-400" />
            <span>$50 Micro Account Rules</span>
          </div>
          <div className="space-y-1 text-[11px] text-slate-400 font-mono">
            <div className="flex items-center justify-between">
              <span>Lot Size:</span>
              <strong className="text-white">0.01 Lot (Fixed)</strong>
            </div>
            <div className="flex items-center justify-between">
              <span>Open Trades Limit:</span>
              <strong className={openPositionsCount >= maxOpenTrades ? 'text-amber-400' : 'text-emerald-400'}>
                {openPositionsCount} / {maxOpenTrades} Max
              </strong>
            </div>
            <div className="flex items-center justify-between">
              <span>Daily Trade Quota:</span>
              <strong className={dailyTradesTaken >= dailyMaxTrades ? 'text-rose-400' : 'text-emerald-400'}>
                {dailyTradesTaken} / {dailyMaxTrades} Trades Today
              </strong>
            </div>
            <div className="flex items-center justify-between pt-1 border-t border-slate-800">
              <span className="flex items-center gap-1 text-purple-400">
                <EyeOff className="w-3 h-3" /> Ghost SL/TP:
              </span>
              <strong className="text-purple-300">Armed (Broker Blind)</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
