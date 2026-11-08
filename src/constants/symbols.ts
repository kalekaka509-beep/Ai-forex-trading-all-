import { SymbolInfo, MarketCategory } from '../types/trading';

export const ALL_SYMBOLS: SymbolInfo[] = [
  // Metals & Commodities
  {
    symbol: 'XAUUSD',
    name: 'Gold / US Dollar (Real Spot)',
    category: 'metal_commodity',
    digits: 2,
    pipSize: 0.10,
    minLot: 0.01,
    maxLot: 20.0,
    lotStep: 0.01,
    spreadPips: 1.8,
    basePrice: 4020.70, // REAL CURRENT GOLD SPOT
    binanceSymbol: 'PAXGUSDT',
    description: 'Gold spot - tracked live via Binance PAXG (real 1:1 physical gold backing) & global bullion spot.'
  },
  {
    symbol: 'XAGUSD',
    name: 'Silver / US Dollar',
    category: 'metal_commodity',
    digits: 3,
    pipSize: 0.01,
    minLot: 0.01,
    maxLot: 20.0,
    lotStep: 0.01,
    spreadPips: 2.2,
    basePrice: 48.25,
    description: 'High beta precious metal with pronounced trend continuations.'
  },
  {
    symbol: 'USOIL',
    name: 'WTI Crude Oil',
    category: 'metal_commodity',
    digits: 2,
    pipSize: 0.01,
    minLot: 0.01,
    maxLot: 20.0,
    lotStep: 0.01,
    spreadPips: 2.5,
    basePrice: 71.40,
    description: 'Energy benchmark with violent M5 volume breakouts during NY morning.'
  },

  // Crypto & Indices
  {
    symbol: 'BTCUSD',
    name: 'Bitcoin / US Dollar',
    category: 'crypto_index',
    digits: 2,
    pipSize: 1.0,
    minLot: 0.01,
    maxLot: 10.0,
    lotStep: 0.01,
    spreadPips: 3.5,
    basePrice: 81412.00,
    binanceSymbol: 'BTCUSDT',
    description: '24/7 liquid crypto benchmark with algorithmic order book volatility.'
  },
  {
    symbol: 'ETHUSD',
    name: 'Ethereum / US Dollar',
    category: 'crypto_index',
    digits: 2,
    pipSize: 0.10,
    minLot: 0.01,
    maxLot: 20.0,
    lotStep: 0.01,
    spreadPips: 2.8,
    basePrice: 2357.60,
    binanceSymbol: 'ETHUSDT',
    description: 'High correlation with crypto ecosystem sentiment on M5 waves.'
  },
  {
    symbol: 'US30',
    name: 'Dow Jones Industrial 30',
    category: 'crypto_index',
    digits: 1,
    pipSize: 1.0,
    minLot: 0.1,
    maxLot: 50.0,
    lotStep: 0.1,
    spreadPips: 2.0,
    basePrice: 44250.0,
    description: 'US Wall Street 30 index - prime scalping vehicle for US cash open.'
  },
  {
    symbol: 'NAS100',
    name: 'US Tech 100 (Nasdaq)',
    category: 'crypto_index',
    digits: 1,
    pipSize: 1.0,
    minLot: 0.1,
    maxLot: 50.0,
    lotStep: 0.1,
    spreadPips: 1.8,
    basePrice: 21120.0,
    description: 'Fastest moving tech index with explosive M5 trend runs.'
  },

  // Forex Majors
  {
    symbol: 'EURUSD',
    name: 'Euro / US Dollar',
    category: 'forex_major',
    digits: 5,
    pipSize: 0.0001,
    minLot: 0.01,
    maxLot: 50.0,
    lotStep: 0.01,
    spreadPips: 0.6,
    basePrice: 1.1145,
    description: 'Most liquid currency pair with tight spreads. Ideal for M5 trend scalping.'
  },
  {
    symbol: 'GBPUSD',
    name: 'Great Britain Pound / US Dollar',
    category: 'forex_major',
    digits: 5,
    pipSize: 0.0001,
    minLot: 0.01,
    maxLot: 50.0,
    lotStep: 0.01,
    spreadPips: 0.9,
    basePrice: 1.3306,
    description: 'High volatility pair (Cable) with strong momentum moves on M5 sessions.'
  },
  {
    symbol: 'USDJPY',
    name: 'US Dollar / Japanese Yen',
    category: 'forex_major',
    digits: 3,
    pipSize: 0.01,
    minLot: 0.01,
    maxLot: 50.0,
    lotStep: 0.01,
    spreadPips: 0.8,
    basePrice: 157.90,
    description: 'Clean trend follower respecting M5 EMA ribbons during Tokyo & NY overlap.'
  },
  {
    symbol: 'AUDUSD',
    name: 'Australian Dollar / US Dollar',
    category: 'forex_major',
    digits: 5,
    pipSize: 0.0001,
    minLot: 0.01,
    maxLot: 50.0,
    lotStep: 0.01,
    spreadPips: 0.8,
    basePrice: 0.7043,
    description: 'Commodity currency correlated with global risk sentiment.'
  },
  {
    symbol: 'USDCAD',
    name: 'US Dollar / Canadian Dollar',
    category: 'forex_major',
    digits: 5,
    pipSize: 0.0001,
    minLot: 0.01,
    maxLot: 50.0,
    lotStep: 0.01,
    spreadPips: 1.1,
    basePrice: 1.4018,
    description: 'Strong correlation with crude oil prices and North American market sessions.'
  },
  {
    symbol: 'USDCHF',
    name: 'US Dollar / Swiss Franc',
    category: 'forex_major',
    digits: 5,
    pipSize: 0.0001,
    minLot: 0.01,
    maxLot: 50.0,
    lotStep: 0.01,
    spreadPips: 1.0,
    basePrice: 0.8290,
    description: 'Traditional safe haven currency pairing with disciplined support/resistance.'
  },
  {
    symbol: 'NZDUSD',
    name: 'New Zealand Dollar / US Dollar',
    category: 'forex_major',
    digits: 5,
    pipSize: 0.0001,
    minLot: 0.01,
    maxLot: 50.0,
    lotStep: 0.01,
    spreadPips: 1.2,
    basePrice: 0.5624,
    description: 'Kiwi dollar responsive to Asian-Pacific trade flows and risk dynamics.'
  },

  // Forex Crosses
  {
    symbol: 'GBPJPY',
    name: 'Great Britain Pound / Japanese Yen',
    category: 'forex_cross',
    digits: 3,
    pipSize: 0.01,
    minLot: 0.01,
    maxLot: 50.0,
    lotStep: 0.01,
    spreadPips: 1.4,
    basePrice: 210.15,
    description: 'The "Dragon" - extreme pip velocity, superb for automated M5 breakouts.'
  },
  {
    symbol: 'EURJPY',
    name: 'Euro / Japanese Yen',
    category: 'forex_cross',
    digits: 3,
    pipSize: 0.01,
    minLot: 0.01,
    maxLot: 50.0,
    lotStep: 0.01,
    spreadPips: 1.2,
    basePrice: 175.98,
    description: 'High liquidity cross showing clear directional swings on London open.'
  },
  {
    symbol: 'EURGBP',
    name: 'Euro / British Pound',
    category: 'forex_cross',
    digits: 5,
    pipSize: 0.0001,
    minLot: 0.01,
    maxLot: 50.0,
    lotStep: 0.01,
    spreadPips: 0.9,
    basePrice: 0.8375,
    description: 'Mean-reverting European pair favored for M5 Bollinger Band algorithms.'
  }
];

export const CATEGORY_LABELS: Record<MarketCategory, string> = {
  metal_commodity: 'Metals & Commodities',
  crypto_index: 'Crypto & Indices',
  forex_major: 'Forex Majors',
  forex_cross: 'Forex Crosses'
};
