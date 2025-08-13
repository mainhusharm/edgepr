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
  const [marketStatus, setMarketStatus] = useState<any>(null);
  const [selectedTimezone, setSelectedTimezone] = useState('UTC');
  const [currentTime, setCurrentTime] = useState(new Date());

  // Check if user has given consent
  useEffect(() => {
    const consentGiven = localStorage.getItem('user_consent_accepted');
    if (!consentGiven && user?.isAuthenticated && user?.setupComplete) {
      setShowConsentForm(true);
    }
  }, [user]);

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Calculate market status based on timezone
  useEffect(() => {
    const calculateMarketStatus = () => {
      const now = new Date();
      const utcHour = now.getUTCHours();
      const dayOfWeek = now.getUTCDay();
      
      // Adjust for selected timezone
      const timezoneOffsets: { [key: string]: number } = {
        'UTC': 0,
        'UTC+5:30': 5.5,
        'UTC-5': -5,
        'UTC-8': -8,
        'UTC+1': 1,
        'UTC+9': 9,
        'UTC+10': 10
      };
      
      const offset = timezoneOffsets[selectedTimezone] || 0;
      const localHour = (utcHour + offset + 24) % 24;
      
      // Weekend check
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6 || (dayOfWeek === 5 && utcHour >= 22);
      
      let currentSession = 'Market Closed';
      let nextSession = 'Sydney';
      let timeUntilNext = '';
      let isOpen = false;
      
      if (!isWeekend) {
        // Sydney: 22:00 UTC - 07:00 UTC
        if (utcHour >= 22 || utcHour < 7) {
          currentSession = 'Sydney';
          nextSession = 'Tokyo';
          isOpen = true;
        }
        // Tokyo: 00:00 UTC - 09:00 UTC
        else if (utcHour >= 0 && utcHour < 9) {
          currentSession = 'Tokyo';
          nextSession = 'London';
          isOpen = true;
        }
        // London: 08:00 UTC - 17:00 UTC
        else if (utcHour >= 8 && utcHour < 17) {
          currentSession = 'London';
          nextSession = 'New York';
          isOpen = true;
        }
        // New York: 13:00 UTC - 22:00 UTC
        else if (utcHour >= 13 && utcHour < 22) {
          currentSession = 'New York';
          nextSession = 'Sydney';
          isOpen = true;
        }
      }
      
      // Calculate time until next session
      if (isWeekend) {
        const nextSunday = new Date(now);
        nextSunday.setUTCDate(now.getUTCDate() + (7 - dayOfWeek));
        nextSunday.setUTCHours(22, 0, 0, 0);
        const diff = nextSunday.getTime() - now.getTime();
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        timeUntilNext = `${hours}h ${minutes}m`;
      } else {
        // Calculate time to next session
        const sessionTimes = [22, 0, 8, 13]; // Sydney, Tokyo, London, NY
        const currentSessionIndex = sessionTimes.findIndex((time, index) => {
          const nextTime = sessionTimes[(index + 1) % sessionTimes.length];
          return time <= utcHour && utcHour < nextTime;
        });
        
        if (currentSessionIndex !== -1) {
          const nextSessionTime = sessionTimes[(currentSessionIndex + 1) % sessionTimes.length];
          let hoursUntilNext = nextSessionTime - utcHour;
          if (hoursUntilNext <= 0) hoursUntilNext += 24;
          timeUntilNext = `${hoursUntilNext}h 0m`;
        }
      }
      
      setMarketStatus({
        isOpen,
        currentSession,
        nextSession,
        timeUntilNext,
        localTime: now.toLocaleString('en-US', {
          timeZone: selectedTimezone === 'UTC+5:30' ? 'Asia/Kolkata' : 'UTC',
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        })
      });
    };
    
    calculateMarketStatus();
  }, [selectedTimezone, currentTime]);

  const handleConsentAccept = () => {
    localStorage.setItem('user_consent_accepted', 'true');
    setShowConsentForm(false);
  };

  const handleConsentDecline = () => {
    onLogout();
  };

  // Load trading plan and user data on component mount
  useEffect(() => {
    if (user?.email) {
      // Load user-specific data
      const userKey = `user_data_${user.email}`;
      const savedUserData = localStorage.getItem(userKey);
      
      if (savedUserData) {
        const userData = JSON.parse(savedUserData);
        // Update trading plan context with saved data
        if (userData.tradingPlan) {
          updateTradingPlan(userData.tradingPlan);
        }
        if (userData.propFirm) {
          updatePropFirm(userData.propFirm);
        }
        if (userData.accountConfig) {
          updateAccountConfig(userData.accountConfig);
        }
      }
    }
  }, [user?.email]);

  // Save user data whenever trading plan changes
  useEffect(() => {
    if (user?.email && tradingPlan) {
      const userKey = `user_data_${user.email}`;
      const userData = {
        tradingPlan,
        propFirm: propFirm,
        accountConfig: accountConfig,
        timestamp: new Date().toISOString()
      };
      localStorage.setItem(userKey, JSON.stringify(userData));
    }
  }, [user?.email, tradingPlan, propFirm, accountConfig]);

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

  useEffect(() => {
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
        // Load user-specific trading state
        const stateKey = `trading_state_${user.email}`;
        const localState = localStorage.getItem(stateKey);
        let loadedState = null;
        
        if (localState) {
          try {
            loadedState = JSON.parse(localState);
            // Convert date strings back to Date objects
            if (loadedState.trades) {
              loadedState.trades = loadedState.trades.map((trade: any) => ({
                ...trade,
                entryTime: new Date(trade.entryTime),
                closeTime: trade.closeTime ? new Date(trade.closeTime) : undefined
              }));
            }
          } catch (e) {
            console.error('Error parsing local state:', e);
          }
        }
        
        if (loadedState) {
          setTradingState(loadedState);
        } else {
          // Get initial balance from trading plan
          const initialEquity = tradingPlan.userProfile.accountEquity || 100000;
          
          const initialState: TradingState = {
            initialEquity,
            currentEquity: initialEquity,
            trades: [],
            openPositions: [],
            riskSettings: {
              riskPerTrade: parseFloat(tradingPlan.riskParameters?.baseTradeRiskPct?.replace('%', '') || '1'),
              dailyLossLimit: parseFloat(tradingPlan.riskParameters?.maxDailyRiskPct?.replace('%', '') || '5'),
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
          // Save initial state to localStorage
          localStorage.setItem(stateKey, JSON.stringify(initialState));
        }
      }
    };
    initState();
  }, [user?.email, tradingPlan, currentAccount]);

  // Save trading state to localStorage whenever it changes
  useEffect(() => {
    if (tradingState && user?.email) {
      const stateKey = `trading_state_${user.email}`;
      localStorage.setItem(stateKey, JSON.stringify(tradingState));
    }
  }, [tradingState, user?.email]);

  // Check if user needs to complete setup
  if (!user?.setupComplete) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center font-inter">
        <FuturisticBackground />
        <FuturisticCursor />
        <div className="relative z-10 text-center">
          <div className="text-blue-400 text-xl animate-pulse mb-4">Incomplete Setup</div>
          <p className="text-gray-400 mb-4">Please complete the signup process to access the dashboard.</p>
          <button
            onClick={() => navigate('/signup')}
            className="px-6 py-2 rounded-lg font-semibold bg-blue-600 hover:bg-blue-700 text-white transition-all"
          >
            Complete Setup
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

  // Initialize trading plan if not exists but user has trading data
  useEffect(() => {
    if (user?.tradingData && !tradingPlan) {
      const generatedPlan = {
        userProfile: {
          initialBalance: parseFloat(user.tradingData.accountSize) || 100000,
          accountEquity: parseFloat(user.tradingData.accountSize) || 100000,
          tradesPerDay: user.tradingData.tradesPerDay,
          tradingSession: user.tradingData.tradingSession,
          cryptoAssets: user.tradingData.cryptoAssets || [],
          forexAssets: user.tradingData.forexAssets || [],
          hasAccount: user.tradingData.hasAccount,
          experience: user.tradingData.tradingExperience,
        },
        riskParameters: {
          maxDailyRisk: (parseFloat(user.tradingData.accountSize) || 100000) * 0.05,
          maxDailyRiskPct: '5%',
          baseTradeRisk: (parseFloat(user.tradingData.accountSize) || 100000) * (parseFloat(user.tradingData.riskPerTrade) / 100),
          baseTradeRiskPct: `${user.tradingData.riskPerTrade}%`,
          minRiskReward: `1:${user.tradingData.riskRewardRatio}`
        },
        trades: [],
        propFirmCompliance: {
          dailyLossLimit: '5%',
          totalDrawdownLimit: '10%',
          profitTarget: '8%',
          consistencyRule: 'Maintain steady performance'
        }
      };
      updateTradingPlan(generatedPlan);
    }
  }, [user?.tradingData, tradingPlan, updateTradingPlan]);

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
      value: tradingState ? `$${tradingState.currentEquity.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : `$${tradingPlan.userProfile.accountEquity.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      change: 'Live Data',
      icon: <DollarSign className="w-8 h-8" />,
      color: 'green',
    },
    {
      label: 'Win Rate',
      value: tradingState ? `${tradingState.performanceMetrics.winRate.toFixed(1)}%` : '0%',
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
          : '$0.00',
      change: 'From Trades',
      icon: <Award className="w-8 h-8" />,
      color: tradingState && tradingState.performanceMetrics.totalPnl >= 0 ? 'green' : 'red',
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
            
            {/* Display questionnaire data */}
            {user.tradingData && (
              <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="bg-gray-800/50 rounded-lg p-3">
                  <span className="text-gray-400">Prop Firm:</span>
                  <span className="text-white ml-2 font-semibold">{user.tradingData.propFirm}</span>
                </div>
                <div className="bg-gray-800/50 rounded-lg p-3">
                  <span className="text-gray-400">Account Type:</span>
                  <span className="text-white ml-2 font-semibold">{user.tradingData.accountType}</span>
                </div>
                <div className="bg-gray-800/50 rounded-lg p-3">
                  <span className="text-gray-400">Account Size:</span>
                  <span className="text-white ml-2 font-semibold">
                    ${parseInt(user.tradingData.accountSize).toLocaleString()}
                  </span>
                </div>
                <div className="bg-gray-800/50 rounded-lg p-3">
                  <span className="text-gray-400">Experience:</span>
                  <span className="text-white ml-2 font-semibold capitalize">{user.tradingData.tradingExperience}</span>
                </div>
                <div className="bg-gray-800/50 rounded-lg p-3">
                  <span className="text-gray-400">Trades/Day:</span>
                  <span className="text-white ml-2 font-semibold">{user.tradingData.tradesPerDay}</span>
                </div>
                <div className="bg-gray-800/50 rounded-lg p-3">
                  <span className="text-gray-400">Risk/Trade:</span>
                  <span className="text-white ml-2 font-semibold">{user.tradingData.riskPerTrade}%</span>
                </div>
                <div className="bg-gray-800/50 rounded-lg p-3">
                  <span className="text-gray-400">Risk:Reward:</span>
                  <span className="text-white ml-2 font-semibold">1:{user.tradingData.riskRewardRatio}</span>
                </div>
                <div className="bg-gray-800/50 rounded-lg p-3">
                  <span className="text-gray-400">Session:</span>
                  <span className="text-white ml-2 font-semibold capitalize">{user.tradingData.tradingSession}</span>
                </div>
              </div>
            )}
          </div>
          <div className="text-right space-y-2">
            <div className="text-sm text-gray-400">Total P&L</div>
            <div className={`text-3xl font-bold ${tradingState && tradingState.performanceMetrics.totalPnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {tradingState
                ? `${tradingState.performanceMetrics.totalPnl >= 0 ? '+' : ''}$${tradingState.performanceMetrics.totalPnl.toFixed(2)}`
                : '$0'}
            </div>
            <div className="text-sm text-gray-400">Timezone</div>
            <select
              value={selectedTimezone}
              onChange={(e) => setSelectedTimezone(e.target.value)}
              className="bg-gray-800 text-white p-2 rounded border border-gray-600"
            >
              <option value="UTC">UTC (GMT+0)</option>
              <option value="UTC+5:30">UTC+5:30 (Kolkata)</option>
              <option value="UTC-5">UTC-5 (New York)</option>
              <option value="UTC-8">UTC-8 (Los Angeles)</option>
              <option value="UTC+1">UTC+1 (London)</option>
              <option value="UTC+9">UTC+9 (Tokyo)</option>
              <option value="UTC+10">UTC+10 (Sydney)</option>
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
          <h3 className="text-xl font-semibold text-white mb-6">Recent Trades</h3>
          {!tradingState || tradingState.trades.length === 0 ? (
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
              {tradingState.trades.slice(-5).reverse().map((trade, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-gray-900/50 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div
                      className={`w-3 h-3 rounded-full ${
                        (trade.pnl || 0) > 0 ? 'bg-green-400' : (trade.pnl || 0) < 0 ? 'bg-red-400' : 'bg-yellow-400'
                      }`}
                    ></div>
                    <div>
                      <div className="text-white font-medium">{trade.pair}</div>
                      <div className="text-sm text-gray-400">
                        {trade.outcome} • {new Date(trade.entryTime).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`font-medium ${(trade.pnl || 0) > 0 ? 'text-green-400' : (trade.pnl || 0) < 0 ? 'text-red-400' : 'text-yellow-400'}`}>
                      ${(trade.pnl || 0).toFixed(2)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="holo-card">
          <h3 className="text-lg font-semibold text-white mb-4">Market Status</h3>
          {marketStatus && (
            <div className="space-y-4">
              <div className="text-xs text-gray-400 mb-2">
                {marketStatus.localTime}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Forex Market</span>
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${marketStatus.isOpen ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`}></div>
                  <span className={`text-sm ${marketStatus.isOpen ? 'text-green-400' : 'text-red-400'}`}>
                    {marketStatus.isOpen ? 'Open' : 'Closed'}
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Current Session</span>
                <span className="text-white text-sm">{marketStatus.currentSession}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Next Session</span>
                <span className="text-white text-sm">{marketStatus.nextSession} ({marketStatus.timeUntilNext})</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
              <div className="bg-gray-800/50 rounded-lg p-3">
                <span className="text-gray-400">Prop Firm:</span>
                <span className="text-white ml-2 font-semibold">{user.tradingData?.propFirm || 'Not Set'}</span>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-3">
                <span className="text-gray-400">Account Type:</span>
                <span className="text-white ml-2 font-semibold">{user.tradingData?.accountType || 'Not Set'}</span>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-3">
                <span className="text-gray-400">Account Size:</span>
                <span className="text-white ml-2 font-semibold">
                  {user.tradingData?.accountSize ? `$${parseInt(user.tradingData.accountSize).toLocaleString()}` : 'Not Set'}
                </span>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-3">
                <span className="text-gray-400">Experience:</span>
                <span className="text-white ml-2 font-semibold capitalize">{user.tradingData?.tradingExperience || 'Not Set'}</span>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-3">
                <span className="text-gray-400">Trades/Day:</span>
                <span className="text-white ml-2 font-semibold">{user.tradingData?.tradesPerDay || 'Not Set'}</span>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-3">
                <span className="text-gray-400">Risk/Trade:</span>
                <span className="text-white ml-2 font-semibold">{user.tradingData?.riskPerTrade || 'Not Set'}%</span>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-3">
                <span className="text-gray-400">Risk:Reward:</span>
                <span className="text-white ml-2 font-semibold">1:{user.tradingData?.riskRewardRatio || 'Not Set'}</span>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-3">
                <span className="text-gray-400">Session:</span>
                <span className="text-white ml-2 font-semibold capitalize">{user.tradingData?.tradingSession || 'Not Set'}</span>
              </div>
            </div>
          </div>
          <div className="text-right space-y-2">
            <div className="text-sm text-gray-400">Timezone</div>
            <select
              value={selectedTimezone}
              onChange={(e) => setSelectedTimezone(e.target.value)}
              className="bg-gray-800 text-white p-2 rounded border border-gray-600"
            >
              <option value="UTC">UTC (GMT+0)</option>
              <option value="UTC+5:30">UTC+5:30 (Kolkata)</option>
              <option value="UTC-5">UTC-5 (New York)</option>
              <option value="UTC-8">UTC-8 (Los Angeles)</option>
              <option value="UTC+1">UTC+1 (London)</option>
              <option value="UTC+9">UTC+9 (Tokyo)</option>
              <option value="UTC+10">UTC+10 (Sydney)</option>
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
          <h3 className="text-xl font-semibold text-white mb-6">Recent Trades</h3>
          {!tradingState || tradingState.trades.length === 0 ? (
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
              {tradingState.trades.slice(-5).reverse().map((trade, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-gray-900/50 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div
                      className={`w-3 h-3 rounded-full ${
                        (trade.pnl || 0) > 0 ? 'bg-green-400' : (trade.pnl || 0) < 0 ? 'bg-red-400' : 'bg-yellow-400'
                      }`}
                    ></div>
                    <div>
                      <div className="text-white font-medium">{trade.pair}</div>
                      <div className="text-sm text-gray-400">
                        {trade.outcome} • {new Date(trade.entryTime).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`font-medium ${(trade.pnl || 0) > 0 ? 'text-green-400' : (trade.pnl || 0) < 0 ? 'text-red-400' : 'text-yellow-400'}`}>
                      ${(trade.pnl || 0).toFixed(2)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="holo-card">
          <h3 className="text-lg font-semibold text-white mb-4">Market Status</h3>
          {marketStatus && (
            <div className="space-y-4">
              <div className="text-xs text-gray-400 mb-2">
                {marketStatus.localTime}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Forex Market</span>
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${marketStatus.isOpen ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`}></div>
                  <span className={`text-sm ${marketStatus.isOpen ? 'text-green-400' : 'text-red-400'}`}>
                    {marketStatus.isOpen ? 'Open' : 'Closed'}
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Current Session</span>
                <span className="text-white text-sm">{marketStatus.currentSession}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Next Session</span>
                <span className="text-white text-sm">{marketStatus.nextSession} ({marketStatus.timeUntilNext})</span>
              </div>
            </div>
          )}
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
      
      // Save to localStorage immediately
      localStorage.setItem(`trading_state_${user.email}`, JSON.stringify(finalState));

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