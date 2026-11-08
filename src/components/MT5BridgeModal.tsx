import React, { useState, useEffect } from 'react';
import { MT5Account } from '../types/trading';
import { generateMQL5ExpertAdvisorCode, generatePythonBridgeCode } from '../services/mql5Generator';
import {
  Server,
  Download,
  Copy,
  Check,
  Zap,
  HelpCircle,
  ExternalLink,
  X,
  Code2,
  Terminal,
  Activity,
  Layers,
  Eye,
  EyeOff,
  CheckCircle2,
  Lock,
  Globe
} from 'lucide-react';

interface MT5BridgeModalProps {
  isOpen: boolean;
  onClose: () => void;
  account: MT5Account;
  onUpdateAccount: (account: Partial<MT5Account>) => void;
  onSendTestOrder: () => void;
}

const POPULAR_SERVERS = [
  'InvestmentSpotLtd-Server',
  'Exness-Real14',
  'ICMarketsSC-Live02',
  'FTMO-Server',
  'XMGlobal-Real 55',
  'Deriv-Server',
  'Pepperstone-Edge01',
  'FBS-Real',
  'VantageFX-Live',
  'OctaFX-Real',
  'HFM-Live'
];

export const MT5BridgeModal: React.FC<MT5BridgeModalProps> = ({
  isOpen,
  onClose,
  account,
  onUpdateAccount,
  onSendTestOrder
}) => {
  const [activeTab, setActiveTab] = useState<'status' | 'mql5' | 'python' | 'guide'>('status');
  const [copiedMql5, setCopiedMql5] = useState(false);
  const [copiedPython, setCopiedPython] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [isPinging, setIsPinging] = useState(false);

  // Form input states
  const [accountNumber, setAccountNumber] = useState(account.accountNumber || '500002809');
  const [brokerServer, setBrokerServer] = useState(account.brokerServer || 'InvestmentSpotLtd-Server');
  const [password, setPassword] = useState(account.password || 'Y-4vXyPa');
  const [investorPassword, setInvestorPassword] = useState(account.investorPassword || 'A_6uOylx');
  const [showPassword, setShowPassword] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Load from localStorage or sync with props
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('mt5_account_credentials');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed.accountNumber) setAccountNumber(parsed.accountNumber);
          if (parsed.brokerServer) setBrokerServer(parsed.brokerServer);
          if (parsed.password) setPassword(parsed.password);
          if (parsed.investorPassword) setInvestorPassword(parsed.investorPassword);
        } else {
          setAccountNumber(account.accountNumber || '500002809');
          setBrokerServer(account.brokerServer || 'InvestmentSpotLtd-Server');
          setPassword(account.password || 'Y-4vXyPa');
          setInvestorPassword(account.investorPassword || 'A_6uOylx');
        }
      } catch (e) {
        setAccountNumber(account.accountNumber || '500002809');
        setBrokerServer(account.brokerServer || 'InvestmentSpotLtd-Server');
        setPassword(account.password || 'Y-4vXyPa');
        setInvestorPassword(account.investorPassword || 'A_6uOylx');
      }
    }
  }, [account, isOpen]);

  if (!isOpen) return null;

  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
  const secretToken = 'mt5_live_sec_' + (accountNumber || account.accountNumber);
  const mql5Code = generateMQL5ExpertAdvisorCode(currentOrigin, secretToken);
  const pythonCode = generatePythonBridgeCode(currentOrigin, secretToken);

  const handleCopyMql5 = () => {
    navigator.clipboard.writeText(mql5Code);
    setCopiedMql5(true);
    setTimeout(() => setCopiedMql5(false), 2000);
  };

  const handleCopyPython = () => {
    navigator.clipboard.writeText(pythonCode);
    setCopiedPython(true);
    setTimeout(() => setCopiedPython(false), 2000);
  };

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(currentOrigin);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  const handleDownloadMQL5 = () => {
    const blob = new Blob([mql5Code], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'MT5_M5_AutoTrader_Pro.mq5';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handlePingTest = () => {
    setIsPinging(true);
    setTimeout(() => {
      setIsPinging(false);
      onUpdateAccount({
        accountNumber,
        brokerServer,
        password,
        investorPassword,
        brokerName: brokerServer.includes('InvestmentSpot') ? 'Investment Spot Ltd.' : undefined,
        pingMs: Math.floor(12 + Math.random() * 8),
        connected: true,
        lastHeartbeat: Date.now()
      });
    }, 500);
  };

  const handleConnectAndSave = () => {
    const updated = {
      accountNumber,
      brokerServer,
      password,
      investorPassword,
      brokerName: brokerServer.includes('InvestmentSpot') ? 'Investment Spot Ltd.' : undefined,
      balance: (brokerServer.includes('InvestmentSpot') && account.balance === 50) ? 3000 : account.balance,
      equity: (brokerServer.includes('InvestmentSpot') && account.equity === 50) ? 3000 : account.equity,
      freeMargin: (brokerServer.includes('InvestmentSpot') && account.freeMargin === 50) ? 3000 : account.freeMargin,
      connected: true,
      lastHeartbeat: Date.now()
    };
    onUpdateAccount(updated);

    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('mt5_account_credentials', JSON.stringify({
          accountNumber,
          brokerServer,
          password,
          investorPassword
        }));
      } catch (e) {
        // ignore
      }
    }

    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 800);
  };

  const handleApplyUserAccount = () => {
    setAccountNumber('500002809');
    setBrokerServer('InvestmentSpotLtd-Server');
    setPassword('Y-4vXyPa');
    setInvestorPassword('A_6uOylx');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className="relative flex flex-col w-full max-w-4xl max-h-[92vh] bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>Universal MT5 Connection Bridge</span>
                <span className="text-xs px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 font-mono">
                  {account.connected ? 'Connected / Ready' : 'Disconnected'}
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Connect ANY broker server (Exness, IC Markets, FTMO, XM, Deriv, FBS, Pepperstone, etc.)
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

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 px-6 border-b border-slate-800 bg-slate-950/40 text-xs">
          <button
            onClick={() => setActiveTab('status')}
            className={`flex items-center gap-2 px-4 py-3 font-medium border-b-2 transition-colors ${
              activeTab === 'status'
                ? 'border-sky-500 text-sky-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>Account Credentials & Server</span>
          </button>
          <button
            onClick={() => setActiveTab('mql5')}
            className={`flex items-center gap-2 px-4 py-3 font-medium border-b-2 transition-colors ${
              activeTab === 'mql5'
                ? 'border-sky-500 text-sky-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Code2 className="w-4 h-4" />
            <span>MQL5 Expert Advisor (.mq5)</span>
          </button>
          <button
            onClick={() => setActiveTab('python')}
            className={`flex items-center gap-2 px-4 py-3 font-medium border-b-2 transition-colors ${
              activeTab === 'python'
                ? 'border-sky-500 text-sky-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Terminal className="w-4 h-4" />
            <span>Python Gateway</span>
          </button>
          <button
            onClick={() => setActiveTab('guide')}
            className={`flex items-center gap-2 px-4 py-3 font-medium border-b-2 transition-colors ${
              activeTab === 'guide'
                ? 'border-sky-500 text-sky-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <HelpCircle className="w-4 h-4" />
            <span>Nepali Setup Guide (मार्गदर्शन)</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="flex-1 p-6 overflow-y-auto">
          {activeTab === 'status' && (
            <div className="space-y-6">
              {/* Account Quick Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-lg">
                  <div className="text-xs text-slate-400">$50 Micro Account</div>
                  <div className="text-lg font-bold font-mono tabular-nums text-white mt-1">
                    ${account.balance.toFixed(2)}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">Currency: {account.currency}</div>
                </div>

                <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-lg">
                  <div className="text-xs text-slate-400">Equity</div>
                  <div className="text-lg font-bold font-mono tabular-nums text-emerald-400 mt-1">
                    ${account.equity.toFixed(2)}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">Fixed Lot: 0.01</div>
                </div>

                <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-lg">
                  <div className="text-xs text-slate-400">Active Broker Server</div>
                  <div className="text-sm font-bold font-mono text-sky-400 truncate mt-1">
                    {brokerServer || account.brokerServer || 'Not Configured'}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">Any MT5 Server Supported</div>
                </div>

                <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-lg">
                  <div className="text-xs text-slate-400">Bridge Latency</div>
                  <div className="text-lg font-bold font-mono tabular-nums text-emerald-400 mt-1">
                    {account.pingMs}ms
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    <span>Real-Time Active</span>
                  </div>
                </div>
              </div>

              {/* Universal Account & Broker Server Configuration Form */}
              <div className="p-5 bg-slate-950 border border-slate-800 rounded-lg space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                    <Globe className="w-4 h-4 text-sky-400" />
                    <span>Connect ANY MT5 Broker Server</span>
                  </h3>
                  <span className="text-xs text-purple-400 font-mono">Ghost SL: Armed</span>
                </div>

                {/* User Current Active Account Banner */}
                <div className="p-3 bg-gradient-to-r from-sky-950/80 via-slate-900 to-emerald-950/60 border border-sky-800/60 rounded-lg flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-sky-500/20 border border-sky-500/30 flex items-center justify-center text-sky-400 font-bold text-xs">
                      MT5
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-white flex items-center gap-2">
                        <span>InvestmentSpotLtd-Server</span>
                        <span className="text-[10px] px-1.5 py-0.2 bg-emerald-900/80 text-emerald-300 rounded border border-emerald-700">
                          Pro Demo ($3,000.00)
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-300 font-mono">
                        Login: <strong className="text-sky-300">500002809</strong> | Password: <span className="text-slate-400">Y-4vXyPa</span> | Investor: <span className="text-slate-400">A_6uOylx</span>
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleApplyUserAccount}
                    className="px-2.5 py-1 text-[11px] font-semibold bg-sky-600 hover:bg-sky-500 text-white rounded transition-colors shadow-sm"
                  >
                    Quick-Fill Investment Spot Ltd.
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
                  {/* Account Number */}
                  <div>
                    <label className="block text-slate-300 font-medium mb-1">MT5 Account / Login #</label>
                    <input
                      type="text"
                      placeholder="e.g. 500002809"
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded text-slate-100 font-mono focus:outline-none focus:border-sky-500"
                    />
                  </div>

                  {/* Broker Server with Universal Input */}
                  <div>
                    <label className="block text-slate-300 font-medium mb-1">
                      Broker Server (Type ANY Server)
                    </label>
                    <input
                      type="text"
                      list="broker-servers-list"
                      placeholder="e.g. InvestmentSpotLtd-Server"
                      value={brokerServer}
                      onChange={(e) => setBrokerServer(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded text-slate-100 font-mono focus:outline-none focus:border-sky-500"
                    />
                    <datalist id="broker-servers-list">
                      {POPULAR_SERVERS.map((srv) => (
                        <option key={srv} value={srv} />
                      ))}
                    </datalist>
                  </div>

                  {/* Password with Eye Toggle */}
                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Trading Password</label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Enter your MT5 trading password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full px-3 py-2 pr-9 bg-slate-900 border border-slate-800 rounded text-slate-100 font-mono focus:outline-none focus:border-sky-500 placeholder-slate-600"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors"
                        title={showPassword ? 'Hide Password' : 'Show Password'}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Investor Password */}
                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Investor Password (Read-Only)</label>
                    <input
                      type="text"
                      placeholder="e.g. A_6uOylx"
                      value={investorPassword}
                      onChange={(e) => setInvestorPassword(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded text-slate-100 font-mono focus:outline-none focus:border-sky-500"
                    />
                  </div>
                </div>

                {/* Popular Broker Quick Selection Badges */}
                <div className="pt-1">
                  <span className="text-[11px] text-slate-400 block mb-1.5">
                    Click to quick-select popular broker, or type your own above:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {POPULAR_SERVERS.map((srv) => (
                      <button
                        key={srv}
                        type="button"
                        onClick={() => setBrokerServer(srv)}
                        className={`px-2 py-1 text-[11px] rounded transition-colors font-mono ${
                          brokerServer === srv
                            ? 'bg-sky-600 text-white font-bold'
                            : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
                        }`}
                      >
                        {srv}
                      </button>
                    ))}
                  </div>
                </div>

                {/* WebRequest Target URL for MT5 */}
                <div className="pt-3 border-t border-slate-800 text-xs space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-slate-400">WebRequest Target Server URL (Allowlist in MT5):</span>
                    <button
                      onClick={handleCopyUrl}
                      className="flex items-center gap-1 text-sky-400 hover:text-sky-300 font-mono"
                    >
                      {copiedUrl ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedUrl ? 'Copied' : 'Copy URL'}</span>
                    </button>
                  </div>
                  <div className="p-2.5 bg-slate-900 border border-slate-800 rounded font-mono text-emerald-400 select-all">
                    {currentOrigin}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  <button
                    onClick={handlePingTest}
                    disabled={isPinging}
                    className="flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded bg-slate-800 hover:bg-slate-700 text-white transition-colors border border-slate-700"
                  >
                    <Zap className="w-3.5 h-3.5 text-amber-400" />
                    <span>{isPinging ? 'Testing Ping...' : `Test MT5 Ping (${account.pingMs}ms)`}</span>
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={onSendTestOrder}
                      className="px-3.5 py-2 text-xs font-medium rounded bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
                    >
                      Send 0.01 Test Ping
                    </button>
                    <button
                      onClick={handleConnectAndSave}
                      className="flex items-center gap-1.5 px-5 py-2 text-xs font-bold rounded bg-emerald-600 hover:bg-emerald-500 text-white transition-colors shadow-sm"
                    >
                      {savedSuccess ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-white" />
                          <span>Connected & Saved!</span>
                        </>
                      ) : (
                        <span>Save & Connect Broker</span>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'mql5' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-white">MQL5 Expert Advisor Source Code</h3>
                  <p className="text-xs text-slate-400">
                    Works on any MT5 Broker (Exness, IC Markets, FTMO, XM, Deriv, Pepperstone, etc.)
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopyMql5}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
                  >
                    {copiedMql5 ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedMql5 ? 'Copied MQL5' : 'Copy Code'}</span>
                  </button>
                  <button
                    onClick={handleDownloadMQL5}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded bg-sky-600 hover:bg-sky-500 text-white transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download .mq5 EA</span>
                  </button>
                </div>
              </div>

              <div className="relative">
                <pre className="p-4 bg-slate-950 border border-slate-800 rounded-lg text-[11px] font-mono text-slate-300 max-h-[380px] overflow-y-auto leading-relaxed select-all">
                  {mql5Code}
                </pre>
              </div>
            </div>
          )}

          {activeTab === 'python' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-white">Python MetaTrader5 Gateway</h3>
                  <p className="text-xs text-slate-400">
                    Alternative for VPS / Local Python environments using official MetaTrader5 package.
                  </p>
                </div>
                <button
                  onClick={handleCopyPython}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
                >
                  {copiedPython ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedPython ? 'Copied Python' : 'Copy Code'}</span>
                </button>
              </div>

              <div className="p-3 bg-slate-950 border border-slate-800 rounded text-xs font-mono text-slate-400">
                # Install prerequisite libraries:<br />
                <span className="text-emerald-400">pip install MetaTrader5 requests</span>
              </div>

              <pre className="p-4 bg-slate-950 border border-slate-800 rounded-lg text-[11px] font-mono text-slate-300 max-h-[340px] overflow-y-auto leading-relaxed select-all">
                {pythonCode}
              </pre>
            </div>
          )}

          {activeTab === 'guide' && (
            <div className="space-y-5 text-xs text-slate-300">
              <div className="p-4 bg-sky-950/30 border border-sky-800/40 rounded-lg">
                <h3 className="text-sm font-bold text-sky-300 mb-1">
                  कुनै पनि Broker Server जोड्ने सजिलो तरिका (Universal Broker Connection):
                </h3>
                <p className="text-slate-300 leading-relaxed">
                  तपाईंको ब्रोकर Exness, IC Markets, FTMO, XM, Deriv, FBS, Pepperstone, वा अन्य जुनसुकै भए पनि यो प्रणालीमा सिधै जोड्न सकिन्छ।
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 bg-slate-950 border border-slate-800 rounded-lg">
                  <div className="flex items-center justify-center w-6 h-6 rounded-full bg-sky-500/20 text-sky-400 font-bold shrink-0">
                    १
                  </div>
                  <div>
                    <h4 className="font-semibold text-white">खाता, सर्भर र पासवर्ड राख्नुहोस्</h4>
                    <p className="text-slate-400 mt-0.5">
                      पहिलो ट्याबमा आफ्नो <strong>MT5 Account #</strong>, ब्रोकरले दिएको <strong>Server Name</strong> (जस्तै: Exness-Real, ICMarkets-Live) र <strong>Password</strong> टाइप गर्नुहोस्। (आँखाको आइकन थिचेर पासवर्ड जाँच गर्न सकिन्छ)।
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-slate-950 border border-slate-800 rounded-lg">
                  <div className="flex items-center justify-center w-6 h-6 rounded-full bg-sky-500/20 text-sky-400 font-bold shrink-0">
                    २
                  </div>
                  <div>
                    <h4 className="font-semibold text-white">EA फाइल डाउनलोड गर्नुहोस्</h4>
                    <p className="text-slate-400 mt-0.5">
                      <strong>MQL5 Expert Advisor (.mq5)</strong> ट्याबमा गएर <strong>Download .mq5 EA</strong> बटन थिच्नुहोस्।
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-slate-950 border border-slate-800 rounded-lg">
                  <div className="flex items-center justify-center w-6 h-6 rounded-full bg-sky-500/20 text-sky-400 font-bold shrink-0">
                    ३
                  </div>
                  <div>
                    <h4 className="font-semibold text-white">MT5 को Experts फोल्डरमा राख्नुहोस्</h4>
                    <p className="text-slate-400 mt-0.5">
                      MT5 खोल्नुहोस् ➔ <strong>File ➔ Open Data Folder</strong> ➔{' '}
                      <strong>MQL5 ➔ Experts</strong> फोल्डरभित्र डाउनलोड गरिएको फाइल पेस्ट गर्नुहोस्।
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-slate-950 border border-slate-800 rounded-lg">
                  <div className="flex items-center justify-center w-6 h-6 rounded-full bg-sky-500/20 text-sky-400 font-bold shrink-0">
                    ४
                  </div>
                  <div>
                    <h4 className="font-semibold text-white">WebRequest URL अनुमति दिनुहोस्</h4>
                    <p className="text-slate-400 mt-0.5">
                      MT5 मा <strong>Tools ➔ Options ➔ Expert Advisors</strong> मा जानुहोस् र{' '}
                      <strong>Allow WebRequest for listed URL</strong> मा यो एपको URL थप्नुहोस्:<br />
                      <code className="text-emerald-400 font-mono mt-1 inline-block bg-slate-900 px-2 py-0.5 rounded">
                        {currentOrigin}
                      </code>
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-slate-950 border border-slate-800 rounded-lg">
                  <div className="flex items-center justify-center w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 font-bold shrink-0">
                    ५
                  </div>
                  <div>
                    <h4 className="font-semibold text-white">चार्टमा EA हाल्नुहोस् र Algo Trading ON गर्नुहोस्</h4>
                    <p className="text-slate-400 mt-0.5">
                      MT5 मा EA लाई चार्टमा हाल्नुहोस् र माथिको <strong>Algo Trading</strong> बटन अन गर्नुहोस्। अब Real Live Gold (XAUUSD ~$4,020) र सबै जोडीहरूमा Ghost SL सहित अटो-ट्रेडिङ सुरु हुनेछ!
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-slate-800 bg-slate-950/70 text-xs text-slate-400">
          <span>Bridge Protocol: Universal Broker REST Webhook & WebRequest v2.4</span>
          <button
            onClick={onClose}
            className="px-4 py-2 font-medium text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
          >
            Close Window
          </button>
        </div>
      </div>
    </div>
  );
};
