/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  BookmapBubble,
  BotConfig,
  Candle,
  ClosedTrade,
  MT5Account,
  Position,
  TickQuote,
  TradeSignal,
  TraderMindset,
  TradingPsychologyState
} from './types/trading';
import { ALL_SYMBOLS } from './constants/symbols';
import {
  createInitialMarketState,
  MarketState,
  processTickCycle
} from './services/marketStore';
import { liveMarketStreamer } from './services/liveMarketStream';
import { M5CandleChart } from './components/M5CandleChart';
import { M5ScannerPanel } from './components/M5ScannerPanel';
import { PositionsPanel } from './components/PositionsPanel';
import { ConsoleLogsPanel } from './components/ConsoleLogsPanel';
import { DOMAndBookmapPanel } from './components/DOMAndBookmapPanel';
import { MLSMCPanel } from './components/MLSMCPanel';
import { MT5BridgeModal } from './components/MT5BridgeModal';
import { BotConfigModal } from './components/BotConfigModal';
import { GroqAIDeepSearchModal } from './components/GroqAIDeepSearchModal';
import { TradingPsychologyPanel } from './components/TradingPsychologyPanel';
import {
  Activity,
  Play,
  Square,
  Server,
  Sliders,
  TrendingUp,
  TrendingDown,
  Shield,
  HelpCircle,
  BarChart3,
  List,
  Layers,
  Zap,
  CheckCircle2,
  AlertCircle,
  BrainCircuit,
  EyeOff,
  Flame,
  Radio,
  Sparkles,
  Brain,
  Crosshair
} from 'lucide-react';

export default function App() {
  const [state, setState] = useState<MarketState>(createInitialMarketState);
  const [selectedSymbol, setSelectedSymbol] = useState<string>('XAUUSD');
  const [timeframe, setTimeframe] = useState<string>('M5');
  const [activeView, setActiveView] = useState<'dashboard' | 'scanner' | 'bookmap_dom' | 'chart' | 'positions' | 'psychology'>('dashboard');

  const [isBridgeModalOpen, setIsBridgeModalOpen] = useState(false);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [isGroqModalOpen, setIsGroqModalOpen] = useState(false);
  const [showNepaliBanner, setShowNepaliBanner] = useState(true);

  // Subscribe to Real-Time Live Market Streamer (Binance WS + Live FX feeds)
  useEffect(() => {
    const unsubQuotes = liveMarketStreamer.subscribe((sym, liveQ) => {
      setState((prev) => {
        const existing = prev.quotes[sym];
        if (!existing) return prev;
        return {
          ...prev,
          quotes: {
            ...prev.quotes,
            [sym]: {
              ...existing,
              ...liveQ,
              time: Date.now()
            }
          }
        };
      });
    });

    const unsubBubbles = liveMarketStreamer.subscribeBubbles((bubble) => {
      setState((prev) => ({
        ...prev,
        bookmapBubbles: [bubble, ...prev.bookmapBubbles.slice(0, 35)]
      }));
    });

    // Fetch initial real-time quotes immediately on mount
    fetch('/api/market/real-quotes')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && data.quotes) {
          setState((prev) => {
            const nextQuotes = { ...prev.quotes };
            Object.entries(data.quotes).forEach(([sym, q]: [string, any]) => {
              if (nextQuotes[sym]) {
                nextQuotes[sym] = {
                  ...nextQuotes[sym],
                  bid: q.bid,
                  ask: q.ask,
                  spread: q.spread,
                  time: Date.now(),
                  isLiveFeed: true,
                  source: 'Real Live Market API'
                };
              }
            });
            return { ...prev, quotes: nextQuotes };
          });
        }
      })
      .catch(() => {});

    return () => {
      unsubQuotes();
      unsubBubbles();
    };
  }, []);

  // Real-Time High Frequency Engine Loop (850ms)
  useEffect(() => {
    const interval = setInterval(() => {
      setState((prevState) => processTickCycle(prevState));
    }, 850);

    return () => clearInterval(interval);
  }, []);

  // Handlers
  const handleToggleAutoTrade = () => {
    setState((prev) => {
      const nextActive = !prev.config.autoTradeEnabled;
      return {
        ...prev,
        config: { ...prev.config, autoTradeEnabled: nextActive },
        logs: [
          {
            id: `log_bot_switch_${Date.now()}`,
            timestamp: Date.now(),
            type: 'info',
            message: `Automated M5 Trading Engine ${nextActive ? 'ARMED (0.01 Lot, Max 1 Trade, 25/day)' : 'PAUSED'}.`
          },
          ...prev.logs.slice(0, 80)
        ]
      };
    });
  };

  const handleTogglePair = (symbol: string) => {
    setState((prev) => {
      const exists = prev.config.selectedPairs.includes(symbol);
      const updatedPairs = exists
        ? prev.config.selectedPairs.filter((p) => p !== symbol)
        : [...prev.config.selectedPairs, symbol];

      return {
        ...prev,
        config: { ...prev.config, selectedPairs: updatedPairs }
      };
    });
  };

  const handleToggleAllPairs = (enable: boolean) => {
    setState((prev) => ({
      ...prev,
      config: {
        ...prev.config,
        selectedPairs: enable ? ALL_SYMBOLS.map((s) => s.symbol) : []
      }
    }));
  };

  const handleSaveConfig = (newConfig: BotConfig) => {
    setState((prev) => ({
      ...prev,
      config: newConfig,
      logs: [
        {
          id: `log_cfg_${Date.now()}`,
          timestamp: Date.now(),
          type: 'info',
          message: `Config Armed: ${newConfig.strategy} | 0.01 Lot | Ghost System: ${newConfig.useGhostSystem ? 'Active' : 'Off'} | Max 1 Trade.`
        },
        ...prev.logs.slice(0, 80)
      ]
    }));
  };

  const handleUpdateMT5Account = (accountData: Partial<MT5Account>) => {
    setState((prev) => ({
      ...prev,
      mt5Account: { ...prev.mt5Account, ...accountData }
    }));
  };

  const handleUpdateMindset = (mindset: TraderMindset) => {
    setState((prev) => {
      const isTilted = mindset === 'tilted';
      return {
        ...prev,
        psychology: {
          ...prev.psychology,
          traderMindset: mindset,
          disciplineScore: isTilted
            ? Math.max(30, prev.psychology.disciplineScore - 20)
            : Math.min(98, prev.psychology.disciplineScore + 4),
          psychologyLogs: [
            {
              id: `psy_mindset_${Date.now()}`,
              timestamp: Date.now(),
              type: isTilted ? 'tilt_warning' : 'discipline',
              message: `Mindset shifted to ${mindset.toUpperCase()}. ${
                isTilted ? 'Trading locked to prevent rage execution.' : 'State stabilized.'
              }`
            },
            ...prev.psychology.psychologyLogs.slice(0, 40)
          ]
        },
        logs: [
          {
            id: `log_psy_ms_${Date.now()}`,
            timestamp: Date.now(),
            type: 'psychology',
            message: `[MINDSET CHECK] Trader state set to: ${mindset.toUpperCase()}.`
          },
          ...prev.logs.slice(0, 80)
        ]
      };
    });
  };

  const handleTriggerManualCooldown = (minutes: number) => {
    setState((prev) => {
      const now = Date.now();
      const cooldownUntil = now + minutes * 60 * 1000;
      return {
        ...prev,
        psychology: {
          ...prev.psychology,
          cooldownUntil,
          isCircuitBreakerActive: true,
          psychologyLogs: [
            {
              id: `psy_manual_cd_${now}`,
              timestamp: now,
              type: 'circuit_breaker',
              message: `Manual ${minutes}-min breather initiated. Emotional balance reset in progress.`
            },
            ...prev.psychology.psychologyLogs.slice(0, 40)
          ]
        },
        logs: [
          {
            id: `log_manual_cd_${now}`,
            timestamp: now,
            type: 'psychology',
            message: `🧘 Manual ${minutes}-minute emotional reset cooldown activated.`
          },
          ...prev.logs.slice(0, 80)
        ]
      };
    });
  };

  const handleResetCooldown = () => {
    setState((prev) => ({
      ...prev,
      psychology: {
        ...prev.psychology,
        cooldownUntil: null,
        isCircuitBreakerActive: false,
        revengeShieldTriggered: false,
        disciplineScore: Math.min(95, prev.psychology.disciplineScore + 10)
      },
      logs: [
        {
          id: `log_cd_reset_${Date.now()}`,
          timestamp: Date.now(),
          type: 'psychology',
          message: 'Circuit breaker manually reset. Objective discipline restored.'
        },
        ...prev.logs.slice(0, 80)
      ]
    }));
  };

  const handleToggleChecklist = (key: keyof TradingPsychologyState['checklist']) => {
    setState((prev) => ({
      ...prev,
      psychology: {
        ...prev.psychology,
        checklist: {
          ...prev.psychology.checklist,
          [key]: !prev.psychology.checklist[key]
        }
      }
    }));
  };

  const handleManualTrade = (symbol: string, direction: 'BUY' | 'SELL') => {
    setState((prev) => {
      // Check hard constraints: circuit breaker, max 1 trade & daily 25
      if (prev.psychology.isCircuitBreakerActive) {
        return {
          ...prev,
          logs: [
            {
              id: `log_reject_cb_${Date.now()}`,
              timestamp: Date.now(),
              type: 'psychology',
              symbol,
              message: `Order Blocked: Circuit Breaker Active. 5-min cooldown locked to prevent revenge trading.`
            },
            ...prev.logs.slice(0, 80)
          ]
        };
      }

      if (prev.positions.length >= prev.config.maxOpenTrades) {
        return {
          ...prev,
          logs: [
            {
              id: `log_reject_${Date.now()}`,
              timestamp: Date.now(),
              type: 'alert',
              symbol,
              message: `Order Rejected: Max 1 active trade limit reached (${prev.positions.length}/${prev.config.maxOpenTrades}).`
            },
            ...prev.logs.slice(0, 80)
          ]
        };
      }

      if (prev.config.dailyTradesTaken >= prev.config.dailyMaxTrades) {
        return {
          ...prev,
          logs: [
            {
              id: `log_reject_daily_${Date.now()}`,
              timestamp: Date.now(),
              type: 'alert',
              symbol,
              message: `Order Rejected: Daily limit of 25 trades reached (${prev.config.dailyTradesTaken}/${prev.config.dailyMaxTrades}).`
            },
            ...prev.logs.slice(0, 80)
          ]
        };
      }

      const quote = prev.quotes[symbol];
      const symbolDef = ALL_SYMBOLS.find((s) => s.symbol === symbol);
      if (!quote || !symbolDef) return prev;

      const lot = prev.config.fixedLot; // 0.01 lot
      const pip = symbolDef.pipSize;
      const execPrice = direction === 'BUY' ? quote.ask : quote.bid;
      const slPrice =
        direction === 'BUY'
          ? Number((execPrice - prev.config.slPips * pip).toFixed(symbolDef.digits))
          : Number((execPrice + prev.config.slPips * pip).toFixed(symbolDef.digits));
      const tpPrice =
        direction === 'BUY'
          ? Number((execPrice + prev.config.tpPips * pip).toFixed(symbolDef.digits))
          : Number((execPrice - prev.config.tpPips * pip).toFixed(symbolDef.digits));

      const newTicket = Math.floor(100000 + Math.random() * 899999);
      const newPos: Position = {
        id: `pos_manual_${newTicket}`,
        ticket: newTicket,
        symbol,
        type: direction,
        lot,
        openPrice: execPrice,
        currentPrice: execPrice,
        sl: slPrice,
        tp: tpPrice,
        ghostSL: prev.config.useGhostSystem,
        ghostTP: prev.config.useGhostSystem,
        profit: 0,
        profitPips: 0,
        openTime: Date.now(),
        trailingStopActive: false,
        atrTrailActive: false,
        highestPriceSinceOpen: execPrice,
        lowestPriceSinceOpen: execPrice,
        currentAtrDistance: 0,
        strategyName: 'Manual Instant Order',
        executionMode: prev.config.executionMode
      };

      const updatedDailyCount = prev.config.dailyTradesTaken + 1;

      return {
        ...prev,
        positions: [newPos, ...prev.positions],
        config: { ...prev.config, dailyTradesTaken: updatedDailyCount },
        logs: [
          {
            id: `log_manual_${newTicket}`,
            timestamp: Date.now(),
            type: 'execution',
            symbol,
            message: `Manual Order #${newTicket}: ${direction} 0.01 ${symbol} @ ${execPrice} | Ghost SL: ${slPrice} | Trade ${updatedDailyCount}/25 today.`
          },
          ...prev.logs.slice(0, 80)
        ]
      };
    });
  };

  const handleClosePosition = (ticket: number) => {
    setState((prev) => {
      const pos = prev.positions.find((p) => p.ticket === ticket);
      if (!pos) return prev;

      const closedTrade: ClosedTrade = {
        ...pos,
        closePrice: pos.currentPrice,
        closeTime: Date.now(),
        reason: 'MANUAL_CLOSE'
      };

      return {
        ...prev,
        positions: prev.positions.filter((p) => p.ticket !== ticket),
        tradeHistory: [closedTrade, ...prev.tradeHistory],
        logs: [
          {
            id: `log_close_manual_${ticket}`,
            timestamp: Date.now(),
            type: 'execution',
            symbol: pos.symbol,
            message: `Closed Ticket #${ticket} ${pos.symbol} manually. Realized PnL: $${pos.profit.toFixed(2)}.`
          },
          ...prev.logs.slice(0, 80)
        ]
      };
    });
  };

  const handleCloseAllPositions = () => {
    setState((prev) => {
      const now = Date.now();
      const closedTrades: ClosedTrade[] = prev.positions.map((p) => ({
        ...p,
        closePrice: p.currentPrice,
        closeTime: now,
        reason: 'PANIC_CLOSE'
      }));

      return {
        ...prev,
        positions: [],
        tradeHistory: [...closedTrades, ...prev.tradeHistory],
        logs: [
          {
            id: `log_close_all_${now}`,
            timestamp: now,
            type: 'alert',
            message: `Emergency Panic Close executed: Closed all open positions.`
          },
          ...prev.logs.slice(0, 80)
        ]
      };
    });
  };

  const handleCloseProfitable = () => {
    setState((prev) => {
      const now = Date.now();
      const toClose = prev.positions.filter((p) => p.profit > 0);
      const remaining = prev.positions.filter((p) => p.profit <= 0);

      const closedTrades: ClosedTrade[] = toClose.map((p) => ({
        ...p,
        closePrice: p.currentPrice,
        closeTime: now,
        reason: 'MANUAL_CLOSE'
      }));

      return {
        ...prev,
        positions: remaining,
        tradeHistory: [...closedTrades, ...prev.tradeHistory],
        logs: [
          {
            id: `log_close_prof_${now}`,
            timestamp: now,
            type: 'execution',
            message: `Closed ${toClose.length} profitable positions.`
          },
          ...prev.logs.slice(0, 80)
        ]
      };
    });
  };

  const handleBreakEven = (ticket: number) => {
    setState((prev) => {
      const pos = prev.positions.find((p) => p.ticket === ticket);
      const symbolDef = ALL_SYMBOLS.find((s) => s.symbol === pos?.symbol);
      if (!pos || !symbolDef) return prev;

      const pip = symbolDef.pipSize;
      const bePrice =
        pos.type === 'BUY'
          ? Number((pos.openPrice + 1.0 * pip).toFixed(symbolDef.digits))
          : Number((pos.openPrice - 1.0 * pip).toFixed(symbolDef.digits));

      const updated = prev.positions.map((p) =>
        p.ticket === ticket ? { ...p, sl: bePrice } : p
      );

      return {
        ...prev,
        positions: updated,
        logs: [
          {
            id: `log_be_btn_${Date.now()}`,
            timestamp: Date.now(),
            type: 'ghost',
            symbol: pos.symbol,
            message: `[GHOST BREAK-EVEN] Locked Stealth SL on #${ticket} @ ${bePrice}.`
          },
          ...prev.logs.slice(0, 80)
        ]
      };
    });
  };

  const handleClearLogs = () => {
    setState((prev) => ({ ...prev, logs: [] }));
  };

  // Metrics
  const totalFloatingUSD = state.positions.reduce((acc, p) => acc + p.profit, 0);
  const totalRealizedUSD = state.tradeHistory.reduce((acc, t) => acc + t.profit, 0);
  const activeCandles = state.candles[selectedSymbol] || [];
  const activeQuote = state.quotes[selectedSymbol];
  const activeML = state.mlPredictions[selectedSymbol];
  const activeSMC = state.smcOverviews[selectedSymbol];
  const activeDecisionLine = state.decisionLines[selectedSymbol];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* 1. Universal Top Bar Contract: Zone 1 (Wordmark) - Zone 2 (4-5 Nav links) - Zone 3 (1 Primary Action) */}
      <header className="flex items-center justify-between gap-6 px-6 py-3.5 bg-slate-950 border-b border-slate-800 sticky top-0 z-40">
        {/* Zone 1: Single text element wordmark */}
        <div className="flex items-center gap-2.5 whitespace-nowrap shrink-0">
          <span className="text-base font-extrabold tracking-tight text-white">
            MT5 M5 AutoTrader Pro
          </span>
          <span className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Live Market (WebSocket)</span>
          </span>
        </div>

        {/* Zone 2: Navigation links */}
        <nav className="hidden lg:flex items-center gap-5 text-xs font-medium text-slate-400">
          <button
            onClick={() => setActiveView('dashboard')}
            className={`hover:text-white transition-colors whitespace-nowrap shrink-0 ${
              activeView === 'dashboard' ? 'text-sky-400 font-semibold' : ''
            }`}
          >
            Live Cockpit
          </button>
          <button
            onClick={() => setActiveView('scanner')}
            className={`hover:text-white transition-colors whitespace-nowrap shrink-0 ${
              activeView === 'scanner' ? 'text-sky-400 font-semibold' : ''
            }`}
          >
            All-Pairs Scanner
          </button>
          <button
            onClick={() => setActiveView('bookmap_dom')}
            className={`hover:text-white transition-colors whitespace-nowrap shrink-0 flex items-center gap-1 ${
              activeView === 'bookmap_dom' ? 'text-sky-400 font-semibold' : ''
            }`}
          >
            <Flame className="w-3.5 h-3.5 text-amber-400" />
            <span>Bookmap & DOM</span>
          </button>
          <button
            onClick={() => setActiveView('chart')}
            className={`hover:text-white transition-colors whitespace-nowrap shrink-0 ${
              activeView === 'chart' ? 'text-sky-400 font-semibold' : ''
            }`}
          >
            M5 Chart
          </button>
          <button
            onClick={() => setActiveView('psychology')}
            className={`hover:text-white transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
              activeView === 'psychology' ? 'text-sky-400 font-semibold' : ''
            }`}
          >
            <Brain className="w-3.5 h-3.5 text-indigo-400" />
            <span>Psychology</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono font-bold ${
              state.psychology.disciplineScore >= 80
                ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                : state.psychology.disciplineScore >= 50
                ? 'bg-amber-950 text-amber-400 border border-amber-800'
                : 'bg-rose-950 text-rose-400 border border-rose-800 animate-pulse'
            }`}>
              {state.psychology.disciplineScore}
            </span>
          </button>
          <button
            onClick={() => setActiveView('positions')}
            className={`hover:text-white transition-colors whitespace-nowrap shrink-0 ${
              activeView === 'positions' ? 'text-sky-400 font-semibold' : ''
            }`}
          >
            Positions ({state.positions.length}/1)
          </button>
        </nav>

        {/* Zone 3: 1 Primary Action & Core Controls */}
        <div className="flex items-center gap-2.5 shrink-0">
          {/* Active Decision Line Pill */}
          {activeDecisionLine && (
            <div
              title={`M5 Decision Line for ${selectedSymbol}: ${activeDecisionLine.price} (${activeDecisionLine.bias})`}
              className={`hidden xl:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-mono font-bold ${
                activeDecisionLine.bias === 'BULL'
                  ? 'bg-emerald-950/70 border-emerald-800 text-emerald-300'
                  : activeDecisionLine.bias === 'BEAR'
                  ? 'bg-rose-950/70 border-rose-800 text-rose-300'
                  : 'bg-slate-900 border-slate-800 text-slate-300'
              }`}
            >
              <Crosshair className="w-3.5 h-3.5 text-cyan-400" />
              <span>DL: {activeDecisionLine.price}</span>
              <span className="text-[10px] px-1 rounded bg-black/40">
                {activeDecisionLine.bias} ({activeDecisionLine.distancePips >= 0 ? '+' : ''}{activeDecisionLine.distancePips}p)
              </span>
            </div>
          )}

          <button
            onClick={() => setIsGroqModalOpen(true)}
            title="Groq AI Institutional Deep Search"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-emerald-950 text-emerald-300 border border-emerald-800 hover:bg-emerald-900 transition-colors shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Groq AI</span>
          </button>

          <button
            onClick={() => setIsBridgeModalOpen(true)}
            title="MT5 Login Credentials & Broker Server"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-900 hover:bg-slate-800 text-sky-400 border border-slate-800 transition-colors"
          >
            <Server className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">MT5 Connect</span>
          </button>

          <button
            onClick={() => setIsConfigModalOpen(true)}
            title="Configure Strategy & Risk Rules"
            className="p-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-900 border border-slate-800 rounded-lg transition-colors"
          >
            <Sliders className="w-4 h-4" />
          </button>

          <button
            onClick={handleToggleAutoTrade}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-lg transition-all shadow-sm ${
              state.config.autoTradeEnabled
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                : 'bg-rose-600/90 hover:bg-rose-600 text-white'
            }`}
          >
            {state.config.autoTradeEnabled ? (
              <>
                <Square className="w-3.5 h-3.5 fill-current" />
                <span>AutoTrade: RUNNING</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>AutoTrade: PAUSED</span>
              </>
            )}
          </button>
        </div>
      </header>

      {/* Nepali Context & Account Setup Helper */}
      {showNepaliBanner && (
        <div className="bg-sky-950/40 border-b border-sky-900/50 px-6 py-2 flex items-center justify-between text-xs text-slate-300">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sky-300">नेपाली सहयोग:</span>
            <span>
              {state.mt5Account.brokerServer.includes('InvestmentSpot') ? (
                <>
                  <strong className="text-emerald-400">Investment Spot Ltd.</strong> (#<strong>{state.mt5Account.accountNumber}</strong>, $3,000.00 Pro Demo) जडान भयो! 0.01 lot, Max 1 Trade, र Volatility ATR Auto-Trail सहित प्रणाली तयार छ।
                </>
              ) : (
                <>
                  0.01 lot, Max 1 Trade, 25/day सीमा, र Ghost SL सहित <strong>Groq AI Deep Search</strong> ले बजारलाई गहिरो विश्लेषण गरी अटो-ट्रेड गर्दछ।
                </>
              )}
            </span>
            <button
              onClick={() => setIsGroqModalOpen(true)}
              className="text-emerald-400 hover:text-emerald-300 underline font-bold ml-1.5 inline-flex items-center gap-1"
            >
              <Sparkles className="w-3 h-3" />
              <span>Groq AI Deep Search ➔</span>
            </button>
            <button
              onClick={() => setIsBridgeModalOpen(true)}
              className="text-sky-400 hover:text-sky-300 underline font-medium ml-2"
            >
              MT5 Bridge Details ➔
            </button>
          </div>
          <button
            onClick={() => setShowNepaliBanner(false)}
            className="text-slate-400 hover:text-slate-200 text-[11px] ml-4"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* 2. Real-Time KPI & Hard Rules Strip */}
      <section className="px-6 py-3 border-b border-slate-800 bg-slate-950/70">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* Account Balance & Equity */}
          <div className="p-2.5 bg-slate-900 border border-slate-800 rounded-lg">
            <div className="text-[11px] text-slate-400">
              {state.mt5Account.balance >= 500 ? 'MT5 Account Equity' : '$50 Micro Account'}
            </div>
            <div className="text-base font-bold font-mono tabular-nums text-white mt-0.5">
              ${state.mt5Account.equity.toFixed(2)}
            </div>
            <div className="text-[10px] text-emerald-400 font-mono mt-0.5">
              Fixed: 0.01 Lot Size
            </div>
          </div>

          {/* Daily 25 Trades Limit Counter */}
          <div className="p-2.5 bg-slate-900 border border-slate-800 rounded-lg">
            <div className="text-[11px] text-slate-400">Daily Trades Limit</div>
            <div className="text-base font-bold font-mono tabular-nums text-sky-400 mt-0.5">
              {state.config.dailyTradesTaken}{' '}
              <span className="text-xs text-slate-500 font-normal">/ 25 Max</span>
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              {25 - state.config.dailyTradesTaken} trades remaining
            </div>
          </div>

          {/* Open Trade Limit (Strictly 1) */}
          <div className="p-2.5 bg-slate-900 border border-slate-800 rounded-lg">
            <div className="text-[11px] text-slate-400">Open Trades Allowed</div>
            <div className="text-base font-bold font-mono tabular-nums text-white mt-0.5">
              {state.positions.length}{' '}
              <span className="text-xs text-slate-500 font-normal">/ 1 Max</span>
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">
              Strict 1-trade safety
            </div>
          </div>

          {/* Floating P&L */}
          <div className="p-2.5 bg-slate-900 border border-slate-800 rounded-lg">
            <div className="text-[11px] text-slate-400">Floating Profit</div>
            <div
              className={`text-base font-bold font-mono tabular-nums mt-0.5 ${
                totalFloatingUSD >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {totalFloatingUSD >= 0 ? '+' : ''}${totalFloatingUSD.toFixed(2)}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">
              Realized: ${totalRealizedUSD.toFixed(2)}
            </div>
          </div>

          {/* Ghost System Stealth Mode */}
          <div className="p-2.5 bg-slate-900 border border-purple-900/40 rounded-lg">
            <div className="text-[11px] text-purple-400 flex items-center gap-1">
              <EyeOff className="w-3 h-3" />
              <span>Ghost Stealth</span>
            </div>
            <div className="text-xs font-bold text-white mt-1">
              Broker Blind Active
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              Virtual SL & Break-Even
            </div>
          </div>

          {/* MT5 Bridge & Broker Connection */}
          <div
            onClick={() => setIsBridgeModalOpen(true)}
            className="p-2.5 bg-slate-900 border border-slate-800 rounded-lg cursor-pointer hover:border-slate-700 transition-colors"
          >
            <div className="text-[11px] text-slate-400 flex items-center justify-between">
              <span>MT5 Broker Status</span>
              <span className="text-[10px] text-sky-400 underline">Login</span>
            </div>
            <div className="text-xs font-bold text-white mt-1 flex items-center gap-1.5 truncate">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>{state.mt5Account.brokerServer}</span>
            </div>
            <div className="text-[10px] text-slate-400 font-mono mt-0.5">
              #{state.mt5Account.accountNumber} · {state.mt5Account.pingMs}ms
            </div>
          </div>
        </div>
      </section>

      {/* 3. Main Workspace Area */}
      <main className="flex-1 p-6 space-y-6">
        {/* VIEW: Dashboard Unified Cockpit */}
        {activeView === 'dashboard' && (
          <div className="space-y-6">
            {/* Quick Confluence & Mindset Strip */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Decision Line Summary Card */}
              <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-lg flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-cyan-950/80 border border-cyan-800 text-cyan-400">
                    <Crosshair className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                      <span>M5 Decision Line ({selectedSymbol}):</span>
                      <span className="font-mono text-cyan-300">
                        {activeDecisionLine ? activeDecisionLine.price : '--'}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      {activeDecisionLine ? (
                        <>
                          Price is{' '}
                          <strong className={activeDecisionLine.bias === 'BULL' ? 'text-emerald-400' : activeDecisionLine.bias === 'BEAR' ? 'text-rose-400' : 'text-slate-300'}>
                            {activeDecisionLine.distancePips >= 0 ? '+' : ''}{activeDecisionLine.distancePips}p {activeDecisionLine.bias}
                          </strong>{' '}
                          boundary ({activeDecisionLine.status})
                        </>
                      ) : (
                        'Calculating M5 session equilibrium...'
                      )}
                    </div>
                  </div>
                </div>
                {activeDecisionLine && (
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold border ${
                    activeDecisionLine.bias === 'BULL'
                      ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                      : activeDecisionLine.bias === 'BEAR'
                      ? 'bg-rose-950 text-rose-300 border-rose-800'
                      : 'bg-slate-800 text-slate-300 border-slate-700'
                  }`}>
                    {activeDecisionLine.bias === 'BULL' ? '▲ BULL ZONE' : activeDecisionLine.bias === 'BEAR' ? '▼ BEAR ZONE' : '● EQUILIBRIUM'}
                  </span>
                )}
              </div>

              {/* Psychology Status Card */}
              <div
                onClick={() => setActiveView('psychology')}
                className="p-3 bg-slate-950/70 border border-slate-800 rounded-lg flex items-center justify-between cursor-pointer hover:border-indigo-800/80 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-indigo-950/80 border border-indigo-800 text-indigo-400">
                    <Brain className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                      <span>Psychology & Discipline:</span>
                      <span className="font-mono text-indigo-300 capitalize">
                        {state.psychology.traderMindset}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      {state.psychology.isCircuitBreakerActive ? (
                        <span className="text-rose-400 font-semibold">Circuit Breaker Active (Cooldown Locked)</span>
                      ) : state.psychology.revengeShieldTriggered ? (
                        <span className="text-amber-400 font-semibold">Revenge Shield Armed (Cooling down)</span>
                      ) : (
                        <span>Capital Preserved · Fixed 0.01 Lot Strict Compliance</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-950 border border-indigo-800 text-indigo-300 font-bold">
                    {state.psychology.disciplineScore}/100 Score
                  </span>
                </div>
              </div>
            </div>

            {/* Top Split: M5 Chart (7 cols) + DOM/Bookmap Order Flow (5 cols) */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
              <div className="xl:col-span-7 h-[440px]">
                <M5CandleChart
                  symbol={selectedSymbol}
                  candles={activeCandles}
                  quote={activeQuote}
                  positions={state.positions}
                  decisionLine={activeDecisionLine}
                  timeframe={timeframe}
                  onTimeframeChange={setTimeframe}
                />
              </div>

              <div className="xl:col-span-5 h-[440px]">
                <DOMAndBookmapPanel
                  symbol={selectedSymbol}
                  quote={activeQuote}
                  candles={activeCandles}
                  positions={state.positions}
                  bubbles={state.bookmapBubbles}
                  smc={activeSMC}
                  decisionLine={activeDecisionLine}
                  onManualTrade={handleManualTrade}
                />
              </div>
            </div>

            {/* Middle Split: ML & SMC Engine (4 cols) + Active Positions (8 cols) */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
              <div className="xl:col-span-4 h-[350px]">
                <MLSMCPanel
                  symbol={selectedSymbol}
                  ml={activeML}
                  smc={activeSMC}
                  dailyTradesTaken={state.config.dailyTradesTaken}
                  dailyMaxTrades={state.config.dailyMaxTrades}
                  openPositionsCount={state.positions.length}
                  maxOpenTrades={state.config.maxOpenTrades}
                />
              </div>

              <div className="xl:col-span-8 h-[350px]">
                <PositionsPanel
                  positions={state.positions}
                  history={state.tradeHistory}
                  onClosePosition={handleClosePosition}
                  onCloseAll={handleCloseAllPositions}
                  onCloseProfitable={handleCloseProfitable}
                  onBreakEvenPosition={handleBreakEven}
                />
              </div>
            </div>

            {/* Bottom Split: M5 All-Pairs Scanner (8 cols) + Console Log (4 cols) */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
              <div className="xl:col-span-8 h-[380px]">
                <M5ScannerPanel
                  quotes={state.quotes}
                  candles={state.candles}
                  config={state.config}
                  decisionLines={state.decisionLines}
                  selectedSymbol={selectedSymbol}
                  onSelectSymbol={setSelectedSymbol}
                  onTogglePair={handleTogglePair}
                  onToggleAllPairs={handleToggleAllPairs}
                  onManualTrade={handleManualTrade}
                />
              </div>

              <div className="xl:col-span-4 h-[380px]">
                <ConsoleLogsPanel logs={state.logs} onClearLogs={handleClearLogs} />
              </div>
            </div>
          </div>
        )}

        {/* VIEW: Scanner */}
        {activeView === 'scanner' && (
          <div className="h-[740px]">
            <M5ScannerPanel
              quotes={state.quotes}
              candles={state.candles}
              config={state.config}
              decisionLines={state.decisionLines}
              selectedSymbol={selectedSymbol}
              onSelectSymbol={(sym) => {
                setSelectedSymbol(sym);
                setActiveView('dashboard');
              }}
              onTogglePair={handleTogglePair}
              onToggleAllPairs={handleToggleAllPairs}
              onManualTrade={handleManualTrade}
            />
          </div>
        )}

        {/* VIEW: Bookmap & DOM */}
        {activeView === 'bookmap_dom' && (
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 h-[720px]">
            <div className="xl:col-span-8 h-full">
              <DOMAndBookmapPanel
                symbol={selectedSymbol}
                quote={activeQuote}
                candles={activeCandles}
                positions={state.positions}
                bubbles={state.bookmapBubbles}
                smc={activeSMC}
                decisionLine={activeDecisionLine}
                onManualTrade={handleManualTrade}
              />
            </div>
            <div className="xl:col-span-4 h-full">
              <MLSMCPanel
                symbol={selectedSymbol}
                ml={activeML}
                smc={activeSMC}
                dailyTradesTaken={state.config.dailyTradesTaken}
                dailyMaxTrades={state.config.dailyMaxTrades}
                openPositionsCount={state.positions.length}
                maxOpenTrades={state.config.maxOpenTrades}
              />
            </div>
          </div>
        )}

        {/* VIEW: Full M5 Chart */}
        {activeView === 'chart' && (
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 h-[720px]">
            <div className="xl:col-span-3 h-full">
              <M5CandleChart
                symbol={selectedSymbol}
                candles={activeCandles}
                quote={activeQuote}
                positions={state.positions}
                decisionLine={activeDecisionLine}
                timeframe={timeframe}
                onTimeframeChange={setTimeframe}
              />
            </div>
            <div className="xl:col-span-1 h-full">
              <DOMAndBookmapPanel
                symbol={selectedSymbol}
                quote={activeQuote}
                candles={activeCandles}
                positions={state.positions}
                bubbles={state.bookmapBubbles}
                smc={activeSMC}
                decisionLine={activeDecisionLine}
                onManualTrade={handleManualTrade}
              />
            </div>
          </div>
        )}

        {/* VIEW: Psychology & Discipline System */}
        {activeView === 'psychology' && (
          <div className="h-[740px]">
            <TradingPsychologyPanel
              psychology={state.psychology}
              config={state.config}
              positions={state.positions}
              onUpdateMindset={handleUpdateMindset}
              onTriggerManualCooldown={handleTriggerManualCooldown}
              onResetCooldown={handleResetCooldown}
              onToggleChecklist={handleToggleChecklist}
            />
          </div>
        )}

        {/* VIEW: Positions & History */}
        {activeView === 'positions' && (
          <div className="space-y-6">
            <div className="h-[550px]">
              <PositionsPanel
                positions={state.positions}
                history={state.tradeHistory}
                onClosePosition={handleClosePosition}
                onCloseAll={handleCloseAllPositions}
                onCloseProfitable={handleCloseProfitable}
                onBreakEvenPosition={handleBreakEven}
              />
            </div>
            <div className="h-[250px]">
              <ConsoleLogsPanel logs={state.logs} onClearLogs={handleClearLogs} />
            </div>
          </div>
        )}
      </main>

      {/* 4. Footer */}
      <footer className="px-6 py-4 border-t border-slate-800 text-xs text-slate-500 flex flex-wrap items-center justify-between gap-4 bg-slate-950">
        <div className="flex items-center gap-2">
          <span>MT5 M5 AutoTrader Pro</span>
          <span aria-hidden="true">·</span>
          <span>$50 Micro-Account Engine (0.01 Lot)</span>
          <span aria-hidden="true">·</span>
          <span>Ghost System Active (Broker Blind)</span>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setIsBridgeModalOpen(true)}
            className="text-slate-400 hover:text-white transition-colors"
          >
            MT5 Server & EA Setup
          </button>
          <button
            onClick={() => setIsConfigModalOpen(true)}
            className="text-slate-400 hover:text-white transition-colors"
          >
            Risk Rules (Max 1 Open, 25/day)
          </button>
          <span>Server Time: {new Date().toUTCString().slice(17, 25)} UTC</span>
        </div>
      </footer>

      {/* Modals */}
      <MT5BridgeModal
        isOpen={isBridgeModalOpen}
        onClose={() => setIsBridgeModalOpen(false)}
        account={state.mt5Account}
        onUpdateAccount={handleUpdateMT5Account}
        onSendTestOrder={() => handleManualTrade(selectedSymbol, 'BUY')}
      />

      <BotConfigModal
        isOpen={isConfigModalOpen}
        onClose={() => setIsConfigModalOpen(false)}
        config={state.config}
        onSaveConfig={handleSaveConfig}
      />

      <GroqAIDeepSearchModal
        isOpen={isGroqModalOpen}
        onClose={() => setIsGroqModalOpen(false)}
        symbol={selectedSymbol}
        quote={activeQuote}
        candles={activeCandles}
        smc={activeSMC}
        onExecuteTrade={(sym, dir, sl, tp, reason) => {
          handleManualTrade(sym, dir);
        }}
      />
    </div>
  );
}
