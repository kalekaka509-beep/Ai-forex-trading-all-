import React from 'react';
import { BotConfig, StrategyType } from '../types/trading';
import { Settings, Shield, Sliders, X, Check, BrainCircuit, EyeOff, Lock, Zap } from 'lucide-react';

interface BotConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: BotConfig;
  onSaveConfig: (newConfig: BotConfig) => void;
}

export const BotConfigModal: React.FC<BotConfigModalProps> = ({
  isOpen,
  onClose,
  config,
  onSaveConfig
}) => {
  const [draft, setDraft] = React.useState<BotConfig>(config);

  React.useEffect(() => {
    setDraft(config);
  }, [config, isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    onSaveConfig(draft);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="relative flex flex-col w-full max-w-2xl max-h-[90vh] bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>M5 Algorithmic, ML & Ghost Settings</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 font-mono">
                  $50 Account / 0.01 Lot
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Configure Machine Learning, SMC order flow, ghost stealth SL, and risk limits
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

        {/* Form Body */}
        <div className="flex-1 p-6 space-y-6 overflow-y-auto text-xs">
          {/* Strategy Selection */}
          <div className="space-y-2">
            <label className="font-semibold text-white block">Active Algorithmic Strategy</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {[
                {
                  id: 'smc_machine_learning',
                  title: 'ML + SMC Order Flow (Recommended)',
                  desc: 'Machine Learning classifier with Smart Money Concepts (BOS, FVG, Liquidity sweeps)'
                },
                {
                  id: 'ema_ribbon',
                  title: 'M5 EMA Ribbon Scalper (9/21/50)',
                  desc: 'Triple EMA trend alignment with dynamic RSI momentum pullback'
                },
                {
                  id: 'supertrend',
                  title: 'M5 SuperTrend & ATR Breakout',
                  desc: 'Volatility trend envelope with trailing ATR breakout'
                },
                {
                  id: 'bollinger',
                  title: 'M5 Bollinger Mean Reversion',
                  desc: 'Extreme 2.0 std dev band pierces with RSI oscillator reversal'
                }
              ].map((strat) => (
                <div
                  key={strat.id}
                  onClick={() => setDraft({ ...draft, strategy: strat.id as StrategyType })}
                  className={`p-3 rounded-lg border cursor-pointer transition-all ${
                    draft.strategy === strat.id
                      ? 'bg-sky-950/50 border-sky-500 text-white shadow-sm'
                      : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <div className="font-bold flex items-center justify-between">
                    <span>{strat.title}</span>
                    {draft.strategy === strat.id && <Check className="w-4 h-4 text-sky-400" />}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1 leading-normal">{strat.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* $50 Account Hard Risk Rules */}
          <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-semibold text-white">
                <Shield className="w-4 h-4 text-emerald-400" />
                <span>$50 Micro-Account Hard Risk Rules</span>
              </div>
              <span className="text-[10px] text-emerald-400 font-mono">Capital Preservation</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
              <div>
                <label className="block text-slate-400 mb-1">Fixed Lot Size</label>
                <input
                  type="number"
                  step="0.01"
                  value={draft.fixedLot}
                  onChange={(e) => setDraft({ ...draft, fixedLot: parseFloat(e.target.value) || 0.01 })}
                  className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded text-slate-100 font-mono focus:outline-none focus:border-sky-500"
                />
                <span className="text-[10px] text-slate-500 mt-0.5 block">Default: 0.01 micro lot</span>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Max Concurrent Open Trades</label>
                <input
                  type="number"
                  min="1"
                  max="5"
                  value={draft.maxOpenTrades}
                  onChange={(e) => setDraft({ ...draft, maxOpenTrades: parseInt(e.target.value) || 1 })}
                  className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded text-slate-100 font-mono focus:outline-none focus:border-sky-500"
                />
                <span className="text-[10px] text-slate-500 mt-0.5 block">Strictly 1 open trade</span>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Daily Max Trades Quota</label>
                <input
                  type="number"
                  min="5"
                  max="50"
                  value={draft.dailyMaxTrades}
                  onChange={(e) => setDraft({ ...draft, dailyMaxTrades: parseInt(e.target.value) || 25 })}
                  className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded text-slate-100 font-mono focus:outline-none focus:border-sky-500"
                />
                <span className="text-[10px] text-slate-500 mt-0.5 block">Strictly 25 trades/day</span>
              </div>
            </div>
          </div>

          {/* Ghost System (Stealth Virtual SL/TP & Break-even) */}
          <div className="p-4 bg-slate-950 border border-purple-900/40 rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-semibold text-purple-300">
                <EyeOff className="w-4 h-4 text-purple-400" />
                <span>Ghost Stealth System (Broker Blind)</span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded bg-purple-950 text-purple-300 font-mono">
                Invisible to Broker
              </span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Stop Loss and Take Profit orders are never sent to the broker&apos;s book. The algorithm keeps them in local memory and instantly triggers a market close upon price contact, preventing broker stop hunting.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={draft.useGhostSystem}
                  onChange={(e) => setDraft({ ...draft, useGhostSystem: e.target.checked })}
                  className="mt-0.5 rounded bg-slate-900 border-slate-700 text-purple-500 focus:ring-0"
                />
                <div>
                  <span className="font-medium text-slate-200">Enable Ghost Stealth Mode</span>
                  <p className="text-[10px] text-slate-400">Virtual Stop Loss & Take Profit</p>
                </div>
              </label>

              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={draft.useGhostBreakEven}
                  onChange={(e) => setDraft({ ...draft, useGhostBreakEven: e.target.checked })}
                  className="mt-0.5 rounded bg-slate-900 border-slate-700 text-purple-500 focus:ring-0"
                />
                <div>
                  <span className="font-medium text-slate-200">Ghost Break-Even Lock</span>
                  <p className="text-[10px] text-slate-400">
                    Moves virtual SL to Entry + 1 pip at +{draft.ghostBreakEvenPips} pips
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* Volatility-Adjusted ATR Auto-Trail */}
          <div className="p-4 bg-slate-950 border border-amber-900/40 rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-semibold text-amber-300">
                <Zap className="w-4 h-4 text-amber-400" />
                <span>Volatility-Adjusted ATR Auto-Trail</span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded bg-amber-950 text-amber-300 font-mono">
                Dynamic M5 Volatility Ratchet
              </span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Dynamically ratchets the Stop Loss behind peak price based on real-time M5 Average True Range (ATR). As the market moves into profit, the SL tightens during quiet markets and expands during volatility bursts to protect gains while preventing premature stop-outs.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
              <label className="flex items-start gap-2.5 cursor-pointer md:col-span-1">
                <input
                  type="checkbox"
                  checked={draft.useAtrAutoTrail}
                  onChange={(e) => setDraft({ ...draft, useAtrAutoTrail: e.target.checked })}
                  className="mt-0.5 rounded bg-slate-900 border-slate-700 text-amber-500 focus:ring-0"
                />
                <div>
                  <span className="font-medium text-slate-200">Enable ATR Auto-Trail</span>
                  <p className="text-[10px] text-slate-400">Dynamic Stop Loss ratcheting</p>
                </div>
              </label>

              <div>
                <label className="block text-slate-400 mb-1">ATR Trail Multiplier</label>
                <input
                  type="number"
                  step="0.1"
                  min="1.0"
                  max="4.0"
                  value={draft.atrTrailMultiplier}
                  onChange={(e) => setDraft({ ...draft, atrTrailMultiplier: parseFloat(e.target.value) || 2.0 })}
                  className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded text-slate-100 font-mono focus:outline-none focus:border-amber-500"
                />
                <span className="text-[10px] text-slate-500 mt-0.5 block">Default: 2.0x M5 ATR buffer</span>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Activation Ratio (x ATR)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0.3"
                  max="2.5"
                  value={draft.atrTrailActivationAtrRatio}
                  onChange={(e) => setDraft({ ...draft, atrTrailActivationAtrRatio: parseFloat(e.target.value) || 0.8 })}
                  className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded text-slate-100 font-mono focus:outline-none focus:border-amber-500"
                />
                <span className="text-[10px] text-slate-500 mt-0.5 block">Start trail at &ge; 0.8x ATR profit</span>
              </div>
            </div>
          </div>

          {/* Machine Learning & SMC Controls */}
          <div className="p-4 bg-slate-950 border border-sky-900/40 rounded-lg space-y-3">
            <div className="flex items-center gap-2 font-semibold text-sky-300">
              <BrainCircuit className="w-4 h-4 text-sky-400" />
              <span>Machine Learning & SMC Filtering</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={draft.useMLEngine}
                  onChange={(e) => setDraft({ ...draft, useMLEngine: e.target.checked })}
                  className="mt-0.5 rounded bg-slate-900 border-slate-700 text-sky-500 focus:ring-0"
                />
                <div>
                  <span className="font-medium text-slate-200">AI / ML Confidence Filter</span>
                  <p className="text-[10px] text-slate-400">Only trigger trades if ML confidence &ge; {draft.mlConfidenceMin}%</p>
                </div>
              </label>

              <div>
                <label className="block text-slate-400 mb-1">Min ML Confidence (%)</label>
                <input
                  type="number"
                  min="60"
                  max="95"
                  value={draft.mlConfidenceMin}
                  onChange={(e) => setDraft({ ...draft, mlConfidenceMin: parseInt(e.target.value) || 75 })}
                  className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded text-slate-100 font-mono focus:outline-none focus:border-sky-500"
                />
              </div>
            </div>
          </div>

          {/* SL / TP & Spread */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-400 mb-1">Stop Loss (Pips)</label>
              <input
                type="number"
                min="5"
                max="80"
                value={draft.slPips}
                onChange={(e) => setDraft({ ...draft, slPips: parseInt(e.target.value) || 15 })}
                className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded text-slate-100 font-mono focus:outline-none focus:border-sky-500"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Take Profit (Pips)</label>
              <input
                type="number"
                min="10"
                max="200"
                value={draft.tpPips}
                onChange={(e) => setDraft({ ...draft, tpPips: parseInt(e.target.value) || 30 })}
                className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded text-slate-100 font-mono focus:outline-none focus:border-sky-500"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Max Spread (Pips)</label>
              <input
                type="number"
                step="0.1"
                min="0.5"
                max="10"
                value={draft.maxSpreadPips}
                onChange={(e) => setDraft({ ...draft, maxSpreadPips: parseFloat(e.target.value) || 2.2 })}
                className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded text-slate-100 font-mono focus:outline-none focus:border-sky-500"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-slate-950/70">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2 text-xs font-semibold rounded-lg bg-sky-600 hover:bg-sky-500 text-white transition-colors"
          >
            Save & Arm Configuration
          </button>
        </div>
      </div>
    </div>
  );
};
