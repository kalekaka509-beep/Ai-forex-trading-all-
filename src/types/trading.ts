/**
 * Core Trading & MT5 Types for M5 Automated Trading System
 * Enhanced with SMC, Machine Learning Engine, Depth of Market (DOM),
 * Bookmap Order Flow, Ghost Stop Loss / Stealth System, and $50 micro account rules.
 */

export type MarketCategory = 'forex_major' | 'forex_cross' | 'metal_commodity' | 'crypto_index';

export interface SymbolInfo {
  symbol: string;
  name: string;
  category: MarketCategory;
  digits: number;
  pipSize: number;
  minLot: number;
  maxLot: number;
  lotStep: number;
  spreadPips: number;
  basePrice: number;
  description: string;
  binanceSymbol?: string; // for real live Binance WebSocket
}

export interface TickQuote {
  symbol: string;
  bid: number;
  ask: number;
  spread: number; // in pips
  change24h: number; // percentage
  high24h: number;
  low24h: number;
  time: number; // timestamp ms
  isLiveFeed?: boolean;
  source?: string;
  tickVelocity?: number;
}

export interface Candle {
  time: number; // timestamp ms
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  ema9?: number;
  ema21?: number;
  ema50?: number;
  rsi?: number;
  atr?: number;
  supertrend?: {
    trend: 'up' | 'down';
    value: number;
  };
  smc?: {
    isBOS?: 'bullish' | 'bearish';
    isCHoCH?: 'bullish' | 'bearish';
    fvg?: 'bullish' | 'bearish';
    orderBlock?: 'bullish' | 'bearish';
  };
}

export type StrategyType = 'groq_ai_deep_search' | 'smc_machine_learning' | 'ema_ribbon' | 'smc_fvg' | 'supertrend' | 'bollinger';

export interface TradeSignal {
  id: string;
  symbol: string;
  direction: 'BUY' | 'SELL';
  timeframe: 'M5';
  strategy: StrategyType;
  strategyName: string;
  score: number; // 0 - 100% confidence
  mlConfidence: number; // 0 - 100%
  price: number;
  slPrice: number;
  tpPrice: number;
  ghostSL: boolean;
  reasons: string[];
  timestamp: number;
  status: 'PENDING' | 'EXECUTED' | 'EXPIRED' | 'REJECTED';
}

export interface Position {
  id: string;
  ticket: number;
  symbol: string;
  type: 'BUY' | 'SELL';
  lot: number;
  openPrice: number;
  currentPrice: number;
  sl: number;
  tp: number;
  ghostSL: boolean; // invisible to broker
  ghostTP: boolean;
  profit: number; // in USD
  profitPips: number;
  openTime: number;
  trailingStopActive: boolean;
  atrTrailActive?: boolean;
  highestPriceSinceOpen?: number;
  lowestPriceSinceOpen?: number;
  currentAtrDistance?: number;
  strategyName: string;
  executionMode: 'live_mt5' | 'paper';
}

export interface ClosedTrade extends Position {
  closePrice: number;
  closeTime: number;
  reason: 'TP_HIT' | 'SL_HIT' | 'GHOST_SL' | 'GHOST_TP' | 'TRAILING_SL' | 'MANUAL_CLOSE' | 'PANIC_CLOSE';
}

export interface MT5Account {
  accountNumber: string;
  brokerServer: string;
  brokerName?: string;
  password?: string;
  investorPassword?: string;
  accountType: 'Live' | 'Demo';
  currency: string;
  balance: number;
  equity: number;
  margin: number;
  freeMargin: number;
  marginLevel: number;
  leverage: number;
  connected: boolean;
  pingMs: number;
  terminalVersion: string;
  lastHeartbeat: number;
  bridgeMode: 'ea_webrequest' | 'python_gateway' | 'rest_webhook';
}

export interface BotConfig {
  autoTradeEnabled: boolean;
  executionMode: 'live_mt5' | 'paper';
  selectedPairs: string[]; // e.g. ['EURUSD', 'GBPUSD', 'XAUUSD', ...]
  strategy: StrategyType;
  
  // $50 Account & Strict Risk Constraints
  accountStartBalance: number; // $50
  fixedLot: number; // 0.01 lot default
  maxOpenTrades: number; // strictly 1
  dailyMaxTrades: number; // strictly 25 max trades/day
  dailyTradesTaken: number; // counter for today
  
  // Ghost System (Stealth Virtual SL/TP)
  useGhostSystem: boolean; // true = broker blind, SL kept in memory
  useGhostBreakEven: boolean; // moves ghost SL to entry + 1 pip
  ghostBreakEvenPips: number; // default +10 pips
  useGhostTrailing: boolean; // trails virtual SL
  ghostTrailingPips: number; // default 15 pips

  // Volatility-Adjusted ATR Auto-Trail
  useAtrAutoTrail: boolean; // Dynamic trailing based on current M5 ATR
  atrTrailMultiplier: number; // e.g. 2.0x ATR buffer
  atrTrailActivationAtrRatio: number; // activate once in profit by e.g. 1.0x ATR

  // Stop Loss & Take Profit
  slPips: number;
  tpPips: number;
  maxSpreadPips: number;
  
  // Machine Learning & SMC
  useMLEngine: boolean;
  mlConfidenceMin: number; // e.g. 75%
  useSMC: boolean; // Smart Money Concepts
  
  // Groq AI Deep Search
  useGroqAIDeepSearch: boolean;
  groqAIAutoExecute: boolean;
  groqAIConfidenceMin: number; // e.g. 80%

  // MT5 Credentials
  mt5AccountNumber: string;
  mt5Server: string;
  mt5Password: string;
}

export interface BotLog {
  id: string;
  timestamp: number;
  type: 'info' | 'signal' | 'execution' | 'alert' | 'error' | 'ghost' | 'ml' | 'groq' | 'autotrail' | 'psychology' | 'decision_line';
  symbol?: string;
  message: string;
}

export interface GroqAIDeepSearchResult {
  symbol: string;
  provider: string; // 'Groq LLaMA-3.3' or 'Gemini 2.5 Flash'
  model: string;
  direction: 'BUY' | 'SELL' | 'WAIT';
  confidence: number;
  entryPrice: number;
  ghostSL: number;
  ghostTP: number;
  riskRewardRatio: string;
  deepSearchSummary: string;
  institutionalFactors: string[];
  macroBias: string;
  tradeApproved: boolean;
  timestamp: number;
  executionStatus?: 'EXECUTED' | 'STANDBY' | 'REJECTED';
}

// Level 2 Depth of Market (DOM)
export interface DOMRow {
  price: number;
  bidVolume: number;
  askVolume: number;
  totalVolume: number;
  isCurrentPrice?: boolean;
  myOrder?: 'BUY' | 'SELL' | null;
  ghostLevel?: 'GHOST_SL' | 'GHOST_TP' | null;
}

// Bookmap Order Flow Bubble
export interface BookmapBubble {
  id: string;
  time: number;
  price: number;
  volume: number;
  side: 'buy' | 'sell';
  aggression: number; // 0 to 1
}

// Machine Learning Model Prediction
export interface MLPrediction {
  symbol: string;
  timestamp: number;
  direction: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  bullishProbability: number; // 0 - 100%
  bearishProbability: number; // 0 - 100%
  confidenceScore: number; // 0 - 100%
  regime: 'Trend Expansion' | 'Liquidity Sweep' | 'Range Consolidation' | 'High Volatility Breakout';
  features: {
    name: string;
    weight: number;
    value: string;
    impact: 'bullish' | 'bearish' | 'neutral';
  }[];
}

export interface SMCOverview {
  symbol: string;
  bosLevel: { price: number; type: 'bullish' | 'bearish' } | null;
  chochLevel: { price: number; type: 'bullish' | 'bearish' } | null;
  orderBlocks: { top: number; bottom: number; type: 'bullish' | 'bearish'; mitigated: boolean }[];
  fvgs: { top: number; bottom: number; type: 'bullish' | 'bearish'; mitigated: boolean }[];
  liquidityPools: { price: number; label: 'BSL (Buy-Side)' | 'SSL (Sell-Side)' }[];
}

// Institutional Decision Line (Dynamic Equilibrium & Session Boundary)
export interface DecisionLineInfo {
  symbol: string;
  price: number;
  bias: 'BULL' | 'BEAR' | 'NEUTRAL';
  distancePips: number;
  status: 'Bull Expansion' | 'Bear Expansion' | 'Testing Boundary' | 'Equilibrium Zone';
  sessionHigh: number;
  sessionLow: number;
  equilibriumPrice: number;
  strengthPercent: number; // 0 - 100%
  breakoutTarget: number;
  inversionLevel: number;
}

// Trading Psychology & Discipline Guardian System
export type TraderMindset = 'calm' | 'focused' | 'anxious' | 'tilted' | 'fatigued';

export interface PsychologyLogItem {
  id: string;
  timestamp: number;
  type: 'discipline' | 'tilt_warning' | 'circuit_breaker' | 'fomo_blocked' | 'zen_boost';
  message: string;
}

export interface TradingPsychologyState {
  disciplineScore: number; // 0 - 100
  traderMindset: TraderMindset;
  consecutiveLosses: number;
  consecutiveWins: number;
  cooldownUntil: number | null; // timestamp ms if circuit breaker is active
  isCircuitBreakerActive: boolean;
  revengeShieldTriggered: boolean;
  fomoAlert: boolean;
  overconfidenceRisk: boolean;
  lastTradeTime: number | null;
  lastTradePnL: number | null;
  cooldownDurationMinutes: number;
  maxConsecutiveLossesAllowed: number;
  psychologyLogs: PsychologyLogItem[];
  checklist: {
    confluenceConfirmed: boolean;
    riskAccepted: boolean;
    emotionsNeutral: boolean;
    ghostPlanLocked: boolean;
  };
}
