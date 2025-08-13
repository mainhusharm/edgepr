import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { TradingState, TradeOutcome, Signal } from '../trading/types';
import { openTrade, closeTrade } from '../trading/tradeManager';
import { isDailyLossLimitReached } from '../trading/riskManager';
import { loadState } from '../trading/dataStorage';
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
  LifeBuoy
} from 'lucide-react';
import { useUser } from '../contexts/UserContext';
import { useTradingPlan } from '../contexts/TradingPlanContext';
import api from '../api';
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

const Dashboard = ({ onLogout }: { onLogout: () => void }) => {
  const { user } = useUser();
  const { accounts, accountConfig, updateAccountConfig, tradingPlan } = useTradingPlan();
  const { tab } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(tab || 'overview');
  const aiCoachRef = useRef<HTMLIFrameElement>(null);
  const [notifications, setNotifications] = useState(3);
  const [selectedAccount, setSelectedAccount] = useState('');
  const [showConsentForm, setShowConsentForm] = useState(false);
  const [tradingState, setTradingState] = useState<TradingState | null>(null);
  const [userAccounts, setUserAccounts] = useState<any[]>([]);
  const [performanceData, setPerformanceData] = useState<any[]>([]);
  const [currentAccount, setCurrentAccount] = useState<any>(null);

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

  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        const response = await api.get('/accounts');
        setUserAccounts(response.data);
        if (response.data.length > 0) {
          setSelectedAccount(response.data[0].id);
        }
      } catch (error) {
        console.error('Error fetching accounts:', error);
      }
    };

    if (user) {
      fetchAccounts();
    }
  }, [user]);

  useEffect(() => {
    if (selectedAccount) {
      const fetchPerformanceData = async () => {
        try {
          const response = await api.get(`/performance?account_id=${selectedAccount}`);
          setPerformanceData(response.data);
        } catch (error) {
          console.error('Error fetching performance data:', error);
        }
      };

      fetchPerformanceData();
    }
  }, [selectedAccount]);

  useEffect(() => {
    if (userAccounts.length > 0 && selectedAccount) {
      const account = userAccounts.find((acc) => acc.id === selectedAccount) || userAccounts[0];
      setCurrentAccount(account);
    }
  }, [selectedAccount, userAccounts]);

  useEffect(() => {
    const initState = async () => {
      if (user && tradingPlan && currentAccount) {
        const loadedState = await loadState();
        if (loadedState) {
          setTradingState(loadedState);
        } else {
          const initialEquity = currentAccount.balance;
          const initialState: TradingState = {
            initialEquity,
            currentEquity: initialEquity,
            trades: [],
            openPositions: [],
            riskSettings: {
              riskPerTrade: 1,
              dailyLossLimit: 5,
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
        }
      }
    };
    initState();
  }, [user, tradingPlan, currentAccount]);

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

  useEffect(() => {
    if (tab) {
      setActiveTab(tab);
    }
  }, [tab]);

  const handleTabClick = (tabId: string) => {
    setActiveTab(tabId);
    navigate(`/dashboard/${tabId}`);
  };

  const sidebarTabs = [
    { id: 'overview', label: 'Overview', icon: <Layers className="w-5 h-5" /> },
    { id: 'signals', label: 'Signal Feed', icon: <Zap className="w-5 h-5" /> },
    { id: 'rules', label: 'Prop Firm Rules', icon: <Shield className="w-5 h-5" /> },
    { id: 'analytics', label: 'Performance', icon: <PieChart className="w-5 h-5" /> },
    ...(hasJournalAccess ? [{ id: 'journal', label: 'Trade Journal', icon: <BookOpen className="w-5 h-5" /> }] : []),
    ...(hasProAccess || hasEnterpriseAccess ? [{ id: 'accounts', label: 'Multi-Account', icon: <GitBranch className="w-5 h-5" /> }] : []),
    { id: 'risk-protocol', label: 'Risk Protocol', icon: <Target className="w-5 h-5" /> },
    { id: 'ai-coach', label: 'AI Coach', icon: <Cpu className="w-5 h-5" /> },
    { id: 'alerts', label: 'Alerts', icon: <Bell className="w-5 h-5" /> },
    { id: 'notifications', label: 'Notifications', icon: <Bell className="w-5 h-5" /> },
    { id: 'settings', label: 'Settings', icon: <Settings className="w-5 h-5" /> },
  ];

  const stats = [
    {
      label: 'Account Balance',
      value: tradingState ? `$${tradingState.currentEquity.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : (accountConfig ? `$${accountConfig.size.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '$0'),
      change: 'Live Data',
      icon: <DollarSign className="w-8 h-8" />,
      color: 'green',
    },
    {
      label: 'Win Rate',
      value: performanceData.length > 0 ? `${performanceData[0].win_rate.toFixed(1)}%` : 'No Data',
      change: 'From Taken Trades',
      icon: <Target className="w-8 h-8" />,
      color: 'blue',
    },
    {
      label: 'Total Trades',
      value: performanceData.length > 0 ? performanceData[0].total_trades.toString() : '0',
      change: 'Active Trading',
      icon: <Activity className="w-8 h-8" />,
      color: 'purple',
    },
    {
      label: 'Total P&L',
      value:
        performanceData.length > 0
          ? `${performanceData[0].total_pnl >= 0 ? '+' : ''}$${performanceData[0].total_pnl.toFixed(2)}`
          : 'No Data',
      change: 'From Trades',
      icon: <Award className="w-8 h-8" />,
      color: performanceData.length > 0 && performanceData[0].total_pnl >= 0 ? 'green' : 'red',
    },
  ];

  const renderOverview = () => (
    <div className="space-y-6 animate-fade-in-up">
      <div className="holo-card">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-white mb-2">Welcome, {user.name}</h2>
            <p className="text-gray-400">
              Your {user.membershipTier.charAt(0).toUpperCase() + user.membershipTier.slice(1)} Dashboard
            </p>
          </div>
          <div className="text-right">
            <select
              value={selectedAccount}
              onChange={(e) => setSelectedAccount(e.target.value)}
              className="bg-gray-800 text-white p-2 rounded"
            >
              {userAccounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.account_name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="holo-stats">
        {stats.map((stat, index) => (
          <div key={index} className="holo-stat">
            <div className="holo-value">{stat.value}</div>
            <div style={{color: 'rgba(255,255,255,0.5)', marginTop: '10px'}}>{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 holo-card">
          <h3 className="text-xl font-semibold text-white mb-6">Performance Overview</h3>
          {performanceData.length === 0 ? (
            <div className="text-center py-12">
              <Activity className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <div className="text-gray-400 text-lg font-medium mb-2">No performance data yet</div>
              <div className="text-sm text-gray-500 mb-4">
                Trade data will appear here once you start trading.
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {performanceData.map((perf, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-gray-900/50 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div>
                      <div className="text-white font-medium">{new Date(perf.date).toLocaleDateString()}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`font-medium ${perf.total_pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {perf.total_pnl.toFixed(2)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="lg:col-span-2 holo-card">
          <h3 className="text-xl font-semibold text-white mb-6">Recent Trades</h3>
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
        <div className="holo-card">
          <h3 className="text-lg font-semibold text-white mb-4">Market Status</h3>
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
        handleTabClick('ai-coach');
        setTimeout(() => {
          if (aiCoachRef.current && aiCoachRef.current.contentWindow) {
            const signalData = {
              symbol: signal.pair,
              type: signal.direction,
              entryPrice: signal.entryPrice.toString(),
            };
            (aiCoachRef.current.contentWindow as any).receiveSignal(signalData);
          }
        }, 100);
      }
    }
  };

  const handleAddToJournal = (signal: Signal) => {
    console.log('Adding to journal:', signal);
    handleTabClick('journal');
  };

  const handleChatWithNexus = (signal: Signal) => {
    console.log('Chatting with Nexus about:', signal);
    handleTabClick('ai-coach');
    setTimeout(() => {
      if (aiCoachRef.current && aiCoachRef.current.contentWindow) {
        const signalData = {
          symbol: signal.pair,
          type: signal.direction,
          entryPrice: signal.entryPrice.toString(),
        };
        (aiCoachRef.current.contentWindow as any).receiveSignal(signalData);
      }
    }, 100);
  };

  return (
    <>
      <style>{`
        .concept1 {
            background: radial-gradient(ellipse at center, #0a0a1f 0%, #000000 100%);
            position: relative;
            overflow: hidden;
            width: 100%;
            height: 100vh;
            display: flex;
        }

        .neural-grid {
            position: absolute;
            width: 100%;
            height: 100%;
            background-image: 
                linear-gradient(rgba(0, 255, 255, 0.1) 1px, transparent 1px),
                linear-gradient(90deg, rgba(0, 255, 255, 0.1) 1px, transparent 1px);
            background-size: 50px 50px;
            animation: grid-move 20s linear infinite;
        }

        @keyframes grid-move {
            0% { transform: translate(0, 0); }
            100% { transform: translate(50px, 50px); }
        }

        .holo-sidebar {
            width: 250px;
            height: 100%;
            background: linear-gradient(135deg, rgba(0, 255, 255, 0.1), rgba(255, 0, 255, 0.1));
            backdrop-filter: blur(20px);
            border-right: 1px solid rgba(0, 255, 255, 0.3);
            z-index: 100;
            display: flex;
            flex-direction: column;
        }

        .holo-logo {
            padding: 30px;
            font-size: 24px;
            font-weight: bold;
            background: linear-gradient(45deg, #00ffff, #00ff88);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            text-align: center;
            text-shadow: 0 0 15px rgba(0, 255, 136, 0.5);
        }

        .holo-menu-item {
            padding: 20px 30px;
            cursor: pointer;
            position: relative;
            overflow: hidden;
            transition: all 0.3s;
            display: flex;
            align-items: center;
            gap: 15px;
        }

        .holo-menu-item.active {
            background: rgba(0, 255, 255, 0.1);
            border-left: 3px solid #00ffff;
            color: #00ffff;
        }

        .holo-menu-item:not(.active) {
            color: #fff;
        }

        .holo-menu-item::before {
            content: '';
            position: absolute;
            left: -100%;
            top: 0;
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, transparent, rgba(0, 255, 255, 0.3), transparent);
            transition: left 0.5s;
        }

        .holo-menu-item:hover::before {
            left: 100%;
        }

        .holo-main {
            flex: 1;
            padding: 40px;
            position: relative;
            height: 100vh;
            overflow-y: auto;
        }

        .holo-card {
            background: rgba(0, 20, 40, 0.6);
            border: 1px solid rgba(0, 255, 255, 0.3);
            border-radius: 20px;
            padding: 30px;
            margin-bottom: 30px;
            position: relative;
            backdrop-filter: blur(10px);
            animation: holo-float 6s ease-in-out infinite;
        }

        @keyframes holo-float {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-10px); }
        }

        .holo-stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 30px;
        }

        .holo-stat {
            text-align: center;
            padding: 20px;
            background: linear-gradient(135deg, rgba(0, 255, 255, 0.1), transparent);
            border-radius: 15px;
            border: 1px solid rgba(0, 255, 255, 0.2);
        }

        .holo-value {
            font-size: 32px;
            font-weight: bold;
            background: linear-gradient(45deg, #00ffff, #00ff88);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
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
      <div className="concept1">
        <div className="neural-grid"></div>
        <div className="holo-sidebar">
            <div className="holo-logo">TraderEdgePro</div>
            <nav className="flex-1 p-4 overflow-y-auto">
              <div className="space-y-2">
                {sidebarTabs.map((item) => (
                  <div 
                    key={item.id}
                    className={`holo-menu-item ${activeTab === item.id ? 'active' : ''}`} 
                    onClick={() => handleTabClick(item.id)}
                  >
                    {item.icon} <span>{item.label}</span>
                  </div>
                ))}
              </div>
            </nav>
            <div className="p-4 border-t border-gray-800 flex items-center justify-around">
              <button onClick={onLogout} className="text-gray-400 hover:text-white"><LogOut className="w-6 h-6" /></button>
            </div>
        </div>

        <div className="holo-main">
            <div className="container mx-auto">
              {activeTab === 'overview' && renderOverview()}
              {activeTab === 'signals' && <SignalsFeed onMarkAsTaken={handleMarkAsTaken} onAddToJournal={handleAddToJournal} onChatWithNexus={handleChatWithNexus} />}
              {activeTab === 'analytics' && <PerformanceAnalytics tradingState={tradingState} />}
              {activeTab === 'journal' && hasJournalAccess && <TradingJournalDashboard />}
              {activeTab === 'accounts' && hasProAccess && <MultiAccountTracker />}
              {activeTab === 'rules' && <PropFirmRules />}
              {activeTab === 'risk-protocol' && <RiskProtocol />}
              {activeTab === 'ai-coach' && (
                <iframe
                  ref={aiCoachRef}
                  src="/src/components/AICoach.html"
                  title="AI Coach"
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

export default Dashboard;
