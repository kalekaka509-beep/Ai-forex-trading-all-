import { Candle, DecisionLineInfo, StrategyType, TradeSignal } from '../types/trading';
import { ALL_SYMBOLS } from '../constants/symbols';

/**
 * Technical Indicator Calculations for M5 Automated Trading
 */

export function calculateEMA(prices: number[], period: number): number[] {
  if (prices.length === 0) return [];
  const k = 2 / (period + 1);
  const ema: number[] = [prices[0]];
  for (let i = 1; i < prices.length; i++) {
    ema.push(prices[i] * k + ema[i - 1] * (1 - k));
  }
  return ema;
}

export function calculateRSI(prices: number[], period = 14): number[] {
  if (prices.length <= period) return new Array(prices.length).fill(50);
  const rsi: number[] = new Array(prices.length).fill(50);
  let gains = 0;
  let losses = 0;

  for (let i = 1; i <= period; i++) {
    const diff = prices[i] - prices[i - 1];
    if (diff >= 0) gains += diff;
    else losses -= diff;
  }

  let avgGain = gains / period;
  let avgLoss = losses / period;
  rsi[period] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);

  for (let i = period + 1; i < prices.length; i++) {
    const diff = prices[i] - prices[i - 1];
    const gain = diff > 0 ? diff : 0;
    const loss = diff < 0 ? -diff : 0;

    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;

    if (avgLoss === 0) {
      rsi[i] = 100;
    } else {
      const rs = avgGain / avgLoss;
      rsi[i] = Math.max(0, Math.min(100, 100 - 100 / (1 + rs)));
    }
  }

  return rsi;
}

export function calculateATR(candles: Candle[], period = 14): number[] {
  if (candles.length < 2) return candles.map(() => 0.001);
  const tr: number[] = [candles[0].high - candles[0].low];

  for (let i = 1; i < candles.length; i++) {
    const hl = candles[i].high - candles[i].low;
    const hc = Math.abs(candles[i].high - candles[i - 1].close);
    const lc = Math.abs(candles[i].low - candles[i - 1].close);
    tr.push(Math.max(hl, hc, lc));
  }

  return calculateEMA(tr, period);
}

export function calculateSuperTrend(
  candles: Candle[],
  period = 10,
  multiplier = 3.0
): { trend: 'up' | 'down'; value: number }[] {
  const atrs = calculateATR(candles, period);
  const results: { trend: 'up' | 'down'; value: number }[] = [];

  let prevUpper = 0;
  let prevLower = 0;
  let prevTrend: 'up' | 'down' = 'up';

  for (let i = 0; i < candles.length; i++) {
    const c = candles[i];
    const atr = atrs[i] || 0.001;
    const hl2 = (c.high + c.low) / 2;
    let basicUpper = hl2 + multiplier * atr;
    let basicLower = hl2 - multiplier * atr;

    if (i === 0) {
      prevUpper = basicUpper;
      prevLower = basicLower;
      results.push({ trend: 'up', value: basicLower });
      continue;
    }

    const prevClose = candles[i - 1].close;
    let finalUpper = basicUpper < prevUpper || prevClose > prevUpper ? basicUpper : prevUpper;
    let finalLower = basicLower > prevLower || prevClose < prevLower ? basicLower : prevLower;

    let currentTrend: 'up' | 'down' = prevTrend;
    if (prevTrend === 'up' && c.close < finalLower) {
      currentTrend = 'down';
    } else if (prevTrend === 'down' && c.close > finalUpper) {
      currentTrend = 'up';
    }

    prevTrend = currentTrend;
    prevUpper = finalUpper;
    prevLower = finalLower;

    results.push({
      trend: currentTrend,
      value: currentTrend === 'up' ? finalLower : finalUpper
    });
  }

  return results;
}

export function enrichCandlesWithIndicators(candles: Candle[]): Candle[] {
  if (candles.length < 5) return candles;
  const closePrices = candles.map((c) => c.close);
  const ema9 = calculateEMA(closePrices, 9);
  const ema21 = calculateEMA(closePrices, 21);
  const ema50 = calculateEMA(closePrices, 50);
  const rsi = calculateRSI(closePrices, 14);
  const atr = calculateATR(candles, 14);
  const supertrend = calculateSuperTrend(candles, 10, 3.0);

  return candles.map((c, i) => ({
    ...c,
    ema9: ema9[i],
    ema21: ema21[i],
    ema50: ema50[i],
    rsi: rsi[i],
    atr: atr[i],
    supertrend: supertrend[i]
  }));
}

/**
 * Evaluates real-time M5 Algorithmic Trade Signals
 */
export function analyzeM5Signal(
  symbol: string,
  candles: Candle[],
  strategy: StrategyType,
  slPips: number,
  tpPips: number
): TradeSignal | null {
  if (candles.length < 25) return null;

  const symbolDef = ALL_SYMBOLS.find((s) => s.symbol === symbol);
  if (!symbolDef) return null;

  const current = candles[candles.length - 1];
  const prev = candles[candles.length - 2];
  const prev2 = candles[candles.length - 3];

  const pip = symbolDef.pipSize;
  const currentPrice = current.close;

  let direction: 'BUY' | 'SELL' | null = null;
  let score = 50;
  const reasons: string[] = [];
  let strategyName = 'M5 Algorithm';

  if (strategy === 'ema_ribbon') {
    strategyName = 'M5 EMA Ribbon Scalper (9/21/50)';
    const ema9 = current.ema9 ?? currentPrice;
    const ema21 = current.ema21 ?? currentPrice;
    const ema50 = current.ema50 ?? currentPrice;
    const rsi = current.rsi ?? 50;

    // Bullish Ribbon setup: EMA 9 > EMA 21 > EMA 50
    const bullishRibbon = ema9 > ema21 && ema21 > ema50;
    // Fast crossover recently or bounce
    const freshBullishCross = (prev.ema9 ?? 0) <= (prev.ema21 ?? 0) && ema9 > ema21;
    const bullishPullback = current.low <= ema21 && current.close > ema9;

    // Bearish Ribbon setup: EMA 9 < EMA 21 < EMA 50
    const bearishRibbon = ema9 < ema21 && ema21 < ema50;
    const freshBearishCross = (prev.ema9 ?? 0) >= (prev.ema21 ?? 0) && ema9 < ema21;
    const bearishPullback = current.high >= ema21 && current.close < ema9;

    if (bullishRibbon && (freshBullishCross || bullishPullback) && rsi > 46 && rsi < 68) {
      direction = 'BUY';
      score = 75 + (freshBullishCross ? 15 : 8) + (rsi > 50 && rsi < 60 ? 8 : 0);
      reasons.push('EMA 9/21/50 Bullish Stacked Alignment');
      if (freshBullishCross) reasons.push('Fresh EMA 9/21 Golden Cross');
      if (bullishPullback) reasons.push('M5 Dynamic Support Bounce on EMA 21');
      reasons.push(`RSI Momentum (${rsi.toFixed(1)}) healthy`);
    } else if (bearishRibbon && (freshBearishCross || bearishPullback) && rsi < 54 && rsi > 32) {
      direction = 'SELL';
      score = 75 + (freshBearishCross ? 15 : 8) + (rsi < 50 && rsi > 40 ? 8 : 0);
      reasons.push('EMA 9/21/50 Bearish Stacked Alignment');
      if (freshBearishCross) reasons.push('Fresh EMA 9/21 Death Cross');
      if (bearishPullback) reasons.push('M5 Dynamic Resistance Rejection on EMA 21');
      reasons.push(`RSI Momentum (${rsi.toFixed(1)}) bearish`);
    }
  } else if (strategy === 'smc_fvg') {
    strategyName = 'M5 Smart Money Concepts / FVG';
    // 3-bar Fair Value Gap detection
    // Bullish FVG: Candle 1 High < Candle 3 Low (Gap between high of candle -3 and low of current candle)
    const isBullishFVG = prev2.high < current.low;
    const displacementBull = prev.close > prev.open && (prev.high - prev.low) > (current.atr ?? 0.001) * 1.4;

    // Bearish FVG: Candle 1 Low > Candle 3 High
    const isBearishFVG = prev2.low > current.high;
    const displacementBear = prev.close < prev.open && (prev.high - prev.low) > (current.atr ?? 0.001) * 1.4;

    if (isBullishFVG && displacementBull && current.close > prev.close) {
      direction = 'BUY';
      score = 88;
      reasons.push('M5 Bullish Fair Value Gap (FVG) Formed');
      reasons.push('Smart Money Institutional Displacement Candle');
      reasons.push('Liquidity Sweep Confirmed');
    } else if (isBearishFVG && displacementBear && current.close < prev.close) {
      direction = 'SELL';
      score = 87;
      reasons.push('M5 Bearish Fair Value Gap (FVG) Formed');
      reasons.push('Institutional Sell-side Displacement');
      reasons.push('Buy-side Liquidity Purged');
    }
  } else if (strategy === 'supertrend') {
    strategyName = 'M5 SuperTrend & ATR Breakout';
    const stCurrent = current.supertrend?.trend;
    const stPrev = prev.supertrend?.trend;

    if (stPrev === 'down' && stCurrent === 'up') {
      direction = 'BUY';
      score = 91;
      reasons.push('M5 SuperTrend Turned Bullish');
      reasons.push(`ATR Volatility Expansion (${((current.atr ?? 0) / pip).toFixed(1)} pips)`);
      reasons.push('Close above upper volatility envelope');
    } else if (stPrev === 'up' && stCurrent === 'down') {
      direction = 'SELL';
      score = 90;
      reasons.push('M5 SuperTrend Turned Bearish');
      reasons.push(`ATR Breakdown (${((current.atr ?? 0) / pip).toFixed(1)} pips)`);
      reasons.push('Close below lower volatility envelope');
    }
  } else if (strategy === 'bollinger') {
    strategyName = 'M5 Bollinger Mean Reversion';
    const closeSlice = candles.slice(-20).map((c) => c.close);
    const mean = closeSlice.reduce((a, b) => a + b, 0) / 20;
    const variance = closeSlice.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / 20;
    const stdDev = Math.sqrt(variance);
    const lowerBand = mean - 2 * stdDev;
    const upperBand = mean + 2 * stdDev;
    const rsi = current.rsi ?? 50;

    if (current.low <= lowerBand && current.close > lowerBand && rsi < 35) {
      direction = 'BUY';
      score = 82;
      reasons.push('M5 Lower Bollinger Band Pierced & Rejected');
      reasons.push(`RSI Oversold Extreme (${rsi.toFixed(1)})`);
      reasons.push('Targeting Middle Mean Band');
    } else if (current.high >= upperBand && current.close < upperBand && rsi > 65) {
      direction = 'SELL';
      score = 83;
      reasons.push('M5 Upper Bollinger Band Rejected');
      reasons.push(`RSI Overbought Extreme (${rsi.toFixed(1)})`);
      reasons.push('Mean Reversion Short Setup');
    }
  }

  if (!direction) return null;

  // Calculate Decision Line confluence
  const dl = calculateDecisionLine(symbol, candles, currentPrice, pip, symbolDef.digits);
  if (direction === 'BUY') {
    if (dl.bias === 'BULL') {
      score += 7;
      reasons.push(`Bullish Confluence: Price is +${dl.distancePips}p above M5 Decision Line (${dl.price})`);
    } else if (dl.bias === 'BEAR') {
      score -= 10; // Penalize buying below decision line (fighting institutional bias)
      reasons.push(`Caution: Price is below M5 Decision Line (${dl.price})`);
    }
  } else if (direction === 'SELL') {
    if (dl.bias === 'BEAR') {
      score += 7;
      reasons.push(`Bearish Confluence: Price is ${dl.distancePips}p below M5 Decision Line (${dl.price})`);
    } else if (dl.bias === 'BULL') {
      score -= 10; // Penalize selling above decision line
      reasons.push(`Caution: Price is above M5 Decision Line (${dl.price})`);
    }
  }

  // Calculate strict SL & TP prices based on pip settings or ATR
  const dynamicSlPips = Math.max(slPips, Math.round(((current.atr ?? pip * 10) / pip) * 1.2));
  const dynamicTpPips = Math.max(tpPips, Math.round(dynamicSlPips * 1.8));

  const slPrice =
    direction === 'BUY'
      ? Number((currentPrice - dynamicSlPips * pip).toFixed(symbolDef.digits))
      : Number((currentPrice + dynamicSlPips * pip).toFixed(symbolDef.digits));

  const tpPrice =
    direction === 'BUY'
      ? Number((currentPrice + dynamicTpPips * pip).toFixed(symbolDef.digits))
      : Number((currentPrice - dynamicTpPips * pip).toFixed(symbolDef.digits));

  return {
    id: `sig_${symbol}_${Date.now()}`,
    symbol,
    direction,
    timeframe: 'M5',
    strategy,
    strategyName,
    score: Math.min(99, Math.max(40, score)),
    mlConfidence: Math.min(99, Math.max(40, score)),
    price: currentPrice,
    slPrice,
    tpPrice,
    ghostSL: true,
    reasons,
    timestamp: Date.now(),
    status: 'PENDING'
  };
}

/**
 * Calculates Institutional M5 Decision Line (Equilibrium Boundary)
 * Separates Bull Territory from Bear Territory based on Volume-Weighted Equilibrium,
 * Session Extremes, and M5 structural displacement.
 */
export function calculateDecisionLine(
  symbol: string,
  candles: Candle[],
  currentPrice: number,
  pipSize: number,
  digits: number
): DecisionLineInfo {
  if (candles.length < 5) {
    return {
      symbol,
      price: currentPrice,
      bias: 'NEUTRAL',
      distancePips: 0,
      status: 'Equilibrium Zone',
      sessionHigh: currentPrice,
      sessionLow: currentPrice,
      equilibriumPrice: currentPrice,
      strengthPercent: 50,
      breakoutTarget: currentPrice + pipSize * 20,
      inversionLevel: currentPrice - pipSize * 20
    };
  }

  const lookback = candles.slice(-30);
  const sessionHigh = Math.max(...lookback.map((c) => c.high));
  const sessionLow = Math.min(...lookback.map((c) => c.low));

  // Volume-weighted midpoint calculation (VWAP proxy)
  let totalVol = 0;
  let weightedSum = 0;
  lookback.forEach((c) => {
    const typicalPrice = (c.high + c.low + c.close) / 3;
    const vol = c.volume || 1;
    totalVol += vol;
    weightedSum += typicalPrice * vol;
  });

  const vwapEquilibrium = totalVol > 0 ? weightedSum / totalVol : (sessionHigh + sessionLow) / 2;
  const lastCandle = candles[candles.length - 1];
  const ema21 = lastCandle.ema21 ?? currentPrice;

  // Decision line blend: (50% VWAP Midpoint + 30% Session Mid + 20% EMA21)
  const rawDecisionLine = (vwapEquilibrium * 0.5) + (((sessionHigh + sessionLow) / 2) * 0.3) + (ema21 * 0.2);
  const decisionLinePrice = Number(rawDecisionLine.toFixed(digits));

  const distancePips = Number(((currentPrice - decisionLinePrice) / pipSize).toFixed(1));
  const atr = lastCandle.atr || pipSize * 12;
  const atrPips = Math.max(1, atr / pipSize);

  let bias: 'BULL' | 'BEAR' | 'NEUTRAL' = 'NEUTRAL';
  let status: 'Bull Expansion' | 'Bear Expansion' | 'Testing Boundary' | 'Equilibrium Zone' = 'Equilibrium Zone';
  let strengthPercent = 50;

  if (distancePips > 0.6) {
    bias = 'BULL';
    status = distancePips >= atrPips * 0.7 ? 'Bull Expansion' : 'Testing Boundary';
    strengthPercent = Math.min(98, Math.round(55 + (distancePips / atrPips) * 30));
  } else if (distancePips < -0.6) {
    bias = 'BEAR';
    status = Math.abs(distancePips) >= atrPips * 0.7 ? 'Bear Expansion' : 'Testing Boundary';
    strengthPercent = Math.min(98, Math.round(55 + (Math.abs(distancePips) / atrPips) * 30));
  } else {
    bias = 'NEUTRAL';
    status = 'Equilibrium Zone';
    strengthPercent = 50;
  }

  const breakoutTarget = Number((decisionLinePrice + atr * 1.5).toFixed(digits));
  const inversionLevel = Number((decisionLinePrice - atr * 1.5).toFixed(digits));

  return {
    symbol,
    price: decisionLinePrice,
    bias,
    distancePips,
    status,
    sessionHigh,
    sessionLow,
    equilibriumPrice: Number(vwapEquilibrium.toFixed(digits)),
    strengthPercent,
    breakoutTarget,
    inversionLevel
  };
}
