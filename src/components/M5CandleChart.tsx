import React, { useEffect, useRef, useState } from 'react';
import { Candle, DecisionLineInfo, Position, TickQuote } from '../types/trading';
import { ALL_SYMBOLS } from '../constants/symbols';

interface M5CandleChartProps {
  symbol: string;
  candles: Candle[];
  quote?: TickQuote;
  positions: Position[];
  decisionLine?: DecisionLineInfo;
  timeframe: string;
  onTimeframeChange: (tf: string) => void;
}

export const M5CandleChart: React.FC<M5CandleChartProps> = ({
  symbol,
  candles,
  quote,
  positions,
  decisionLine,
  timeframe,
  onTimeframeChange
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [showDecisionLine, setShowDecisionLine] = useState(true);
  const [showEMA9, setShowEMA9] = useState(true);
  const [showEMA21, setShowEMA21] = useState(true);
  const [showEMA50, setShowEMA50] = useState(true);
  const [showSuperTrend, setShowSuperTrend] = useState(true);
  const [showRSI, setShowRSI] = useState(true);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const symbolDef = ALL_SYMBOLS.find((s) => s.symbol === symbol) || ALL_SYMBOLS[0];
  const digits = symbolDef.digits;

  // Render Canvas Chart
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !containerRef.current) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = containerRef.current.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const width = rect.width;
    const height = rect.height;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    // Layout configuration
    const paddingRight = 65; // Price axis
    const paddingBottom = 26; // Time axis
    const rsiHeight = showRSI ? 80 : 0;
    const rsiGap = showRSI ? 16 : 0;
    const mainChartHeight = height - paddingBottom - rsiHeight - rsiGap;

    // Clear background
    ctx.fillStyle = '#090d16';
    ctx.fillRect(0, 0, width, height);

    if (candles.length < 2) {
      ctx.fillStyle = '#64748b';
      ctx.font = '13px "Plus Jakarta Sans", sans-serif';
      ctx.fillText('Streaming live M5 market data...', 30, height / 2);
      return;
    }

    // Visible candle count
    const visibleCount = Math.min(candles.length, 45);
    const visibleCandles = candles.slice(-visibleCount);
    const candleWidth = (width - paddingRight - 20) / visibleCount;
    const barWidth = Math.max(3, candleWidth * 0.7);

    // Calculate High / Low price scale
    let minPrice = Infinity;
    let maxPrice = -Infinity;

    visibleCandles.forEach((c) => {
      if (c.low < minPrice) minPrice = c.low;
      if (c.high > maxPrice) maxPrice = c.high;
      if (showEMA9 && c.ema9) {
        if (c.ema9 < minPrice) minPrice = c.ema9;
        if (c.ema9 > maxPrice) maxPrice = c.ema9;
      }
      if (showEMA21 && c.ema21) {
        if (c.ema21 < minPrice) minPrice = c.ema21;
        if (c.ema21 > maxPrice) maxPrice = c.ema21;
      }
      if (showEMA50 && c.ema50) {
        if (c.ema50 < minPrice) minPrice = c.ema50;
        if (c.ema50 > maxPrice) maxPrice = c.ema50;
      }
    });

    if (showDecisionLine && decisionLine) {
      if (decisionLine.price < minPrice) minPrice = decisionLine.price;
      if (decisionLine.price > maxPrice) maxPrice = decisionLine.price;
    }

    const priceBuffer = (maxPrice - minPrice) * 0.08 || 0.001;
    minPrice -= priceBuffer;
    maxPrice += priceBuffer;
    const priceRange = maxPrice - minPrice;

    const getY = (val: number) => {
      return mainChartHeight - ((val - minPrice) / priceRange) * (mainChartHeight - 20) - 10;
    };

    // Draw Price Grid Lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
    ctx.lineWidth = 1;
    const gridLines = 5;
    for (let i = 0; i <= gridLines; i++) {
      const p = minPrice + (priceRange / gridLines) * i;
      const y = getY(p);
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width - paddingRight, y);
      ctx.stroke();

      // Right axis labels
      ctx.fillStyle = '#64748b';
      ctx.font = '11px "JetBrains Mono", monospace';
      ctx.textAlign = 'left';
      ctx.fillText(p.toFixed(digits), width - paddingRight + 8, y + 4);
    }

    // Draw Candlesticks
    visibleCandles.forEach((c, idx) => {
      const x = 10 + idx * candleWidth + candleWidth / 2;
      const isBullish = c.close >= c.open;
      const color = isBullish ? '#10b981' : '#f43f5e';

      const openY = getY(c.open);
      const closeY = getY(c.close);
      const highY = getY(c.high);
      const lowY = getY(c.low);

      // Wick
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(x, highY);
      ctx.lineTo(x, lowY);
      ctx.stroke();

      // Body
      ctx.fillStyle = color;
      const bodyTop = Math.min(openY, closeY);
      const bodyHeight = Math.max(2, Math.abs(closeY - openY));
      ctx.fillRect(x - barWidth / 2, bodyTop, barWidth, bodyHeight);

      // Timestamp at intervals
      if (idx % 6 === 0) {
        ctx.fillStyle = '#475569';
        ctx.font = '10px "JetBrains Mono", monospace';
        ctx.textAlign = 'center';
        const date = new Date(c.time);
        const timeStr = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
        ctx.fillText(timeStr, x, mainChartHeight + 16);
      }
    });

    // Draw Indicator Lines
    const drawIndicatorLine = (points: (number | undefined)[], color: string, widthPx = 1.5) => {
      ctx.strokeStyle = color;
      ctx.lineWidth = widthPx;
      ctx.beginPath();
      let started = false;

      points.forEach((val, idx) => {
        if (val === undefined) return;
        const x = 10 + idx * candleWidth + candleWidth / 2;
        const y = getY(val);
        if (!started) {
          ctx.moveTo(x, y);
          started = true;
        } else {
          ctx.lineTo(x, y);
        }
      });
      ctx.stroke();
    };

    if (showEMA9) drawIndicatorLine(visibleCandles.map((c) => c.ema9), '#06b6d4', 1.4);
    if (showEMA21) drawIndicatorLine(visibleCandles.map((c) => c.ema21), '#f97316', 1.4);
    if (showEMA50) drawIndicatorLine(visibleCandles.map((c) => c.ema50), '#a855f7', 1.6);

    // SuperTrend line
    if (showSuperTrend) {
      visibleCandles.forEach((c, idx) => {
        if (!c.supertrend || idx === 0) return;
        const prevC = visibleCandles[idx - 1];
        if (!prevC.supertrend) return;

        const x1 = 10 + (idx - 1) * candleWidth + candleWidth / 2;
        const y1 = getY(prevC.supertrend.value);
        const x2 = 10 + idx * candleWidth + candleWidth / 2;
        const y2 = getY(c.supertrend.value);

        ctx.strokeStyle = c.supertrend.trend === 'up' ? '#10b981' : '#f43f5e';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      });
    }

    // Draw Active Trade Entry Markers and Dynamic SL on Chart
    const activePositions = positions.filter((p) => p.symbol === symbol);
    activePositions.forEach((pos) => {
      const y = getY(pos.openPrice);
      // Entry line across chart
      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = pos.type === 'BUY' ? '#10b981' : '#f43f5e';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width - paddingRight, y);
      ctx.stroke();
      ctx.setLineDash([]);

      // Label
      ctx.fillStyle = pos.type === 'BUY' ? '#10b981' : '#f43f5e';
      ctx.font = '10px "JetBrains Mono", monospace';
      ctx.fillText(
        `${pos.type} #${pos.ticket} @ ${pos.openPrice.toFixed(digits)}`,
        15,
        y - 5
      );

      // Dynamic Stop Loss Line (Color-coded if ATR Auto-Trail is active)
      if (pos.sl && pos.sl > 0) {
        const slY = getY(pos.sl);
        ctx.setLineDash([3, 3]);
        ctx.strokeStyle = pos.atrTrailActive ? '#f59e0b' : '#f43f5e';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(0, slY);
        ctx.lineTo(width - paddingRight, slY);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.fillStyle = pos.atrTrailActive ? '#f59e0b' : '#f43f5e';
        ctx.font = 'bold 9px "JetBrains Mono", monospace';
        ctx.fillText(
          `${pos.atrTrailActive ? '⚡ ATR-TRAIL SL' : 'SL'}: ${pos.sl.toFixed(digits)}`,
          width - paddingRight - 150,
          slY - 4
        );
      }
    });

    // Current Price Line
    if (quote) {
      const currentY = getY(quote.bid);
      ctx.setLineDash([2, 2]);
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, currentY);
      ctx.lineTo(width - paddingRight, currentY);
      ctx.stroke();
      ctx.setLineDash([]);

      // Right pill for current price
      ctx.fillStyle = '#0284c7';
      ctx.fillRect(width - paddingRight, currentY - 9, paddingRight, 18);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 10px "JetBrains Mono", monospace';
      ctx.textAlign = 'left';
      ctx.fillText(quote.bid.toFixed(digits), width - paddingRight + 6, currentY + 4);
    }

    // Draw Institutional Decision Line (Bull/Bear Equilibrium Boundary)
    if (showDecisionLine && decisionLine) {
      const dlY = getY(decisionLine.price);

      // Bull Territory Shading (above decision line to top of main chart)
      if (dlY > 0 && dlY <= mainChartHeight) {
        ctx.fillStyle = 'rgba(16, 185, 129, 0.035)';
        ctx.fillRect(0, 0, width - paddingRight, dlY);

        ctx.fillStyle = 'rgba(16, 185, 129, 0.3)';
        ctx.font = 'bold 9px "JetBrains Mono", monospace';
        ctx.textAlign = 'right';
        ctx.fillText('▲ BULL TERRITORY (Longs Favored)', width - paddingRight - 15, Math.max(16, dlY - 8));
      }

      // Bear Territory Shading (below decision line to bottom of main chart)
      if (dlY >= 0 && dlY < mainChartHeight) {
        ctx.fillStyle = 'rgba(244, 63, 94, 0.035)';
        ctx.fillRect(0, dlY, width - paddingRight, mainChartHeight - dlY);

        ctx.fillStyle = 'rgba(244, 63, 94, 0.3)';
        ctx.font = 'bold 9px "JetBrains Mono", monospace';
        ctx.textAlign = 'right';
        ctx.fillText('▼ BEAR TERRITORY (Shorts Favored)', width - paddingRight - 15, Math.min(mainChartHeight - 8, dlY + 16));
      }

      // Decision Line Glow & Line
      ctx.save();
      ctx.shadowColor = '#06b6d4';
      ctx.shadowBlur = 8;
      ctx.strokeStyle = '#06b6d4';
      ctx.lineWidth = 2.2;
      ctx.setLineDash([8, 4]);
      ctx.beginPath();
      ctx.moveTo(0, dlY);
      ctx.lineTo(width - paddingRight, dlY);
      ctx.stroke();
      ctx.restore();

      // Left Tag: Decision Line Info
      ctx.fillStyle = '#06b6d4';
      ctx.font = 'bold 10px "JetBrains Mono", monospace';
      ctx.textAlign = 'left';
      ctx.fillText(
        `🎯 DECISION LINE: ${decisionLine.price.toFixed(digits)} [${decisionLine.bias} BIAS ${decisionLine.distancePips >= 0 ? '+' : ''}${decisionLine.distancePips}p]`,
        15,
        Math.max(16, dlY - 6)
      );

      // Right axis marker pill for Decision Line
      ctx.fillStyle = '#0e7490';
      ctx.fillRect(width - paddingRight, dlY - 9, paddingRight, 18);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 10px "JetBrains Mono", monospace';
      ctx.textAlign = 'left';
      ctx.fillText(`🎯 ${decisionLine.price.toFixed(digits)}`, width - paddingRight + 4, dlY + 4);
    }

    // Sub-Chart: RSI 14
    if (showRSI) {
      const rsiTop = mainChartHeight + rsiGap;

      // RSI Container border
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.lineWidth = 1;
      ctx.strokeRect(0, rsiTop, width - paddingRight, rsiHeight);

      // Overbought 70 and Oversold 30 reference lines
      const getRsiY = (rsiVal: number) => {
        return rsiTop + rsiHeight - (rsiVal / 100) * rsiHeight;
      };

      ctx.setLineDash([3, 3]);
      ctx.strokeStyle = 'rgba(244, 63, 94, 0.3)';
      ctx.beginPath();
      ctx.moveTo(0, getRsiY(70));
      ctx.lineTo(width - paddingRight, getRsiY(70));
      ctx.stroke();

      ctx.strokeStyle = 'rgba(16, 185, 129, 0.3)';
      ctx.beginPath();
      ctx.moveTo(0, getRsiY(30));
      ctx.lineTo(width - paddingRight, getRsiY(30));
      ctx.stroke();
      ctx.setLineDash([]);

      // RSI Label
      ctx.fillStyle = '#94a3b8';
      ctx.font = '10px "JetBrains Mono", monospace';
      ctx.textAlign = 'left';
      const lastRsi = visibleCandles[visibleCandles.length - 1]?.rsi ?? 50;
      ctx.fillText(`RSI(14): ${lastRsi.toFixed(1)}`, 10, rsiTop + 14);

      // RSI Curve
      ctx.strokeStyle = '#eab308';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      let startedRsi = false;
      visibleCandles.forEach((c, idx) => {
        const val = c.rsi;
        if (val === undefined) return;
        const x = 10 + idx * candleWidth + candleWidth / 2;
        const y = getRsiY(val);
        if (!startedRsi) {
          ctx.moveTo(x, y);
          startedRsi = true;
        } else {
          ctx.lineTo(x, y);
        }
      });
      ctx.stroke();
    }
  }, [candles, quote, positions, showEMA9, showEMA21, showEMA50, showSuperTrend, showRSI, digits]);

  const activeCandle =
    hoverIndex !== null && hoverIndex < candles.length
      ? candles[hoverIndex]
      : candles[candles.length - 1];

  return (
    <div className="flex flex-col h-full bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
      {/* Chart Top Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 bg-slate-950/70 border-b border-slate-800/80 text-xs">
        {/* Symbol & Price Summary */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 font-bold text-sm text-white">
            <span>{symbol}</span>
            <span className="text-slate-400 font-normal text-xs">{symbolDef.name}</span>
          </div>
          {quote && (
            <div className="flex items-center gap-2 font-mono tabular-nums">
              <span className="text-emerald-400 font-semibold">{quote.bid.toFixed(digits)}</span>
              <span className="text-slate-500">/</span>
              <span className="text-slate-300">{quote.ask.toFixed(digits)}</span>
              <span className="text-slate-400 text-[11px]">
                Spr: <strong className="text-slate-200">{quote.spread.toFixed(1)}</strong>
              </span>
              <span
                className={`text-[11px] font-medium ${
                  quote.change24h >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {quote.change24h >= 0 ? '+' : ''}
                {quote.change24h.toFixed(2)}%
              </span>
            </div>
          )}
        </div>

        {/* Timeframe Selector */}
        <div className="flex items-center gap-1 p-0.5 bg-slate-900 border border-slate-800 rounded">
          {['M1', 'M5', 'M15', 'H1', 'H4'].map((tf) => (
            <button
              key={tf}
              onClick={() => onTimeframeChange(tf)}
              className={`px-2.5 py-1 text-[11px] font-medium rounded transition-colors ${
                timeframe === tf
                  ? 'bg-sky-500 text-white font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {tf}
            </button>
          ))}
        </div>

        {/* Indicators Toggle Buttons */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={() => setShowDecisionLine(!showDecisionLine)}
            className={`flex items-center gap-1 px-2.5 py-0.5 text-[11px] rounded transition-colors font-mono font-bold ${
              showDecisionLine
                ? 'bg-cyan-950 text-cyan-300 border border-cyan-500 shadow-sm'
                : 'text-slate-500 hover:text-slate-300 border border-transparent'
            }`}
          >
            🎯 Decision Line
          </button>
          <button
            onClick={() => setShowEMA9(!showEMA9)}
            className={`px-2 py-0.5 text-[11px] rounded transition-colors font-mono ${
              showEMA9
                ? 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            EMA 9
          </button>
          <button
            onClick={() => setShowEMA21(!showEMA21)}
            className={`px-2 py-0.5 text-[11px] rounded transition-colors font-mono ${
              showEMA21
                ? 'bg-amber-950 text-amber-300 border border-amber-800'
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            EMA 21
          </button>
          <button
            onClick={() => setShowEMA50(!showEMA50)}
            className={`px-2 py-0.5 text-[11px] rounded transition-colors font-mono ${
              showEMA50
                ? 'bg-purple-950 text-purple-300 border border-purple-800'
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            EMA 50
          </button>
          <button
            onClick={() => setShowSuperTrend(!showSuperTrend)}
            className={`px-2 py-0.5 text-[11px] rounded transition-colors font-mono ${
              showSuperTrend
                ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            SuperTrend
          </button>
          <button
            onClick={() => setShowRSI(!showRSI)}
            className={`px-2 py-0.5 text-[11px] rounded transition-colors font-mono ${
              showRSI
                ? 'bg-yellow-950 text-yellow-300 border border-yellow-800'
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            RSI
          </button>
        </div>
      </div>

      {/* Candle Details Ribbon with Decision Line breakdown */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-1.5 bg-slate-950/40 text-[11px] text-slate-400 font-mono border-b border-slate-800/40 tabular-nums">
        {activeCandle && (
          <div className="flex items-center gap-3">
            <span>O: <strong className="text-slate-200">{activeCandle.open.toFixed(digits)}</strong></span>
            <span>H: <strong className="text-slate-200">{activeCandle.high.toFixed(digits)}</strong></span>
            <span>L: <strong className="text-slate-200">{activeCandle.low.toFixed(digits)}</strong></span>
            <span>C: <strong className="text-slate-200">{activeCandle.close.toFixed(digits)}</strong></span>
            {activeCandle.ema9 && (
              <span className="text-cyan-400 hidden sm:inline">EMA9: {activeCandle.ema9.toFixed(digits)}</span>
            )}
            {activeCandle.ema21 && (
              <span className="text-amber-400 hidden sm:inline">EMA21: {activeCandle.ema21.toFixed(digits)}</span>
            )}
            {activeCandle.rsi && (
              <span className="text-yellow-400 hidden md:inline">RSI: {activeCandle.rsi.toFixed(1)}</span>
            )}
          </div>
        )}

        {decisionLine && showDecisionLine && (
          <div className="flex items-center gap-2 px-2.5 py-0.5 rounded bg-cyan-950/60 border border-cyan-800/80 text-[11px]">
            <span className="text-cyan-300 font-bold flex items-center gap-1">
              <span>🎯 Decision Line:</span>
              <strong className="text-white">{decisionLine.price.toFixed(digits)}</strong>
            </span>
            <span
              className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                decisionLine.bias === 'BULL'
                  ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                  : decisionLine.bias === 'BEAR'
                  ? 'bg-rose-950 text-rose-400 border border-rose-800'
                  : 'bg-slate-800 text-slate-300'
              }`}
            >
              {decisionLine.bias} ({decisionLine.distancePips >= 0 ? '+' : ''}{decisionLine.distancePips}p)
            </span>
            <span className="text-slate-400 text-[10px] hidden xl:inline">
              Target: {decisionLine.breakoutTarget}
            </span>
          </div>
        )}
      </div>

      {/* Canvas Chart Area */}
      <div ref={containerRef} className="relative flex-1 w-full min-h-[380px]">
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full block cursor-crosshair" />
      </div>
    </div>
  );
};
