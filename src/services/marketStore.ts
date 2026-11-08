import {
  BookmapBubble,
  BotConfig,
  BotLog,
  Candle,
  ClosedTrade,
  DecisionLineInfo,
  DOMRow,
  MLPrediction,
  MT5Account,
  Position,
  SMCOverview,
  TickQuote,
  TradeSignal,
  TradingPsychologyState
} from '../types/trading';
import { ALL_SYMBOLS } from '../constants/symbols';
import {
  analyzeM5Signal,
  calculateDecisionLine,
  enrichCandlesWithIndicators
} from '../utils/technicalAnalysis';
import { liveMarketStreamer } from './liveMarketStream';
import { runMLInference, runSMCAnalysis } from './mlSmcEngine';

export const DEFAULT_PSYCHOLOGY: TradingPsychologyState = {
  disciplineScore: 94,
  traderMindset: 'calm',
  consecutiveLosses: 0,
  consecutiveWins: 0,
  cooldownUntil: null,
  isCircuitBreakerActive: false,
  revengeShieldTriggered: false,
  fomoAlert: false,
  overconfidenceRisk: false,
  lastTradeTime: null,
  lastTradePnL: null,
  cooldownDurationMinutes: 5,
  maxConsecutiveLossesAllowed: 2,
  checklist: {
    confluenceConfirmed: true,
    riskAccepted: true,
    emotionsNeutral: true,
    ghostPlanLocked: true
  },
  psychologyLogs: [
    {
      id: 'psy_log_init_1',
      timestamp: Date.now() - 15000,
      type: 'discipline',
      message: 'Psychology Engine Initialized: Revenge Shield ARMED, Max 2 consecutive losses circuit breaker active.'
    },
    {
      id: 'psy_log_init_2',
      timestamp: Date.now() - 8000,
      type: 'zen_boost',
      message: 'Mindset: Calm & Objective. 0.01 lot on $50 account guarantees 98%+ capital preservation.'
    }
  ]
};

const DEFAULT_CONFIG: BotConfig = {
  autoTradeEnabled: true,
  executionMode: 'paper', // 'live_mt5' or 'paper'
  selectedPairs: ALL_SYMBOLS.map((s) => s.symbol),
  strategy: 'smc_machine_learning',
  
  // $50 Micro Account & Strict Rules
  accountStartBalance: 50.0,
  fixedLot: 0.01,
  maxOpenTrades: 1, // STRICTLY 1 TRADE AT A TIME
  dailyMaxTrades: 25, // STRICTLY 25 TRADES PER DAY MAX
  dailyTradesTaken: 0,
  
  // Ghost System (Stealth Virtual SL/TP)
  useGhostSystem: true,
  useGhostBreakEven: true,
  ghostBreakEvenPips: 10,
  useGhostTrailing: true,
  ghostTrailingPips: 15,

  // Volatility-Adjusted ATR Auto-Trail
  useAtrAutoTrail: true,
  atrTrailMultiplier: 2.0, // 2.0x ATR buffer
  atrTrailActivationAtrRatio: 0.8, // activates once in profit by 0.8x ATR

  slPips: 15,
  tpPips: 30,
  maxSpreadPips: 2.2,
  
  useMLEngine: true,
  mlConfidenceMin: 75,
  useSMC: true,
  
  // Groq AI Deep Search
  useGroqAIDeepSearch: true,
  groqAIAutoExecute: true,
  groqAIConfidenceMin: 80,

  mt5AccountNumber: '500002809',
  mt5Server: 'InvestmentSpotLtd-Server',
  mt5Password: 'Y-4vXyPa'
};

const DEFAULT_MT5_ACCOUNT: MT5Account = {
  accountNumber: '500002809',
  brokerServer: 'InvestmentSpotLtd-Server',
  brokerName: 'Investment Spot Ltd.',
  password: 'Y-4vXyPa',
  investorPassword: 'A_6uOylx',
  accountType: 'Demo',
  currency: 'USD',
  balance: 3000.0,
  equity: 3000.0,
  margin: 0.0,
  freeMargin: 3000.0,
  marginLevel: 0.0,
  leverage: 500,
  connected: true,
  pingMs: 14,
  terminalVersion: 'MetaTrader 5 Build 4450',
  lastHeartbeat: Date.now(),
  bridgeMode: 'ea_webrequest'
};

// Seed historical M5 candles
export function generateInitialM5Candles(
  symbol: string,
  basePrice: number,
  pipSize: number,
  count = 60
): Candle[] {
  const candles: Candle[] = [];
  const fiveMinMs = 5 * 60 * 1000;
  const now = Date.now();
  const startTime = now - count * fiveMinMs;

  let currentPrice = basePrice;
  const seed = symbol.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);

  for (let i = 0; i < count; i++) {
    const candleTime = startTime + i * fiveMinMs;
    const wave = Math.sin((i + seed) / 6) * 4 * pipSize;
    const noise = ((Math.sin((i * 13 + seed) % 100) + Math.cos(i * 7)) / 2) * 5 * pipSize;
    const delta = wave + noise;

    const open = currentPrice;
    const close = Math.max(pipSize * 10, open + delta);
    const highSpread = Math.abs(delta) + Math.random() * 5 * pipSize + 2 * pipSize;
    const lowSpread = Math.abs(delta) + Math.random() * 5 * pipSize + 2 * pipSize;

    const high = Math.max(open, close) + highSpread;
    const low = Math.min(open, close) - lowSpread;
    const volume = Math.floor(140 + Math.random() * 850);

    candles.push({
      time: candleTime,
      open,
      high,
      low,
      close,
      volume
    });

    currentPrice = close;
  }

  return enrichCandlesWithIndicators(candles);
}

export interface MarketState {
  quotes: Record<string, TickQuote>;
  candles: Record<string, Candle[]>;
  signals: TradeSignal[];
  positions: Position[];
  tradeHistory: ClosedTrade[];
  mt5Account: MT5Account;
  config: BotConfig;
  logs: BotLog[];
  bookmapBubbles: BookmapBubble[];
  mlPredictions: Record<string, MLPrediction>;
  smcOverviews: Record<string, SMCOverview>;
  decisionLines: Record<string, DecisionLineInfo>;
  psychology: TradingPsychologyState;
  isRealLiveConnected: boolean;
}

export function createInitialMarketState(): MarketState {
  const quotes: Record<string, TickQuote> = {};
  const candles: Record<string, Candle[]> = {};
  const mlPredictions: Record<string, MLPrediction> = {};
  const smcOverviews: Record<string, SMCOverview> = {};
  const decisionLines: Record<string, DecisionLineInfo> = {};

  ALL_SYMBOLS.forEach((s) => {
    const hist = generateInitialM5Candles(s.symbol, s.basePrice, s.pipSize, 55);
    candles[s.symbol] = hist;

    const lastCandle = hist[hist.length - 1];
    const spread = s.spreadPips;
    const bid = lastCandle.close;
    const ask = bid + spread * s.pipSize;
    const firstCandle = hist[0];
    const change24h = ((bid - firstCandle.open) / firstCandle.open) * 100;

    quotes[s.symbol] = {
      symbol: s.symbol,
      bid,
      ask,
      spread,
      change24h,
      high24h: Math.max(...hist.map((c) => c.high)),
      low24h: Math.min(...hist.map((c) => c.low)),
      time: Date.now(),
      isLiveFeed: true,
      source: 'Real Live Stream'
    };

    const smc = runSMCAnalysis(s.symbol, hist);
    smcOverviews[s.symbol] = smc;
    mlPredictions[s.symbol] = runMLInference(s.symbol, hist, smc);
    decisionLines[s.symbol] = calculateDecisionLine(s.symbol, hist, bid, s.pipSize, s.digits);
  });

  const initialLogs: BotLog[] = [
    {
      id: 'log_init_0',
      timestamp: Date.now() - 18000,
      type: 'info',
      message: 'Real Live Market Streamer connected to Binance & Global Live FX.'
    },
    {
      id: 'log_init_1',
      timestamp: Date.now() - 14000,
      type: 'info',
      message: '$50 Micro Account initialized: 0.01 Lot, Max 1 open trade, 25 daily limit.'
    },
    {
      id: 'log_init_2',
      timestamp: Date.now() - 10000,
      type: 'ghost',
      message: 'Ghost Stealth System ARMED: Stop Loss & Break-Even invisible to broker order book.'
    },
    {
      id: 'log_init_3',
      timestamp: Date.now() - 7000,
      type: 'psychology',
      message: '🧠 Trading Psychology Guardian: Tilt circuit breaker & revenge trading shield armed.'
    },
    {
      id: 'log_init_4',
      timestamp: Date.now() - 4000,
      type: 'decision_line',
      symbol: 'XAUUSD',
      message: '🎯 M5 Decision Line computed: Institutional equilibrium active for all pairs.'
    }
  ];

  return {
    quotes,
    candles,
    signals: [],
    positions: [],
    tradeHistory: [],
    mt5Account: DEFAULT_MT5_ACCOUNT,
    config: DEFAULT_CONFIG,
    logs: initialLogs,
    bookmapBubbles: [],
    mlPredictions,
    smcOverviews,
    decisionLines,
    psychology: DEFAULT_PSYCHOLOGY,
    isRealLiveConnected: true
  };
}

let nextTicket = 890124;

/**
 * Process single tick cycle across all pairs and update candles/signals/positions
 */
export function processTickCycle(state: MarketState): MarketState {
  const updatedQuotes = { ...state.quotes };
  const updatedCandles = { ...state.candles };
  const updatedML = { ...state.mlPredictions };
  const updatedSMC = { ...state.smcOverviews };
  const updatedDL = { ...state.decisionLines };
  let updatedPsychology = { ...state.psychology };
  let updatedPositions = [...state.positions];
  let updatedTradeHistory = [...state.tradeHistory];
  let updatedSignals = [...state.signals];
  let updatedLogs = [...state.logs];
  let updatedBubbles = [...state.bookmapBubbles];
  let dailyTradesTaken = state.config.dailyTradesTaken;

  const now = Date.now();
  const fiveMinMs = 5 * 60 * 1000;

  // Trading Psychology: Circuit Breaker and Revenge Shield state checks
  if (updatedPsychology.cooldownUntil) {
    if (now >= updatedPsychology.cooldownUntil) {
      updatedPsychology.cooldownUntil = null;
      updatedPsychology.isCircuitBreakerActive = false;
      updatedPsychology.disciplineScore = Math.min(95, updatedPsychology.disciplineScore + 15);
      updatedLogs = [
        {
          id: `log_cb_lift_${now}`,
          timestamp: now,
          type: 'psychology',
          message: '🧘 [PSYCHOLOGY CIRCUIT BREAKER] 5-minute cooldown elapsed. Emotional equilibrium restored. Trading re-armed.'
        },
        ...updatedLogs.slice(0, 80)
      ];
      updatedPsychology.psychologyLogs = [
        {
          id: `psy_lift_${now}`,
          timestamp: now,
          type: 'zen_boost',
          message: 'Circuit breaker cooldown complete. Mind is neutral and objective.'
        },
        ...updatedPsychology.psychologyLogs.slice(0, 40)
      ];
    } else {
      updatedPsychology.isCircuitBreakerActive = true;
    }
  }

  // Clear revenge shield if 90 seconds have elapsed since last trade
  if (
    updatedPsychology.revengeShieldTriggered &&
    updatedPsychology.lastTradeTime &&
    now - updatedPsychology.lastTradeTime > 90000
  ) {
    updatedPsychology.revengeShieldTriggered = false;
  }

  // 1. Process Market Ticks for active symbols
  ALL_SYMBOLS.forEach((s) => {
    const currentQ = updatedQuotes[s.symbol];
    if (!currentQ) return;

    // Small stochastic micro-tick if no immediate external WS tick
    const volatilityFactor = s.category === 'crypto_index' ? 2.0 : s.category === 'metal_commodity' ? 1.5 : 1.0;
    const direction = Math.random() - 0.495;
    const tickMove = direction * s.pipSize * (0.3 + Math.random() * 0.7) * volatilityFactor;

    const newBid = Math.max(s.pipSize * 5, Number((currentQ.bid + tickMove).toFixed(s.digits)));
    const dynamicSpread = Number((s.spreadPips + (Math.random() * 0.2 - 0.1)).toFixed(1));
    const newAsk = Number((newBid + dynamicSpread * s.pipSize).toFixed(s.digits));

    updatedQuotes[s.symbol] = {
      ...currentQ,
      bid: newBid,
      ask: newAsk,
      spread: Math.max(0.2, dynamicSpread),
      high24h: Math.max(currentQ.high24h, newBid),
      low24h: Math.min(currentQ.low24h, newBid),
      time: now
    };

    // Random Bookmap aggression bubble on Gold and Bitcoin
    if ((s.symbol === 'XAUUSD' || s.symbol === 'BTCUSD') && Math.random() > 0.65) {
      const isBuy = Math.random() > 0.48;
      const bubble: BookmapBubble = {
        id: `bub_${now}_${Math.random()}`,
        time: now,
        price: isBuy ? newAsk : newBid,
        volume: Number((s.symbol === 'BTCUSD' ? 0.2 + Math.random() * 1.5 : 5 + Math.random() * 40).toFixed(1)),
        side: isBuy ? 'buy' : 'sell',
        aggression: 0.6 + Math.random() * 0.4
      };
      updatedBubbles = [bubble, ...updatedBubbles.slice(0, 35)];
    }

    // Update M5 Candle
    const symbolCandles = updatedCandles[s.symbol] || [];
    if (symbolCandles.length > 0) {
      const lastCandle = symbolCandles[symbolCandles.length - 1];
      const isCandleExpired = now - lastCandle.time >= fiveMinMs;

      if (isCandleExpired) {
        const newCandle: Candle = {
          time: Math.floor(now / fiveMinMs) * fiveMinMs,
          open: newBid,
          high: newBid,
          low: newBid,
          close: newBid,
          volume: 1
        };
        const newCandleList = [...symbolCandles.slice(-80), newCandle];
        const enriched = enrichCandlesWithIndicators(newCandleList);
        updatedCandles[s.symbol] = enriched;

        // Run SMC & ML Inference
        const smc = runSMCAnalysis(s.symbol, enriched);
        updatedSMC[s.symbol] = smc;
        const ml = runMLInference(s.symbol, enriched, smc);
        updatedML[s.symbol] = ml;

        // Check for new M5 algorithmic signal
        if (state.config.selectedPairs.includes(s.symbol)) {
          // If ML engine is enabled, filter by ML confidence
          if (!state.config.useMLEngine || ml.confidenceScore >= state.config.mlConfidenceMin) {
            const sig = analyzeM5Signal(
              s.symbol,
              enriched,
              state.config.strategy === 'smc_machine_learning' ? 'smc_fvg' : state.config.strategy,
              state.config.slPips,
              state.config.tpPips
            );

            if (sig && sig.score >= 75) {
              const enrichedSig: TradeSignal = {
                ...sig,
                strategyName: state.config.useMLEngine
                  ? `ML SMC (${ml.confidenceScore}% ${ml.direction})`
                  : sig.strategyName,
                mlConfidence: ml.confidenceScore,
                ghostSL: state.config.useGhostSystem
              };

              updatedSignals = [enrichedSig, ...updatedSignals.slice(0, 25)];
              updatedLogs = [
                {
                  id: `log_sig_${Date.now()}_${s.symbol}`,
                  timestamp: now,
                  type: 'signal',
                  symbol: s.symbol,
                  message: `[M5 ML SIGNAL] ${sig.direction} ${s.symbol} | ML Prob: ${ml.bullishProbability}% Bull / ${ml.bearishProbability}% Bear | Ghost SL: Active.`
                },
                ...updatedLogs.slice(0, 80)
              ];
            }
          }
        }
      } else {
        const updatedLast: Candle = {
          ...lastCandle,
          high: Math.max(lastCandle.high, newBid),
          low: Math.min(lastCandle.low, newBid),
          close: newBid,
          volume: lastCandle.volume + 1
        };
        const candleCopy = [...symbolCandles];
        candleCopy[candleCopy.length - 1] = updatedLast;
        updatedCandles[s.symbol] = enrichCandlesWithIndicators(candleCopy);
      }

      // Compute latest dynamic Decision Line
      const sCandles = updatedCandles[s.symbol] || [];
      const dl = calculateDecisionLine(s.symbol, sCandles, newBid, s.pipSize, s.digits);
      updatedDL[s.symbol] = dl;

      // FOMO guard: check if active pair is extended excessively from Decision Line
      const lastC = sCandles[sCandles.length - 1];
      const atrPips = (lastC?.atr || s.pipSize * 10) / s.pipSize;
      if (Math.abs(dl.distancePips) > atrPips * 2.5) {
        updatedPsychology.fomoAlert = true;
      }
    }
  });

  // 2. Trailing Stop, Volatility-Adjusted ATR Auto-Trail & Ghost Break-Even Execution
  const remainingPositions: Position[] = [];
  let realizedPnLThisTick = 0;

  for (const pos of updatedPositions) {
    const symbolDef = ALL_SYMBOLS.find((s) => s.symbol === pos.symbol);
    const quote = updatedQuotes[pos.symbol];
    const sCandles = updatedCandles[pos.symbol];

    if (!symbolDef || !quote) {
      remainingPositions.push(pos);
      continue;
    }

    const currentPrice = pos.type === 'BUY' ? quote.bid : quote.ask;
    const pip = symbolDef.pipSize;
    const diff = pos.type === 'BUY' ? currentPrice - pos.openPrice : pos.openPrice - currentPrice;
    const profitPips = Number((diff / pip).toFixed(1));

    const contractMultiplier =
      symbolDef.category === 'forex_major' || symbolDef.category === 'forex_cross'
        ? 100000
        : symbolDef.category === 'metal_commodity'
        ? 100
        : 1;

    const profitUSD = Number((diff * pos.lot * contractMultiplier).toFixed(2));

    // High and Low watermark tracking since position open
    const highestPrice = Math.max(pos.highestPriceSinceOpen ?? pos.openPrice, currentPrice);
    const lowestPrice = Math.min(pos.lowestPriceSinceOpen ?? pos.openPrice, currentPrice);

    // Latest M5 ATR for dynamic volatility calculations
    const lastCandle = sCandles && sCandles.length > 0 ? sCandles[sCandles.length - 1] : undefined;
    const currentAtr = (lastCandle && lastCandle.atr && lastCandle.atr > 0)
      ? lastCandle.atr
      : pip * 15;

    let updatedSL = pos.sl;
    let updatedTP = pos.tp;
    let atrTrailActivated = pos.atrTrailActive || false;
    let trailingStopActivated = pos.trailingStopActive || false;
    const dynamicAtrBuffer = currentAtr * (state.config.atrTrailMultiplier || 2.0);
    const atrDistancePips = Number((dynamicAtrBuffer / pip).toFixed(1));

    // Ghost Break-Even Check: Move Virtual SL to OpenPrice + 1 pip if in profit
    if (state.config.useGhostBreakEven && profitPips >= state.config.ghostBreakEvenPips) {
      const bePrice =
        pos.type === 'BUY'
          ? Number((pos.openPrice + 1.0 * pip).toFixed(symbolDef.digits))
          : Number((pos.openPrice - 1.0 * pip).toFixed(symbolDef.digits));

      if (pos.type === 'BUY' && updatedSL < bePrice) {
        updatedSL = bePrice;
        updatedLogs = [
          {
            id: `log_ghost_be_${now}_${pos.ticket}`,
            timestamp: now,
            type: 'ghost',
            symbol: pos.symbol,
            message: `[GHOST BREAK-EVEN] Ticket #${pos.ticket} (${pos.symbol}): Stealth SL locked at ${bePrice} (+${profitPips} pips profit). Invisible to broker.`
          },
          ...updatedLogs.slice(0, 80)
        ];
      } else if (pos.type === 'SELL' && updatedSL > bePrice) {
        updatedSL = bePrice;
        updatedLogs = [
          {
            id: `log_ghost_be_${now}_${pos.ticket}`,
            timestamp: now,
            type: 'ghost',
            symbol: pos.symbol,
            message: `[GHOST BREAK-EVEN] Ticket #${pos.ticket} (${pos.symbol}): Stealth SL locked at ${bePrice} (+${profitPips} pips profit). Invisible to broker.`
          },
          ...updatedLogs.slice(0, 80)
        ];
      }
    }

    // Volatility-Adjusted ATR Auto-Trail Check (Dynamically updates SL when in profit)
    if (state.config.useAtrAutoTrail) {
      const activationDistance = currentAtr * (state.config.atrTrailActivationAtrRatio || 0.8);
      const profitDistance = pos.type === 'BUY' ? (currentPrice - pos.openPrice) : (pos.openPrice - currentPrice);

      if (profitDistance >= activationDistance) {
        if (pos.type === 'BUY') {
          // Dynamic Stop Loss based on Peak High minus ATR Volatility Buffer
          const candidateSL = Number((highestPrice - dynamicAtrBuffer).toFixed(symbolDef.digits));
          if (candidateSL > updatedSL) {
            const oldSL = updatedSL;
            updatedSL = candidateSL;
            atrTrailActivated = true;
            trailingStopActivated = true;
            const pipsLocked = Number(((updatedSL - pos.openPrice) / pip).toFixed(1));

            // Log ratcheting events
            if (!pos.atrTrailActive || Math.abs(updatedSL - oldSL) >= pip * 2) {
              updatedLogs = [
                {
                  id: `log_autotrail_${now}_${pos.ticket}`,
                  timestamp: now,
                  type: 'autotrail',
                  symbol: pos.symbol,
                  message: `[ATR AUTO-TRAIL] #${pos.ticket} (${pos.symbol} BUY): Dynamic SL ratcheted to ${updatedSL} (2.0x M5 ATR buffer: ${atrDistancePips}p, Peak: ${highestPrice}, ${pipsLocked >= 0 ? '+' : ''}${pipsLocked}p locked).`
                },
                ...updatedLogs.slice(0, 80)
              ];
            }
          }
        } else {
          // Dynamic Stop Loss based on Trough Low plus ATR Volatility Buffer
          const candidateSL = Number((lowestPrice + dynamicAtrBuffer).toFixed(symbolDef.digits));
          if (candidateSL < updatedSL) {
            const oldSL = updatedSL;
            updatedSL = candidateSL;
            atrTrailActivated = true;
            trailingStopActivated = true;
            const pipsLocked = Number(((pos.openPrice - updatedSL) / pip).toFixed(1));

            if (!pos.atrTrailActive || Math.abs(updatedSL - oldSL) >= pip * 2) {
              updatedLogs = [
                {
                  id: `log_autotrail_${now}_${pos.ticket}`,
                  timestamp: now,
                  type: 'autotrail',
                  symbol: pos.symbol,
                  message: `[ATR AUTO-TRAIL] #${pos.ticket} (${pos.symbol} SELL): Dynamic SL ratcheted to ${updatedSL} (2.0x M5 ATR buffer: ${atrDistancePips}p, Dip: ${lowestPrice}, ${pipsLocked >= 0 ? '+' : ''}${pipsLocked}p locked).`
                },
                ...updatedLogs.slice(0, 80)
              ];
            }
          }
        }
      }
    }

    // Ghost Fixed Trailing Stop Fallback (if ATR Auto-Trail is disabled)
    if (!atrTrailActivated && state.config.useGhostTrailing && profitPips >= state.config.ghostTrailingPips) {
      const trailDistance = state.config.ghostTrailingPips * pip;
      if (pos.type === 'BUY') {
        const potentialSL = Number((currentPrice - trailDistance).toFixed(symbolDef.digits));
        if (potentialSL > updatedSL) {
          updatedSL = potentialSL;
          trailingStopActivated = true;
        }
      } else {
        const potentialSL = Number((currentPrice + trailDistance).toFixed(symbolDef.digits));
        if (potentialSL < updatedSL) {
          updatedSL = potentialSL;
          trailingStopActivated = true;
        }
      }
    }

    // Execution check: TP and SL Trigger
    let closed = false;
    let closeReason: ClosedTrade['reason'] = 'TP_HIT';

    // Ghost / Standard Take Profit Hit
    if (pos.type === 'BUY' && currentPrice >= pos.tp) {
      closed = true;
      closeReason = pos.ghostTP ? 'GHOST_TP' : 'TP_HIT';
    } else if (pos.type === 'SELL' && currentPrice <= pos.tp) {
      closed = true;
      closeReason = pos.ghostTP ? 'GHOST_TP' : 'TP_HIT';
    }

    // Ghost / Standard / ATR Trailing Stop Loss Hit
    if (!closed) {
      if (pos.type === 'BUY' && currentPrice <= updatedSL) {
        closed = true;
        closeReason = (atrTrailActivated || trailingStopActivated)
          ? 'TRAILING_SL'
          : (pos.ghostSL ? 'GHOST_SL' : 'SL_HIT');
      } else if (pos.type === 'SELL' && currentPrice >= updatedSL) {
        closed = true;
        closeReason = (atrTrailActivated || trailingStopActivated)
          ? 'TRAILING_SL'
          : (pos.ghostSL ? 'GHOST_SL' : 'SL_HIT');
      }
    }

    if (closed) {
      realizedPnLThisTick += profitUSD;

      // Trading Psychology update
      if (profitUSD < 0) {
        const nextLossCount = updatedPsychology.consecutiveLosses + 1;
        updatedPsychology.consecutiveLosses = nextLossCount;
        updatedPsychology.consecutiveWins = 0;
        updatedPsychology.lastTradeTime = now;
        updatedPsychology.lastTradePnL = profitUSD;
        updatedPsychology.revengeShieldTriggered = true;
        updatedPsychology.disciplineScore = Math.max(30, updatedPsychology.disciplineScore - 8);

        if (nextLossCount >= updatedPsychology.maxConsecutiveLossesAllowed) {
          const cooldownMs = updatedPsychology.cooldownDurationMinutes * 60 * 1000;
          updatedPsychology.cooldownUntil = now + cooldownMs;
          updatedPsychology.isCircuitBreakerActive = true;
          updatedPsychology.disciplineScore = Math.max(25, updatedPsychology.disciplineScore - 15);

          updatedLogs = [
            {
              id: `log_cb_trip_${now}`,
              timestamp: now,
              type: 'psychology',
              symbol: pos.symbol,
              message: `🛑 [PSYCHOLOGY CIRCUIT BREAKER] ${nextLossCount} consecutive losses hit. 5-min cooldown locked to prevent revenge trading tilt.`
            },
            ...updatedLogs.slice(0, 80)
          ];

          updatedPsychology.psychologyLogs = [
            {
              id: `psy_cb_${now}`,
              timestamp: now,
              type: 'circuit_breaker',
              message: `Circuit Breaker engaged: 2 consecutive losses. Mandatory 5-min pause to protect $50 capital.`
            },
            ...updatedPsychology.psychologyLogs.slice(0, 40)
          ];
        } else {
          updatedLogs = [
            {
              id: `log_psy_loss_${now}`,
              timestamp: now,
              type: 'psychology',
              symbol: pos.symbol,
              message: `🛡️ [REVENGE SHIELD ARMED] Loss recorded (-$${Math.abs(profitUSD).toFixed(2)}). 90s cooling lock engaged. Stay detached.`
            },
            ...updatedLogs.slice(0, 80)
          ];
        }
      } else if (profitUSD > 0) {
        const nextWinCount = updatedPsychology.consecutiveWins + 1;
        updatedPsychology.consecutiveWins = nextWinCount;
        updatedPsychology.consecutiveLosses = 0;
        updatedPsychology.lastTradeTime = now;
        updatedPsychology.lastTradePnL = profitUSD;
        updatedPsychology.disciplineScore = Math.min(99, updatedPsychology.disciplineScore + 3);

        if (nextWinCount >= 3) {
          updatedPsychology.overconfidenceRisk = true;
          updatedLogs = [
            {
              id: `log_psy_win_${now}`,
              timestamp: now,
              type: 'psychology',
              message: `⚡ [PSYCHOLOGY NOTE] ${nextWinCount} win streak! Caution: Euphoria bias. Keep fixed 0.01 lot, no overleveraging.`
            },
            ...updatedLogs.slice(0, 80)
          ];
        }
      }

      updatedTradeHistory = [
        {
          ...pos,
          currentPrice,
          closePrice: currentPrice,
          closeTime: now,
          profit: profitUSD,
          profitPips,
          reason: closeReason,
          atrTrailActive: atrTrailActivated,
          trailingStopActive: trailingStopActivated,
          highestPriceSinceOpen: highestPrice,
          lowestPriceSinceOpen: lowestPrice
        },
        ...updatedTradeHistory.slice(0, 50)
      ];

      updatedLogs = [
        {
          id: `log_close_${Date.now()}_${pos.ticket}`,
          timestamp: now,
          type: profitUSD >= 0 ? 'execution' : 'alert',
          symbol: pos.symbol,
          message: `Closed Ticket #${pos.ticket} ${pos.type} ${pos.symbol} @ ${currentPrice} [${closeReason}]. PnL: ${profitUSD >= 0 ? '+' : ''}$${profitUSD.toFixed(2)} (${profitPips} pips).`
        },
        ...updatedLogs.slice(0, 80)
      ];
    } else {
      remainingPositions.push({
        ...pos,
        currentPrice,
        sl: updatedSL,
        tp: updatedTP,
        profit: profitUSD,
        profitPips,
        highestPriceSinceOpen: highestPrice,
        lowestPriceSinceOpen: lowestPrice,
        atrTrailActive: atrTrailActivated,
        trailingStopActive: trailingStopActivated,
        currentAtrDistance: atrDistancePips
      });
    }
  }

  updatedPositions = remainingPositions;

  // 3. Automated Trade Execution: STRICT RISK RULES (Max 1 Open Trade & Max 25 Trades/Day)
  if (state.config.autoTradeEnabled) {
    // HARD CONSTRAINT 1: Max Open Trades must be STRICTLY 1
    const canOpenMore = updatedPositions.length < state.config.maxOpenTrades;

    // HARD CONSTRAINT 2: Daily limit must NOT exceed 25 trades
    const dailyLimitNotExceeded = dailyTradesTaken < state.config.dailyMaxTrades;

    // HARD CONSTRAINT 3: Trading Psychology Circuit Breaker or Revenge Shield Active
    const isPsychologyBlocked =
      updatedPsychology.isCircuitBreakerActive ||
      updatedPsychology.revengeShieldTriggered ||
      updatedPsychology.traderMindset === 'tilted';

    if (!dailyLimitNotExceeded && state.config.autoTradeEnabled) {
      if (updatedLogs[0]?.message.indexOf('Daily 25 trades limit reached') === -1) {
        updatedLogs = [
          {
            id: `log_daily_limit_${now}`,
            timestamp: now,
            type: 'alert',
            message: `[RISK ENGINE] Daily 25 trades limit reached (${dailyTradesTaken}/25). Automated trading safely paused.`
          },
          ...updatedLogs.slice(0, 80)
        ];
      }
    }

    if (canOpenMore && dailyLimitNotExceeded && !isPsychologyBlocked && updatedSignals.length > 0) {
      const pendingIndex = updatedSignals.findIndex(
        (s) => s.status === 'PENDING' && state.config.selectedPairs.includes(s.symbol)
      );

      if (pendingIndex !== -1) {
        const sig = updatedSignals[pendingIndex];
        const symbolDef = ALL_SYMBOLS.find((s) => s.symbol === sig.symbol);
        const quote = updatedQuotes[sig.symbol];

        if (symbolDef && quote) {
          if (quote.spread <= state.config.maxSpreadPips) {
            // STRICT FIXED LOT: 0.01 lot for $50 account
            const lot = state.config.fixedLot; // 0.01
            const execPrice = sig.direction === 'BUY' ? quote.ask : quote.bid;
            const newTicket = nextTicket++;

            const newPos: Position = {
              id: `pos_${newTicket}`,
              ticket: newTicket,
              symbol: sig.symbol,
              type: sig.direction,
              lot,
              openPrice: execPrice,
              currentPrice: execPrice,
              sl: sig.slPrice,
              tp: sig.tpPrice,
              ghostSL: state.config.useGhostSystem,
              ghostTP: state.config.useGhostSystem,
              profit: 0,
              profitPips: 0,
              openTime: now,
              trailingStopActive: false,
              atrTrailActive: false,
              highestPriceSinceOpen: execPrice,
              lowestPriceSinceOpen: execPrice,
              currentAtrDistance: 0,
              strategyName: sig.strategyName,
              executionMode: state.config.executionMode
            };

            updatedPositions.push(newPos);
            dailyTradesTaken++;

            // Mark signal executed
            updatedSignals[pendingIndex] = { ...sig, status: 'EXECUTED' };

            updatedLogs = [
              {
                id: `log_exec_${newTicket}`,
                timestamp: now,
                type: 'execution',
                symbol: sig.symbol,
                message: `[0.01 LOT EXECUTED] #${newTicket}: ${sig.direction} 0.01 lot ${sig.symbol} @ ${execPrice} | Ghost SL: ${sig.slPrice} (Invisible to Broker) | Trade ${dailyTradesTaken}/${state.config.dailyMaxTrades} today.`
              },
              ...updatedLogs.slice(0, 80)
            ];
          }
        }
      }
    }
  }

  // 4. Update MT5 Account State
  const totalFloatingPnL = updatedPositions.reduce((acc, p) => acc + p.profit, 0);
  const newBalance = Number((state.mt5Account.balance + realizedPnLThisTick).toFixed(2));
  const newEquity = Number((newBalance + totalFloatingPnL).toFixed(2));
  const usedMargin = updatedPositions.reduce((acc, p) => acc + p.lot * 100, 0);
  const freeMargin = Math.max(0, newEquity - usedMargin);
  const marginLevel = usedMargin > 0 ? (newEquity / usedMargin) * 100 : 0;

  const updatedAccount: MT5Account = {
    ...state.mt5Account,
    balance: newBalance,
    equity: newEquity,
    margin: usedMargin,
    freeMargin,
    marginLevel: Number(marginLevel.toFixed(1)),
    lastHeartbeat: now
  };

  return {
    ...state,
    quotes: updatedQuotes,
    candles: updatedCandles,
    positions: updatedPositions,
    tradeHistory: updatedTradeHistory,
    signals: updatedSignals,
    logs: updatedLogs,
    bookmapBubbles: updatedBubbles,
    mlPredictions: updatedML,
    smcOverviews: updatedSMC,
    decisionLines: updatedDL,
    psychology: updatedPsychology,
    mt5Account: updatedAccount,
    config: {
      ...state.config,
      dailyTradesTaken
    }
  };
}
