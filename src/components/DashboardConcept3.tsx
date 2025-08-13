import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { loadState, saveState } from '../trading/dataStorage';
import { TradingState, TradeOutcome, Signal } from '../trading/types';
import { openTrade, closeTrade } from '../trading/tradeManager';
import { isDailyLossLimitReached } from '../trading/riskManager';
import { 
  BarChart3, 
  TrendingUp, 
  Target, 
  Award, 
  DollarSign, 
  Activity, 
  Bell, 
  Settings, 
  LogOut,
  Zap,
  BookOpen,
  PieChart,
  Building,
  Shield,
  Cpu,
  Rocket,
  GitBranch,
  Layers,
  LifeBuoy,
  Terminal,
  Wallet,
  Briefcase
} from 'lucide-react';
import { useUser } from '../contexts/UserContext';
import { useTradingPlan } from '../contexts/TradingPlanContext';
import SignalsFeed from './SignalsFeed';
import PerformanceAnalytics from './PerformanceAnalytics';
import TradingJournalDashboard from './TradingJournalDashboard';
import MultiAccountTracker from './MultiAccountTracker';
import RiskManagement from './RiskManagement';
import AlertSystem from './AlertSystem';
import NotificationCenter from './NotificationCenter';
import AccountSettings from './AccountSettings';
import PropFirmRules from './PropFirmRules';
import RiskProtocol from './RiskProtocol';
import TradeMentor from './TradeMentor';
import ConsentForm from './ConsentForm';
import FuturisticBackground from './FuturisticBackground';
import FuturisticCursor from './FuturisticCursor';

const DashboardConcept3 = ({ onLogout }: { onLogout: () => void }) => {
  const { user } = useUser();
  const { accounts, updateAccountConfig, tradingPlan } = useTradingPlan();
  const { tab } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(tab || 'overview');
  const aiCoachRef = useRef<HTMLIFrameElement>(null);
  const [notifications, setNotifications] = useState(3);
  const [selectedAccount, setSelectedAccount] = useState(accounts[0]?.id || 'main');
  const [showConsentForm, setShowConsentForm] = useState(false);
  const [tradingState, setTradingState] = useState<TradingState | null>(null);

  // Check if user has given consent
  useEffect(() => {
    const consentGiven = localStorage.getItem('user_consent_accepted');
    if (!consentGiven && user?.setupComplete) {
      setShowConsentForm(true);
    }
  }, [user]);

  const handleConsentAccept = () => {
    setShowConsentForm(false);
  };

  const handleConsentDecline = () => {
    onLogout();
  };

  if (!tradingPlan || !tradingPlan.userProfile || !tradingPlan.riskParameters) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center font-inter">
        <FuturisticBackground />
        <FuturisticCursor />
        <div className="relative z-10 text-center">
          <div className="text-blue-400 text-xl animate-pulse mb-4">Incomplete Trading Plan</div>
          <p className="text-gray-400 mb-4">Your trading plan is not fully configured. Please complete the setup process.</p>
          <button
            onClick={() => navigate('/questionnaire')}
            className="px-6 py-2 rounded-lg font-semibold bg-blue-600 hover:bg-blue-700 text-white transition-all"
          >
            Go to Setup
          </button>
        </div>
      </div>
    );
  }

  if (!user) {
    // If user is null, you might want to redirect to login or show a loading state
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center font-inter">
        <FuturisticBackground />
        <FuturisticCursor />
        <div className="relative z-10 text-center">
          <div className="text-blue-400 text-xl animate-pulse mb-4">Loading User...</div>
        </div>
      </div>
    );
  }


  if (!user.setupComplete) {
    const message = user.membershipTier === 'kickstarter'
      ? "Your Kickstarter plan is awaiting approval. You will be notified once your account is active."
      : "Please complete the setup process to access your dashboard.";

    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center font-inter">
        <FuturisticBackground />
        <FuturisticCursor />
        <div className="relative z-10 text-center">
          <div className="text-blue-400 text-xl animate-pulse mb-4">Awaiting Access</div>
          <p className="text-gray-400">{message}</p>
        </div>
      </div>
    );
  }

  const hasProAccess = ['pro', 'professional', 'elite', 'enterprise'].includes(user.membershipTier);
  const hasJournalAccess = ['pro', 'professional', 'elite', 'enterprise'].includes(user.membershipTier);
  const hasEnterpriseAccess = ['enterprise'].includes(user.membershipTier);

  const [currentAccount, setCurrentAccount] = useState<any>(null);

  useEffect(() => {
    if (tab) {
      setActiveTab(tab);
    }
  }, [tab]);

  const handleTabClick = (tabId: string) => {
    setActiveTab(tabId);
    navigate(`/dashboard/${tabId}`);
  };

  useEffect(() => {
    const data = loadState();
    if (data) {
      setTradingState(data);
    } else if (user && tradingPlan) {
      const initialEquity = tradingPlan.userProfile.initialBalance;
      const initialState: TradingState = {
        initialEquity,
        currentEquity: initialEquity,
        trades: [],
        openPositions: [],
        riskSettings: {
          riskPerTrade: 1, // Default 1%
          dailyLossLimit: 5, // Default 5%
          consecutiveLossesLimit: 3,
        },
        performanceMetrics: {
          totalPnl: 0,
          winRate: 0,
          totalTrades: 0,
          winningTrades: 0,
          losingTrades: 0,
          averageWin: 0,
          averageLoss: 0,
          profitFactor: 0,
          maxDrawdown: 0,
          currentDrawdown: 0,
          grossProfit: 0,
          grossLoss: 0,
          consecutiveWins: 0,
          consecutiveLosses: 0,
        },
        dailyStats: {
          pnl: 0,
          trades: 0,
          initialEquity: initialEquity,
        },
      };
      setTradingState(initialState);
      saveState(initialState);
    }
  }, [user, tradingPlan]);

  useEffect(() => {
    if (accounts.length > 0) {
      const account = accounts.find((acc) => acc.id === selectedAccount) || accounts[0];
      setCurrentAccount(account);
      if (account) {
        updateAccountConfig({ size: account.accountSize, challengeType: account.phase });
      }
    }
  }, [selectedAccount, accounts, updateAccountConfig]);

  const sidebarTabs = [
    { id: 'overview', label: 'Overview', icon: <Layers className="w-5 h-5" /> },
    { id: 'signals', label: 'Signal Feed', icon: <Zap className="w-5 h-5" /> },
    { id: 'rules', label: 'Prop Firm Rules', icon: <Shield className="w-5 h-5" /> },
    { id: 'analytics', label: 'Performance', icon: <PieChart className="w-5 h-5" /> },
    ...(hasJournalAccess ? [{ id: 'journal', label: 'Trade Journal', icon: <BookOpen className="w-5 h-5" /> }] : []),
    ...(hasProAccess || hasEnterpriseAccess ? [{ id: 'accounts', label: 'Multi-Account', icon: <GitBranch className="w-5 h-5" /> }] : []),
    { id: 'risk-protocol', label: 'Risk Protocol', icon: <Target className="w-5 h-5" /> },
    ...(hasProAccess || hasEnterpriseAccess ? [{ id: 'nexus-coach', label: 'Nexus Coach', icon: <Rocket className="w-5 h-5" /> }] : []),
    { id: 'alerts', label: 'Alerts', icon: <Bell className="w-5 h-5" /> },
  ];

  const stats = [
    {
      label: 'Account Balance',
      value: tradingState ? `$${tradingState.currentEquity.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '$0',
      change: 'Live Data',
      icon: <DollarSign className="w-8 h-8" />,
      color: 'green',
    },
    {
      label: 'Win Rate',
      value: tradingState ? `${tradingState.performanceMetrics.winRate.toFixed(1)}%` : 'No Data',
      change: 'From Taken Trades',
      icon: <Target className="w-8 h-8" />,
      color: 'blue',
    },
    {
      label: 'Total Trades',
      value: tradingState ? tradingState.trades.length.toString() : '0',
      change: 'Active Trading',
      icon: <Activity className="w-8 h-8" />,
      color: 'purple',
    },
    {
      label: 'Total P&L',
      value:
        tradingState
          ? `${tradingState.performanceMetrics.totalPnl >= 0 ? '+' : ''}$${tradingState.performanceMetrics.totalPnl.toFixed(2)}`
          : 'No Data',
      change: 'From Trades',
      icon: <Award className="w-8 h-8" />,
      color: tradingState && tradingState.performanceMetrics.totalPnl >= 0 ? 'green' : 'red',
    },
  ];

  const renderOverview = () => (
    <div className="space-y-6 animate-fade-in-up">
      <div className="cyber-card">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="cyber-title">Welcome, {user.name}</h2>
            <p className="text-gray-400">
              Your {user.membershipTier.charAt(0).toUpperCase() + user.membershipTier.slice(1)} Dashboard
            </p>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-400">Total P&L</div>
            <div className={`text-3xl font-bold ${tradingState && tradingState.performanceMetrics.totalPnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {tradingState
                ? `${tradingState.performanceMetrics.totalPnl >= 0 ? '+' : ''}$${tradingState.performanceMetrics.totalPnl.toFixed(2)}`
                : '$0'}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div
            key={index}
            className={`cyber-card`}
          >
            <div className="flex items-center space-x-4">
              <div
                className={`p-3 bg-gray-800/60 rounded-full text-blue-400 transition-all duration-300 group-hover:bg-blue-500/20 group-hover:shadow-lg group-hover:shadow-blue-500/30`}
              >
                {stat.icon}
              </div>
              <div>
                <p className="text-sm text-gray-400">{stat.label}</p>
                <p className="text-2xl font-bold text-white">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 cyber-card">
          <h3 className="cyber-title">Recent Trades</h3>
          {tradingState && tradingState.trades.length === 0 ? (
            <div className="text-center py-12">
              <Activity className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <div className="text-gray-400 text-lg font-medium mb-2">No trades recorded yet</div>
              <div className="text-sm text-gray-500 mb-4">
                Start taking signals and mark them as "taken" to see your performance here
              </div>
              <div className="bg-blue-600/20 border border-blue-600 rounded-lg p-4">
                <p className="text-blue-300 text-sm">
                  <strong>Important:</strong> Click "Mark as Taken" on any signal you execute. This helps us track
                  your performance without accessing your trading account credentials.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {tradingState?.trades.slice(-5).reverse().map((trade, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-gray-900/50 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div
                      className={`w-3 h-3 rounded-full ${
                        (trade.pnl || 0) > 0 ? 'bg-green-400' : (trade.pnl || 0) < 0 ? 'bg-red-400' : 'bg-yellow-400'
                      }`}
                    ></div>
                    <div>
                      <div className="text-white font-medium">Trade {trade.id.slice(-4)}</div>
                      <div className="text-sm text-gray-400">
                        {trade.outcome} • {new Date(trade.entryTime).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`font-medium ${(trade.pnl || 0) > 0 ? 'text-green-400' : (trade.pnl || 0) < 0 ? 'text-red-400' : 'text-yellow-400'}`}>
                      {(trade.pnl || 0).toFixed(2)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="cyber-card">
          <h3 className="cyber-title">Market Status</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Forex Market</span>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-green-400 text-sm">Open</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Current Session</span>
              <span className="text-white text-sm">London</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Next Session</span>
              <span className="text-white text-sm">New York (2h 15m)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const handleMarkAsTaken = (signal: Signal, outcome: TradeOutcome, pnl?: number) => {
    if (tradingState) {
      if (isDailyLossLimitReached(tradingState)) {
        alert("You have hit your daily loss limit. No more trades are allowed today.");
        return;
      }
      const stateAfterOpen = openTrade(tradingState, signal);
      const newTrade = stateAfterOpen.openPositions[stateAfterOpen.openPositions.length - 1];
      const finalState = closeTrade(stateAfterOpen, newTrade.id, outcome, pnl);
      setTradingState(finalState);

      if (hasProAccess) {
        handleTabClick('nexus-coach');
        setTimeout(() => {
          if (aiCoachRef.current && aiCoachRef.current.contentWindow) {
            const signalData = {
              symbol: signal.pair,
              type: signal.direction,
              entryPrice: signal.entryPrice.toString(),
            };
            (aiCoachRef.current.contentWindow as any).receiveSignal(signalData);
          }
        }, 100); // Small delay to ensure iframe is rendered
      }
    }
  };

  const handleAddToJournal = (signal: Signal) => {
    console.log('Adding to journal:', signal);
    handleTabClick('journal');
  };

  const handleChatWithNexus = (signal: Signal) => {
    console.log('Chatting with Nexus about:', signal);
    handleTabClick('nexus-coach');
    setTimeout(() => {
      if (aiCoachRef.current && aiCoachRef.current.contentWindow) {
        const signalData = {
          symbol: signal.pair,
          type: signal.direction,
          entryPrice: signal.entryPrice.toString(),
        };
        (aiCoachRef.current.contentWindow as any).receiveSignal(signalData);
      }
    }, 100); // Small delay to ensure iframe is rendered
  };

  return (
    <>
      <style>{`
        /* CONCEPT 3: CYBERPUNK NEON */
        .concept3 {
            background: #0a0a0a;
            position: relative;
            width: 100%;
            height: 100vh;
            overflow: hidden;
            display: flex;
        }

        .cyber-rain {
            position: absolute;
            width: 100%;
            height: 100%;
            background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><text y="20" font-family="monospace" font-size="10" fill="%2300ff00" opacity="0.1">01001</text></svg>');
            animation: rain-fall 10s linear infinite;
            opacity: 0.1;
        }

        @keyframes rain-fall {
            0% { transform: translateY(-100px); }
            100% { transform: translateY(100vh); }
        }

        .cyber-sidebar {
            width: 80px;
            height: 100%;
            background: #111;
            border-right: 2px solid #ff00ff;
            display: flex;
            flex-direction: column;
            align-items: center;
            padding: 20px 0;
            z-index: 100;
        }

        .cyber-icon {
            width: 50px;
            height: 50px;
            margin: 20px 0;
            border: 2px solid #00ff00;
            border-radius: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: all 0.3s;
            position: relative;
            overflow: hidden;
            font-size: 24px;
            color: #00ff00;
        }

        .cyber-icon.active {
            background: rgba(0, 255, 0, 0.2);
            box-shadow: 0 0 20px #00ff00;
        }

        .cyber-icon::before {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, transparent, #00ff00, transparent);
            transition: left 0.5s;
        }

        .cyber-icon:hover {
            transform: scale(1.1);
            box-shadow: 0 0 20px #00ff00;
        }

        .cyber-icon:hover::before {
            left: 100%;
        }

        .cyber-main {
            flex: 1;
            padding: 40px;
            height: 100vh;
            overflow-y: auto;
        }

        .cyber-card {
            background: rgba(0, 0, 0, 0.8);
            border: 1px solid #ff00ff;
            padding: 20px;
            margin-bottom: 20px;
            position: relative;
            clip-path: polygon(0 0, calc(100% - 20px) 0, 100% 20px, 100% 100%, 20px 100%, 0 calc(100% - 20px));
        }

        .cyber-card::before {
            content: '';
            position: absolute;
            top: -2px;
            left: -2px;
            right: -2px;
            bottom: -2px;
            background: linear-gradient(45deg, #ff00ff, #00ff00, #ff00ff);
            z-index: -1;
            clip-path: polygon(0 0, calc(100% - 20px) 0, 100% 20px, 100% 100%, 20px 100%, 0 calc(100% - 20px));
            animation: border-glow 3s linear infinite;
        }

        @keyframes border-glow {
            0%, 100% { opacity: 0.5; }
            50% { opacity: 1; }
        }

        .cyber-title {
            font-size: 18px;
            color: #00ff00;
            text-transform: uppercase;
            letter-spacing: 2px;
            margin-bottom: 15px;
            text-shadow: 0 0 10px #00ff00;
        }
        .tab-content {
            display: none;
            animation: fadeIn 0.5s ease;
        }

        .tab-content.active {
            display: block;
        }

        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
      <div className="concept3">
        <div className="cyber-rain"></div>
        <div className="cyber-sidebar">
            {sidebarTabs.map(item => (
                <div 
                    key={item.id}
                    className={`cyber-icon ${activeTab === item.id ? 'active' : ''}`}
                    onClick={() => handleTabClick(item.id)}
                    title={item.label}
                >
                    {item.icon}
                </div>
            ))}
        </div>
        <div className="cyber-main">
            <div className="container mx-auto">
              {activeTab === 'overview' && renderOverview()}
              {activeTab === 'signals' && <SignalsFeed onMarkAsTaken={handleMarkAsTaken} onAddToJournal={handleAddToJournal} onChatWithNexus={handleChatWithNexus} />}
              {activeTab === 'analytics' && <PerformanceAnalytics tradingState={tradingState} />}
              {activeTab === 'journal' && hasJournalAccess && <TradingJournalDashboard />}
              {activeTab === 'accounts' && hasProAccess && <MultiAccountTracker />}
              {activeTab === 'rules' && <PropFirmRules />}
              {activeTab === 'risk-protocol' && <RiskProtocol />}
              {activeTab === 'nexus-coach' && hasProAccess && (
                <iframe
                  ref={aiCoachRef}
                  src="/src/components/AICoach.html"
                  title="Nexus AI Trading Coach"
                  style={{ width: '100%', height: 'calc(100vh - 120px)', border: 'none', borderRadius: '1rem' }}
                />
              )}
              {activeTab === 'alerts' && <AlertSystem />}
              {activeTab === 'notifications' && <NotificationCenter />}
              {activeTab === 'settings' && <AccountSettings />}
            </div>
        </div>
      </div>
      <ConsentForm
          isOpen={showConsentForm}
          onAccept={handleConsentAccept}
          onDecline={handleConsentDecline}
        />
    </>
  );
};

export default DashboardConcept3;
