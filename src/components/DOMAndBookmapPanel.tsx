import React, { useEffect, useRef, useState } from 'react';
import { BookmapBubble, Candle, DecisionLineInfo, Position, SMCOverview, TickQuote } from '../types/trading';
import { ALL_SYMBOLS } from '../constants/symbols';
import { generateDOMRows } from '../services/liveMarketStream';
import { Layers, Flame, EyeOff, ShieldCheck, Zap } from 'lucide-react';

interface DOMAndBookmapPanelProps {
  symbol: string;
  quote?: TickQuote;
  candles: Candle[];
  positions: Position[];
  bubbles: BookmapBubble[];
  smc?: SMCOverview;
  decisionLine?: DecisionLineInfo;
  onManualTrade: (symbol: string, direction: 'BUY' | 'SELL') => void;
}

export const DOMAndBookmapPanel: React.FC<DOMAndBookmapPanelProps> = ({
  symbol,
  quote,
  candles,
  positions,
  bubbles,
  smc,
  decisionLine,
  onManualTrade
}) => {
  const [activeTab, setActiveTab] = useState<'dom' | 'bookmap'>('bookmap');
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const symbolDef = ALL_SYMBOLS.find((s) => s.symbol === symbol) || ALL_SYMBOLS[0];
  const digits = symbolDef.digits;
  const currentPrice = quote?.bid || symbolDef.basePrice;

  // Generate dynamic DOM rows
  const domRows = generateDOMRows(currentPrice, symbolDef.pipSize, digits, 7);

  // Active position on this symbol
  const activePos = positions.find((p) => p.symbol === symbol);

  // Render Bookmap Visualizer on Canvas
  useEffect(() => {
    if (activeTab !== 'bookmap') return;
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

    // Dark sleek Bookmap background
    ctx.fillStyle = '#05070c';
    ctx.fillRect(0, 0, width, height);

    if (candles.length < 5) return;

    const visibleCandles = candles.slice(-25);
    const minP = Math.min(...visibleCandles.map((c) => c.low)) - symbolDef.pipSize * 6;
    const maxP = Math.max(...visibleCandles.map((c) => c.high)) + symbolDef.pipSize * 6;
    const pRange = maxP - minP || 0.001;

    const getY = (price: number) => {
      return height - ((price - minP) / pRange) * (height - 30) - 15;
    };

    // Draw Bookmap Liquidity Heat Bands (resting limit orders)
    const heatBandsCount = 8;
    for (let i = 0; i < heatBandsCount; i++) {
      const bandPrice = minP + (pRange / heatBandsCount) * i;
      const y = getY(bandPrice);
      const intensity = ((Math.sin(i * 1.5 + Date.now() / 3000) + 1) / 2) * 0.18 + 0.04;

      const grad = ctx.createLinearGradient(0, y - 8, 0, y + 8);
      grad.addColorStop(0, 'rgba(234, 179, 8, 0)');
      grad.addColorStop(0.5, `rgba(234, 179, 8, ${intensity})`);
      grad.addColorStop(1, 'rgba(234, 179, 8, 0)');

      ctx.fillStyle = grad;
      ctx.fillRect(0, y - 8, width, 16);
    }

    // Draw SMC Liquidity Levels (BSL & SSL)
    if (smc) {
      smc.liquidityPools.forEach((pool) => {
        const y = getY(pool.price);
        ctx.setLineDash([4, 4]);
        ctx.strokeStyle = pool.label.includes('BSL') ? 'rgba(56, 189, 248, 0.7)' : 'rgba(244, 63, 94, 0.7)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.fillStyle = pool.label.includes('BSL') ? '#38bdf8' : '#f43f5e';
        ctx.font = '10px "JetBrains Mono", monospace';
        ctx.fillText(`${pool.label}: ${pool.price}`, 10, y - 4);
      });
    }

    // Draw Ghost Stop Loss Level if position exists
    if (activePos && activePos.ghostSL) {
      const ghostY = getY(activePos.sl);
      ctx.setLineDash([2, 2]);
      ctx.strokeStyle = '#c084fc'; // Purple Ghost line
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, ghostY);
      ctx.lineTo(width, ghostY);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = '#c084fc';
      ctx.font = 'bold 10px "JetBrains Mono", monospace';
      ctx.fillText(`👻 GHOST SL: ${activePos.sl.toFixed(digits)} (Broker Blind)`, width - 210, ghostY - 4);
    }

    // Draw Decision Line on Bookmap
    if (decisionLine) {
      const dlY = getY(decisionLine.price);
      ctx.setLineDash([5, 3]);
      ctx.strokeStyle = '#06b6d4';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(0, dlY);
      ctx.lineTo(width, dlY);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = '#06b6d4';
      ctx.font = 'bold 10px "JetBrains Mono", monospace';
      ctx.fillText(`🎯 DECISION LINE: ${decisionLine.price.toFixed(digits)} (${decisionLine.bias})`, 10, dlY - 4);
    }

    // Draw Price Trajectory Line
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    const stepX = width / visibleCandles.length;
    visibleCandles.forEach((c, idx) => {
      const x = idx * stepX;
      const y = getY(c.close);
      if (idx === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Draw Bookmap Order Flow Absorption Bubbles
    bubbles.slice(0, 15).forEach((bub, idx) => {
      const y = getY(bub.price);
      const x = width - 40 - idx * 18;
      const radius = Math.min(18, Math.max(4, bub.volume * 2.5));

      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fillStyle = bub.side === 'buy' ? 'rgba(16, 185, 129, 0.45)' : 'rgba(244, 63, 94, 0.45)';
      ctx.fill();
      ctx.strokeStyle = bub.side === 'buy' ? '#10b981' : '#f43f5e';
      ctx.lineWidth = 1.2;
      ctx.stroke();

      if (radius > 8) {
        ctx.fillStyle = '#ffffff';
        ctx.font = '9px "JetBrains Mono", monospace';
        ctx.textAlign = 'center';
        ctx.fillText(bub.volume.toString(), x, y + 3);
      }
    });

    // Current Price Cursor
    const currY = getY(currentPrice);
    ctx.strokeStyle = '#f8fafc';
    ctx.setLineDash([2, 2]);
    ctx.beginPath();
    ctx.moveTo(0, currY);
    ctx.lineTo(width, currY);
    ctx.stroke();
    ctx.setLineDash([]);
  }, [candles, currentPrice, activePos, bubbles, smc, activeTab, digits, symbolDef]);

  return (
    <div className="flex flex-col h-full bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
      {/* Top Bar */}
      <div className="flex items-center justify-between px-3.5 py-2.5 bg-slate-950/70 border-b border-slate-800 text-xs">
        <div className="flex items-center gap-2">
          {/* View Tabs */}
          <div className="flex items-center gap-1 p-0.5 bg-slate-900 rounded border border-slate-800">
            <button
              onClick={() => setActiveTab('bookmap')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded transition-colors ${
                activeTab === 'bookmap'
                  ? 'bg-slate-800 text-white font-medium'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Flame className="w-3.5 h-3.5 text-amber-400" />
              <span>Bookmap Heatmap</span>
            </button>
            <button
              onClick={() => setActiveTab('dom')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded transition-colors ${
                activeTab === 'dom'
                  ? 'bg-slate-800 text-white font-medium'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-sky-400" />
              <span>DOM Ladder</span>
            </button>
          </div>

          <span className="text-slate-400 font-mono text-[11px] hidden sm:inline">
            {symbol}
          </span>
        </div>

        {/* Decision Line Badge */}
        {decisionLine && (
          <div className="flex items-center gap-1.5 text-[11px] font-mono px-2 py-0.5 rounded border border-cyan-800/60 bg-cyan-950/40 text-cyan-300">
            <span className="font-bold">🎯 DL: {decisionLine.price.toFixed(digits)}</span>
            <span className={`text-[10px] px-1 rounded font-bold ${
              decisionLine.bias === 'BULL' ? 'text-emerald-400' : decisionLine.bias === 'BEAR' ? 'text-rose-400' : 'text-slate-400'
            }`}>
              ({decisionLine.bias})
            </span>
          </div>
        )}

        {/* Ghost Shield Indicator */}
        <div className="flex items-center gap-1.5 text-[11px] font-mono text-purple-400 bg-purple-950/40 px-2 py-0.5 rounded border border-purple-800/50">
          <EyeOff className="w-3 h-3 text-purple-400" />
          <span>Ghost System Active</span>
        </div>
      </div>

      {/* Main View */}
      <div className="flex-1 relative overflow-hidden">
        {activeTab === 'bookmap' ? (
          <div ref={containerRef} className="relative w-full h-full min-h-[260px]">
            <canvas ref={canvasRef} className="absolute inset-0 w-full h-full block" />
            {/* Overlay Info Legend */}
            <div className="absolute bottom-2 left-2 flex items-center gap-3 bg-slate-950/80 px-2.5 py-1 rounded text-[10px] font-mono text-slate-400 border border-slate-800">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500" /> Market Buy Bubble
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-rose-500" /> Market Sell Bubble
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 bg-amber-400/40" /> Limit Heat
              </span>
            </div>
          </div>
        ) : (
          /* DOM Ladder */
          <div className="flex flex-col h-full p-2 overflow-y-auto">
            <div className="grid grid-cols-4 text-[10px] font-mono uppercase text-slate-400 pb-1 border-b border-slate-800 px-2">
              <span>Bid Size</span>
              <span className="text-center col-span-2">Price</span>
              <span className="text-right">Ask Size</span>
            </div>

            <div className="flex-1 space-y-0.5 divide-y divide-slate-800/30 font-mono text-xs tabular-nums">
              {domRows.map((row, i) => {
                const maxVol = 200;
                const bidPct = (row.bidVolume / maxVol) * 100;
                const askPct = (row.askVolume / maxVol) * 100;

                const isGhostSL = activePos && Math.abs(activePos.sl - row.price) < symbolDef.pipSize;
                const isGhostTP = activePos && Math.abs(activePos.tp - row.price) < symbolDef.pipSize;
                const isDecisionLine = decisionLine && Math.abs(decisionLine.price - row.price) <= symbolDef.pipSize * 0.6;

                return (
                  <div
                    key={i}
                    className={`grid grid-cols-4 items-center px-2 py-1 relative ${
                      row.isCurrentPrice
                        ? 'bg-sky-950/60 font-bold border-y border-sky-500/50'
                        : isDecisionLine
                        ? 'bg-cyan-950/40 border-l-2 border-l-cyan-400 font-semibold'
                        : isGhostSL
                        ? 'bg-purple-950/40 border-l-2 border-l-purple-500'
                        : 'hover:bg-slate-800/40'
                    }`}
                  >
                    {/* Bid Volume Bar */}
                    <div className="relative text-left">
                      {row.bidVolume > 0 && (
                        <>
                          <div
                            className="absolute inset-y-0 left-0 bg-emerald-500/20 rounded"
                            style={{ width: `${bidPct}%` }}
                          />
                          <span className="relative z-10 text-emerald-400 text-[11px] font-semibold">
                            {row.bidVolume}
                          </span>
                        </>
                      )}
                    </div>

                    {/* Price with Ghost & Decision Line tags */}
                    <div className="col-span-2 text-center text-slate-200 flex items-center justify-center gap-1">
                      <span>{row.price.toFixed(digits)}</span>
                      {isDecisionLine && (
                        <span className="text-[9px] px-1 rounded bg-cyan-900/90 text-cyan-200 font-bold">
                          🎯 DL
                        </span>
                      )}
                      {isGhostSL && (
                        <span className="text-[9px] px-1 rounded bg-purple-900 text-purple-200">
                          Ghost SL
                        </span>
                      )}
                      {isGhostTP && (
                        <span className="text-[9px] px-1 rounded bg-emerald-900 text-emerald-200">
                          Ghost TP
                        </span>
                      )}
                    </div>

                    {/* Ask Volume Bar */}
                    <div className="relative text-right">
                      {row.askVolume > 0 && (
                        <>
                          <div
                            className="absolute inset-y-0 right-0 bg-rose-500/20 rounded"
                            style={{ width: `${askPct}%` }}
                          />
                          <span className="relative z-10 text-rose-400 text-[11px] font-semibold">
                            {row.askVolume}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Quick Micro Trade Row (0.01 lot) */}
            <div className="pt-2 border-t border-slate-800 flex items-center justify-between gap-2 px-1">
              <button
                onClick={() => onManualTrade(symbol, 'BUY')}
                className="flex-1 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors"
              >
                Buy 0.01 Lot
              </button>
              <button
                onClick={() => onManualTrade(symbol, 'SELL')}
                className="flex-1 py-1.5 rounded bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition-colors"
              >
                Sell 0.01 Lot
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
