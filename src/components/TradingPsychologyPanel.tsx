import React, { useState, useEffect } from 'react';
import { BotConfig, Position, TradingPsychologyState, TraderMindset } from '../types/trading';
import {
  Brain,
  Shield,
  ShieldAlert,
  Flame,
  HeartHandshake,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Timer,
  Wind,
  Coffee,
  Smile,
  Zap,
  BookOpen
} from 'lucide-react';

interface TradingPsychologyPanelProps {
  psychology: TradingPsychologyState;
  config: BotConfig;
  positions: Position[];
  onUpdateMindset: (mindset: TraderMindset) => void;
  onTriggerManualCooldown: (minutes: number) => void;
  onResetCooldown: () => void;
  onToggleChecklist: (key: keyof TradingPsychologyState['checklist']) => void;
}

export const TradingPsychologyPanel: React.FC<TradingPsychologyPanelProps> = ({
  psychology,
  config,
  positions,
  onUpdateMindset,
  onTriggerManualCooldown,
  onResetCooldown,
  onToggleChecklist
}) => {
  const [breathPhase, setBreathPhase] = useState<'Inhale' | 'Hold (Top)' | 'Exhale' | 'Hold (Bottom)'>('Inhale');
  const [breathCount, setBreathCount] = useState<number>(4);
  const [isBreathingActive, setIsBreathingActive] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'checklist' | 'breathe' | 'wisdom'>('overview');

  // Cooldown countdown
  const [cooldownRemainingSec, setCooldownRemainingSec] = useState<number>(0);

  useEffect(() => {
    if (!psychology.cooldownUntil) {
      setCooldownRemainingSec(0);
      return;
    }
    const updateCountdown = () => {
      const remaining = Math.max(0, Math.floor((psychology.cooldownUntil! - Date.now()) / 1000));
      setCooldownRemainingSec(remaining);
    };
    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [psychology.cooldownUntil]);

  // Box Breathing cycle (4s Inhale, 4s Hold, 4s Exhale, 4s Hold)
  useEffect(() => {
    if (!isBreathingActive) return;
    const phases: ('Inhale' | 'Hold (Top)' | 'Exhale' | 'Hold (Bottom) ')[] = [
      'Inhale',
      'Hold (Top)',
      'Exhale',
      'Hold (Bottom) '
    ];
    let phaseIdx = 0;
    let sec = 4;

    const interval = setInterval(() => {
      sec -= 1;
      if (sec < 0) {
        phaseIdx = (phaseIdx + 1) % 4;
        sec = 4;
        setBreathPhase(phases[phaseIdx] as any);
      }
      setBreathCount(sec);
    }, 1000);

    return () => clearInterval(interval);
  }, [isBreathingActive]);

  const score = psychology.disciplineScore;
  const scoreColor =
    score >= 85
      ? 'text-emerald-400'
      : score >= 65
      ? 'text-sky-400'
      : score >= 45
      ? 'text-amber-400'
      : 'text-rose-500';

  const scoreBadgeBg =
    score >= 85
      ? 'bg-emerald-950/80 border-emerald-700/60 text-emerald-300'
      : score >= 65
      ? 'bg-sky-950/80 border-sky-700/60 text-sky-300'
      : score >= 45
      ? 'bg-amber-950/80 border-amber-700/60 text-amber-300'
      : 'bg-rose-950/80 border-rose-700/60 text-rose-300 animate-pulse';

  const scoreStatus =
    score >= 85
      ? 'Zen & Objective (Elite Execution)'
      : score >= 65
      ? 'Stable & Emotionally Grounded'
      : score >= 45
      ? 'Mild Tilt / Emotional Tension Detected'
      : 'CRITICAL TILT HAZARD: Revenge Risk High';

  const checklistCompleted = Object.values(psychology.checklist).filter(Boolean).length;
  const checklistAllDone = checklistCompleted === 4;

  const formatSec = (total: number) => {
    const mins = Math.floor(total / 60);
    const secs = total % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-slate-800 bg-slate-950/70">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-indigo-950 border border-indigo-700/60 flex items-center justify-center text-indigo-400 shadow-sm">
              <Brain className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-white flex items-center gap-2">
                <span>Trading Psychology & Discipline Guardian</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-950 border border-indigo-800 text-indigo-300 font-bold uppercase">
                  मनोविज्ञान प्रणाली
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Institutional emotional bias shielding, tilt prevention & decision discipline engine.
              </p>
            </div>
          </div>

          {/* Quick Score Pill */}
          <div className="flex items-center gap-2">
            <div className={`px-3 py-1.5 rounded-lg border text-xs font-mono font-bold flex items-center gap-2 ${scoreBadgeBg}`}>
              <span>Discipline Index:</span>
              <span className={`text-sm ${scoreColor}`}>{score}/100</span>
            </div>
          </div>
        </div>

        {/* Cooldown Active Banner */}
        {psychology.isCircuitBreakerActive && (
          <div className="mt-3 p-3 bg-rose-950/80 border border-rose-600 rounded-lg flex items-center justify-between gap-3 text-rose-200">
            <div className="flex items-center gap-2.5">
              <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 animate-bounce" />
              <div>
                <span className="text-xs font-bold block">
                  🛑 PSYCHOLOGY CIRCUIT BREAKER ACTIVE ({formatSec(cooldownRemainingSec)})
                </span>
                <span className="text-[11px] text-rose-300/90">
                  Trading is temporarily locked to protect your $50 account from revenge tilt after consecutive losses.
                </span>
              </div>
            </div>
            <button
              onClick={onResetCooldown}
              className="px-2.5 py-1 text-xs bg-rose-900 hover:bg-rose-800 text-white rounded border border-rose-700 transition-colors font-mono"
            >
              Emergency Override
            </button>
          </div>
        )}

        {/* Revenge Shield Active Notice */}
        {!psychology.isCircuitBreakerActive && psychology.revengeShieldTriggered && (
          <div className="mt-3 p-2.5 bg-amber-950/60 border border-amber-600/70 rounded-lg flex items-center gap-2.5 text-amber-200 text-xs">
            <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              <strong>🛡️ Revenge Shield Armed:</strong> Recent loss recorded. Waiting 90s for emotional detachment before new orders can be queued.
            </span>
          </div>
        )}

        {/* View Tabs */}
        <div className="flex items-center gap-1.5 mt-3 pt-2 border-t border-slate-800/60 text-xs">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-3 py-1 rounded transition-colors ${
              activeTab === 'overview'
                ? 'bg-slate-800 text-white font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Psychology Radar
          </button>
          <button
            onClick={() => setActiveTab('checklist')}
            className={`px-3 py-1 rounded transition-colors flex items-center gap-1.5 ${
              activeTab === 'checklist'
                ? 'bg-slate-800 text-white font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>Pre-Trade Checklist</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-700 font-mono">
              {checklistCompleted}/4
            </span>
          </button>
          <button
            onClick={() => setActiveTab('breathe')}
            className={`px-3 py-1 rounded transition-colors flex items-center gap-1.5 ${
              activeTab === 'breathe'
                ? 'bg-slate-800 text-white font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Wind className="w-3.5 h-3.5 text-sky-400" />
            <span>Box Breathing Reset</span>
          </button>
          <button
            onClick={() => setActiveTab('wisdom')}
            className={`px-3 py-1 rounded transition-colors flex items-center gap-1.5 ${
              activeTab === 'wisdom'
                ? 'bg-slate-800 text-white font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5 text-amber-400" />
            <span>ट्रेडिङ मन्त्र (Wisdom)</span>
          </button>
        </div>
      </div>

      {/* Main Content Body */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4">
        {activeTab === 'overview' && (
          <div className="space-y-4">
            {/* 1. Trader Mindset Selection */}
            <div className="p-3.5 bg-slate-950/60 border border-slate-800 rounded-lg">
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Smile className="w-3.5 h-3.5 text-indigo-400" /> Current Emotional Mindset
                </span>
                <span className="text-[11px] text-slate-400 font-mono">
                  State: <strong className="text-white capitalize">{psychology.traderMindset}</strong>
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {[
                  { id: 'calm', label: '🧘 Calm & Objective', desc: 'Standard 0.01 lot flow' },
                  { id: 'focused', label: '🎯 Laser Focused', desc: 'High confluence scalping' },
                  { id: 'anxious', label: '⚠️ Hesitant / Anxious', desc: 'Tightened SL rules' },
                  { id: 'tilted', label: '🛑 Tilted / Frustrated', desc: 'Auto-Locks execution' },
                  { id: 'fatigued', label: '😴 Fatigued / Tired', desc: 'Recommended pause' }
                ].map((item) => {
                  const isCurrent = psychology.traderMindset === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => onUpdateMindset(item.id as TraderMindset)}
                      className={`p-2.5 rounded-lg border text-left transition-all ${
                        isCurrent
                          ? item.id === 'tilted'
                            ? 'bg-rose-950/90 border-rose-500 text-rose-200 shadow-md'
                            : 'bg-indigo-950/90 border-indigo-500 text-indigo-200 shadow-md'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                      }`}
                    >
                      <div className="text-xs font-bold truncate">{item.label}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5 truncate">{item.desc}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. 4 Institutional Defensive Shields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Shield 1: Revenge Trading Barrier */}
              <div className="p-3.5 bg-slate-950/60 border border-slate-800 rounded-lg flex items-start gap-3">
                <div className={`p-2 rounded-lg shrink-0 ${
                  psychology.revengeShieldTriggered
                    ? 'bg-amber-950 border border-amber-600 text-amber-400'
                    : 'bg-slate-900 border border-slate-800 text-emerald-400'
                }`}>
                  <Shield className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">Revenge Trading Barrier</span>
                    <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded font-bold ${
                      psychology.revengeShieldTriggered ? 'bg-amber-950 text-amber-400' : 'bg-emerald-950 text-emerald-400'
                    }`}>
                      {psychology.revengeShieldTriggered ? 'COOLING (90s)' : 'ARMED'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                    Prevents immediate emotional re-entry right after a loss. Eliminates anger trading and "doubling down" impulses.
                  </p>
                </div>
              </div>

              {/* Shield 2: Circuit Breaker Loss Limiter */}
              <div className="p-3.5 bg-slate-950/60 border border-slate-800 rounded-lg flex items-start gap-3">
                <div className={`p-2 rounded-lg shrink-0 ${
                  psychology.isCircuitBreakerActive
                    ? 'bg-rose-950 border border-rose-600 text-rose-400'
                    : 'bg-slate-900 border border-slate-800 text-sky-400'
                }`}>
                  <Timer className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">Loss Streak Circuit Breaker</span>
                    <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded font-bold ${
                      psychology.isCircuitBreakerActive ? 'bg-rose-950 text-rose-400' : 'bg-sky-950 text-sky-400'
                    }`}>
                      {psychology.consecutiveLosses}/{psychology.maxConsecutiveLossesAllowed} Losses
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                    Automatically trips a 5-minute pause after 2 consecutive stop-outs to protect the $50 account capital.
                  </p>
                </div>
              </div>

              {/* Shield 3: FOMO Velocity Guard */}
              <div className="p-3.5 bg-slate-950/60 border border-slate-800 rounded-lg flex items-start gap-3">
                <div className={`p-2 rounded-lg shrink-0 ${
                  psychology.fomoAlert
                    ? 'bg-amber-950 border border-amber-600 text-amber-400'
                    : 'bg-slate-900 border border-slate-800 text-purple-400'
                }`}>
                  <Zap className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">FOMO Velocity Guard</span>
                    <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded font-bold ${
                      psychology.fomoAlert ? 'bg-amber-950 text-amber-400' : 'bg-purple-950 text-purple-400'
                    }`}>
                      {psychology.fomoAlert ? 'OVEREXTENDED' : 'MONITORING'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                    Detects price overextended &gt;2.5x ATR away from the Decision Line. Prevents buying the absolute top or selling bottoms.
                  </p>
                </div>
              </div>

              {/* Shield 4: Euphoria & Greed Controller */}
              <div className="p-3.5 bg-slate-950/60 border border-slate-800 rounded-lg flex items-start gap-3">
                <div className={`p-2 rounded-lg shrink-0 ${
                  psychology.overconfidenceRisk
                    ? 'bg-amber-950 border border-amber-600 text-amber-400'
                    : 'bg-slate-900 border border-slate-800 text-indigo-400'
                }`}>
                  <Flame className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">Euphoria & Greed Limiter</span>
                    <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded font-bold ${
                      psychology.overconfidenceRisk ? 'bg-amber-950 text-amber-400' : 'bg-indigo-950 text-indigo-400'
                    }`}>
                      {psychology.consecutiveWins} Streak
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                    Warns against false invincibility after 3 wins in a row. Enforces strict 0.01 fixed micro lot compliance.
                  </p>
                </div>
              </div>
            </div>

            {/* 3. Account Capital Preservation Reality Anchor */}
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                  $50 Account Mathematical Perspective
                </h3>
                <span className="text-[11px] font-mono text-emerald-400 font-bold">
                  Risk Per Trade: ~$0.50 - $1.00 (1% - 2%)
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-300 font-mono">
                <div className="p-2.5 bg-slate-900 rounded border border-slate-800">
                  <div className="text-[10px] text-slate-400 uppercase">Fixed Lot Size</div>
                  <div className="text-sm font-bold text-white mt-0.5">0.01 Micro Lot</div>
                  <div className="text-[10px] text-slate-400">10 pips = $1.00</div>
                </div>
                <div className="p-2.5 bg-slate-900 rounded border border-slate-800">
                  <div className="text-[10px] text-slate-400 uppercase">Survivable Stop Losses</div>
                  <div className="text-sm font-bold text-emerald-400 mt-0.5">50+ Trades</div>
                  <div className="text-[10px] text-slate-400">Capital is mathematically shielded</div>
                </div>
                <div className="p-2.5 bg-slate-900 rounded border border-slate-800">
                  <div className="text-[10px] text-slate-400 uppercase">Emotional Golden Rule</div>
                  <div className="text-sm font-bold text-sky-400 mt-0.5">Accept The Risk</div>
                  <div className="text-[10px] text-slate-400">Losses are just operating expenses</div>
                </div>
              </div>
            </div>

            {/* Manual Cooldown Action */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-950/40 border border-slate-800/60 rounded-lg">
              <div className="flex items-center gap-2 text-xs text-slate-300">
                <Coffee className="w-4 h-4 text-amber-400" />
                <span>Feeling stressed or rushed by fast M5 candles?</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onTriggerManualCooldown(5)}
                  className="px-3 py-1.5 text-xs font-medium rounded bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 transition-colors"
                >
                  5-Min Breather
                </button>
                <button
                  onClick={() => onTriggerManualCooldown(15)}
                  className="px-3 py-1.5 text-xs font-medium rounded bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 transition-colors"
                >
                  15-Min Reset Walk
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Pre-Trade Checklist */}
        {activeTab === 'checklist' && (
          <div className="space-y-4">
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-sm font-bold text-white">4-Pillar Decision Discipline Checklist</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Verify every pillar before executing a manual trade or confirming algorithmic entries.
                  </p>
                </div>
                <span
                  className={`text-xs font-mono font-bold px-2.5 py-1 rounded border ${
                    checklistAllDone
                      ? 'bg-emerald-950 border-emerald-600 text-emerald-300'
                      : 'bg-slate-800 border-slate-700 text-slate-400'
                  }`}
                >
                  {checklistAllDone ? '✓ 100% DISCIPLINED' : `${checklistCompleted}/4 COMPLETE`}
                </span>
              </div>

              <div className="space-y-2.5">
                {[
                  {
                    key: 'confluenceConfirmed' as const,
                    title: '1. Confluence & Decision Line Alignment',
                    desc: 'Is the setup aligned with the M5 Decision Line, SMC Fair Value Gap (FVG), or EMA Ribbon without counter-trend guessing?'
                  },
                  {
                    key: 'riskAccepted' as const,
                    title: '2. Absolute Risk Acceptance',
                    desc: 'Am I 100% comfortable losing $0.50 - $1.00 on this 0.01 lot trade if the market stops me out?'
                  },
                  {
                    key: 'emotionsNeutral' as const,
                    title: '3. Zero Emotional Tilt or Revenge',
                    desc: 'Am I executing this trade objectively, with no anger from previous candles and no rush to recover past losses?'
                  },
                  {
                    key: 'ghostPlanLocked' as const,
                    title: '4. Hands-Off Execution & Ghost SL Plan',
                    desc: 'Will I let the Ghost SL and ATR Auto-Trail manage the position without manual anxiety or fidgeting with targets?'
                  }
                ].map((item) => {
                  const checked = psychology.checklist[item.key];
                  return (
                    <div
                      key={item.key}
                      onClick={() => onToggleChecklist(item.key)}
                      className={`p-3 rounded-lg border cursor-pointer transition-all flex items-start gap-3 ${
                        checked
                          ? 'bg-emerald-950/30 border-emerald-800/80 text-emerald-100'
                          : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <button className="mt-0.5 shrink-0 text-emerald-400">
                        {checked ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                        ) : (
                          <div className="w-5 h-5 rounded-full border border-slate-600" />
                        )}
                      </button>
                      <div className="flex-1">
                        <div className="text-xs font-bold">{item.title}</div>
                        <div className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                          {item.desc}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Box Breathing Reset */}
        {activeTab === 'breathe' && (
          <div className="p-6 bg-slate-950 border border-slate-800 rounded-lg flex flex-col items-center justify-center text-center">
            <h3 className="text-base font-extrabold text-white flex items-center gap-2">
              <Wind className="w-5 h-5 text-sky-400" /> Box Breathing Tilt Neutralizer (4-4-4-4)
            </h3>
            <p className="text-xs text-slate-400 max-w-md mt-1">
              Used by institutional prop traders and Navy SEALs to instantly clear cortisol, lower heart rate, and regain objective focus after a loss.
            </p>

            {/* Breathing Animation Circle */}
            <div className="my-8 relative flex items-center justify-center">
              <div
                className={`w-44 h-44 rounded-full border-4 flex flex-col items-center justify-center transition-all duration-1000 ${
                  isBreathingActive
                    ? breathPhase === 'Inhale'
                      ? 'scale-110 border-sky-400 bg-sky-950/40 text-sky-200'
                      : breathPhase === 'Hold (Top)'
                      ? 'scale-110 border-indigo-400 bg-indigo-950/40 text-indigo-200'
                      : breathPhase === 'Exhale'
                      ? 'scale-90 border-emerald-400 bg-emerald-950/40 text-emerald-200'
                      : 'scale-90 border-amber-400 bg-amber-950/40 text-amber-200'
                    : 'border-slate-700 bg-slate-900 text-slate-400'
                }`}
              >
                <span className="text-xs font-mono uppercase tracking-widest text-slate-400">
                  {isBreathingActive ? breathPhase : 'Ready'}
                </span>
                <span className="text-4xl font-extrabold font-mono my-1">
                  {isBreathingActive ? breathCount : '4s'}
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  {isBreathingActive ? 'Focus on breath' : 'Click Start'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsBreathingActive(!isBreathingActive)}
                className={`px-5 py-2 text-xs font-bold rounded-lg transition-colors font-mono ${
                  isBreathingActive
                    ? 'bg-rose-900 hover:bg-rose-800 text-white'
                    : 'bg-sky-600 hover:bg-sky-500 text-white shadow-lg shadow-sky-600/20'
                }`}
              >
                {isBreathingActive ? 'Stop Exercise' : 'Start 4-4-4-4 Breathing'}
              </button>
            </div>
          </div>
        )}

        {/* Tab 4: Nepali Trading Psychology Wisdom */}
        {activeTab === 'wisdom' && (
          <div className="space-y-3">
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg">
              <h3 className="text-sm font-extrabold text-amber-300 flex items-center gap-2 mb-3">
                <BookOpen className="w-4 h-4 text-amber-400" />
                अनुशासित ट्रेडिङका सुनौला मन्त्रहरू (Trading Wisdom & Rules)
              </h3>
              <div className="space-y-3">
                {[
                  {
                    title: '१. मार्केटलाई जित्ने होइन, आफ्नै भावना र लोभलाई जित्ने हो',
                    nepali: 'मार्केट कहिल्यै पनि तपाईंको विरूद्ध वा पक्षमा हुँदैन। एउटा ०.०१ लटको घाटाले तपाईंलाई गरिब बनाउँदैन, तर रीस र बदलाको भावना (Revenge Trading) ले केही मिनेटमै ५० डलर स्वाहा पार्न सक्छ।',
                    rule: 'Golden Rule: स्वीकार्नुस् कि घाटा ट्रेडिङ विजनेसको भाडा (Cost of doing business) मात्र हो।'
                  },
                  {
                    title: '२. निर्णय रेखा (Decision Line) को नियम कहिल्यै नतोड्नुहोस्',
                    nepali: 'प्राइस जबसम्म निर्णय रेखाभन्दा माथि छ, सेल गर्ने हतार नगर्नुहोस्। जब प्राइस निर्णय रेखाभन्दा तल छ, बाइ खोज्न हतार नगर्नुहोस्। संस्थागत खेलाडीहरू (Institutions) सँगै पौडी खेल्नुस्, उल्टो होइन।',
                    rule: 'Golden Rule: Trend and Decision Line are your only reliable allies.'
                  },
                  {
                    title: '३. नाफामा ढुक्क र घाटामा शान्त रहनुस्',
                    nepali: 'घोस्ट सिस्टम र एटीआर अटो-ट्रेल (ATR Auto-Trail) ले तपाईंको नाफा आफै लक गर्छ। बीचमा हात हालेर छिटो काट्ने वा स्टप लस हटाउने बानीले मात्र खाता रित्तिन्छ।',
                    rule: 'Golden Rule: Plan the trade, trade the plan, then step away.'
                  },
                  {
                    title: '४. दिनको २५ ट्रेडको सीमा र १ ट्रेड मात्र खुला राख्ने अनुशासन',
                    nepali: 'दिनभर स्क्रिन हेरेर बारम्बार ट्रेड थिच्नु ट्रेडिङ होइन, जुवा हो। दिनको २५ ट्रेड अधिकतम र १ ट्रेड मात्र खुला राख्ने नियमले ५० डलरको सानो खातालाई सुरक्षित राख्दै वृद्धि गर्छ।',
                    rule: 'Golden Rule: High discipline beats high IQ every single time in trading.'
                  }
                ].map((w, idx) => (
                  <div key={idx} className="p-3 bg-slate-900 border border-slate-800 rounded-lg">
                    <h4 className="text-xs font-bold text-white mb-1">{w.title}</h4>
                    <p className="text-[11px] text-slate-300 leading-relaxed">{w.nepali}</p>
                    <div className="mt-2 text-[10px] text-amber-400 font-mono font-medium">
                      {w.rule}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
