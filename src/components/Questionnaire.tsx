import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CustomSelect from './CustomSelect';
import FuturisticBackground from './FuturisticBackground';
import { useTradingPlan } from '../contexts/TradingPlanContext';
import { useUser } from '../contexts/UserContext';

interface QuestionnaireAnswers {
  tradesPerDay: string;
  tradingSession: string;
  cryptoAssets: string[];
  forexAssets: string[];
  hasAccount: 'yes' | 'no';
  accountEquity: number | string;
  tradingExperience: 'beginner' | 'intermediate' | 'advanced';
}

const tradesPerDayOptions = [
  { value: '1-2', label: '1-2 (Recommended)' },
  { value: '3-5', label: '3-5' },
  { value: '6-10', label: '6-10' },
  { value: '10+', label: '10+' },
];

const tradingSessionOptions = [
  { value: 'asian', label: 'Asian Session (Tokyo)' },
  { value: 'european', label: 'European Session (London)' },
  { value: 'us', label: 'US Session (New York)' },
  { value: 'any', label: 'Any/All Sessions' },
];

const cryptoOptions = [
  "BTC", "ETH", "SOL", "XRP", "ADA", "DOGE", "AVAX", "DOT", "MATIC", "LTC",
  "SHIB", "TRX", "LINK", "BCH", "XLM", "ALGO", "ATOM", "VET", "FIL", "ICP"
];

const forexOptionsList = {
  "Commodities & Indices": ["XAU/USD", "XAG/USD", "USOIL", "US30", "US100"],
  Majors: ["EURUSD", "GBPUSD", "USDJPY", "USDCAD", "AUDUSD", "USDCHF", "NZDUSD"],
  Minors: ["EURGBP", "EURJPY", "GBPJPY", "AUDJPY", "CADJPY", "CHFJPY", "NZDJPY", "EURAUD", "GBPAUD"],
  Exotics: ["USDTRY", "USDZAR", "USDMXN", "USDNOK", "USDSEK", "USDSGD", "USDHKD"]
};

const allCryptoOptions = cryptoOptions.map(c => ({ value: c, label: c }));
const allForexOptions = () => {
  const options = Object.entries(forexOptionsList).map(([group, pairs]) => ({
    label: group,
    options: pairs.map(p => ({ value: p, label: p }))
  }));
  const savedPairs = localStorage.getItem('customForexPairs');
  const customPairs = savedPairs ? JSON.parse(savedPairs) : [];
  if (customPairs.length > 0) {
    options.push({
      label: 'Custom',
      options: customPairs.map((p: string) => ({ value: p, label: p }))
    });
  }
  return options;
};

const Questionnaire: React.FC = () => {
  const [answers, setAnswers] = useState<QuestionnaireAnswers>({
    tradesPerDay: '1-2',
    tradingSession: 'any',
    cryptoAssets: [],
    forexAssets: [],
    hasAccount: 'no',
    accountEquity: '',
    tradingExperience: 'beginner',
  });
  const [customPair, setCustomPair] = useState('');
  const [customPairs, setCustomPairs] = useState<string[]>(() => {
    const savedPairs = localStorage.getItem('customForexPairs');
    return savedPairs ? JSON.parse(savedPairs) : [];
  });
  const navigate = useNavigate();
  const { updateTradingPlan } = useTradingPlan();
  const { user, setUser } = useUser();

  const handleSubmit = () => {
    localStorage.setItem('questionnaireAnswers', JSON.stringify(answers));
    console.log('User Answers:', answers);

    const newTradingPlan = {
      userProfile: {
        initialBalance: Number(answers.accountEquity) || 100000, // Default to 100k if not provided
        accountEquity: Number(answers.accountEquity) || 100000,
        tradesPerDay: answers.tradesPerDay,
        tradingSession: answers.tradingSession,
        cryptoAssets: answers.cryptoAssets,
        forexAssets: answers.forexAssets,
        hasAccount: answers.hasAccount,
        experience: answers.tradingExperience,
      },
      riskParameters: {
        maxDailyRisk: 0,
        maxDailyRiskPct: '',
        baseTradeRisk: 0,
        baseTradeRiskPct: '',
        minRiskReward: '',
      },
      trades: [],
      propFirmCompliance: {
        dailyLossLimit: '',
        totalDrawdownLimit: '',
        profitTarget: '',
        consistencyRule: '',
      },
    };

    updateTradingPlan(newTradingPlan);
    if (user) {
      const updatedUser = { ...user, setupComplete: true };
      setUser(updatedUser);
    }
    navigate('/risk-management');
  };

  return (
    <div className="min-h-screen text-white flex items-center justify-center p-4 relative">
      <FuturisticBackground />
      <div className="relative bg-transparent p-8 rounded-2xl w-full max-w-3xl z-10">
        <div className="relative z-10">
          <h2 className="text-3xl font-bold mb-6 text-center text-blue-400">Trading Preferences</h2>
        <p className="mb-8 text-center text-gray-400">Help us tailor your experience by answering a few questions.</p>

        <div className="space-y-6">
          <div>
            <label className="block mb-2 text-lg font-semibold text-gray-300">How many trades do you take per day?</label>
            <CustomSelect
              options={tradesPerDayOptions}
              value={answers.tradesPerDay}
              onChange={(value) => setAnswers({ ...answers, tradesPerDay: value as string })}
            />
            <p className="text-xs text-gray-400 mt-1">Note: You can change this in your settings once per week.</p>
          </div>

          <div>
            <label className="block mb-2 text-lg font-semibold text-gray-300">What is your trading experience?</label>
            <CustomSelect
              options={[
                { value: 'beginner', label: 'Beginner (Less than 1 year)' },
                { value: 'intermediate', label: 'Intermediate (1-3 years)' },
                { value: 'advanced', label: 'Advanced (3+ years)' },
              ]}
              value={answers.tradingExperience}
              onChange={(value) => setAnswers({ ...answers, tradingExperience: value as 'beginner' | 'intermediate' | 'advanced' })}
            />
          </div>

          <div>
            <label className="block mb-2 text-lg font-semibold text-gray-300">Do you have an account already?</label>
            <CustomSelect
              options={[{ value: 'no', label: 'No' }, { value: 'yes', label: 'Yes' }]}
              value={answers.hasAccount}
              onChange={(value) => setAnswers({ ...answers, hasAccount: value as 'yes' | 'no' })}
            />
          </div>

          {answers.hasAccount === 'yes' && (
            <div>
              <label className="block mb-2 text-lg font-semibold text-gray-300">Current equity of that account</label>
              <input
                type="number"
                value={answers.accountEquity}
                onChange={(e) => setAnswers({ ...answers, accountEquity: e.target.value })}
                className="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                placeholder="Enter your account equity"
              />
            </div>
          )}

          <div>
            <label className="block mb-2 text-lg font-semibold text-gray-300">Which trading session suits you best?</label>
            <CustomSelect
              options={tradingSessionOptions}
              value={answers.tradingSession}
              onChange={(value) => setAnswers({ ...answers, tradingSession: value as string })}
            />
          </div>

          <div>
            <label className="block mb-2 text-lg font-semibold text-gray-300">Which crypto assets do you trade?</label>
            <CustomSelect
              options={allCryptoOptions}
              value={answers.cryptoAssets}
              onChange={(value) => setAnswers({ ...answers, cryptoAssets: value as string[] })}
              multiple
              placeholder="Select crypto assets..."
            />
            <button
              onClick={() => setAnswers({ ...answers, cryptoAssets: cryptoOptions })}
              className="text-xs text-blue-400 mt-1 hover:underline"
            >
              Select All
            </button>
          </div>

          <div>
            <label className="block mb-2 text-lg font-semibold text-gray-300">Which forex pairs do you trade?</label>
            <CustomSelect
              options={allForexOptions()}
              value={answers.forexAssets}
              onChange={(value) => setAnswers({ ...answers, forexAssets: value as string[] })}
              multiple
              placeholder="Select forex pairs..."
            />
            <button
              onClick={() => setAnswers({ ...answers, forexAssets: Object.values(forexOptionsList).flat().concat(customPairs) })}
              className="text-xs text-blue-400 mt-1 hover:underline"
            >
              Select All
            </button>
            <div className="mt-2">
              <p className="text-xs text-gray-400">Your pair not here? Add it below:</p>
              <div className="flex items-center mt-1">
                <input
                  type="text"
                  value={customPair}
                  onChange={(e) => setCustomPair(e.target.value.toUpperCase())}
                  placeholder="e.g., EURNOK"
                  className="w-full p-2 bg-gray-700 border border-gray-600 rounded-l-lg text-white"
                />
                <button
                  onClick={() => {
                    if (customPair && !customPairs.includes(customPair)) {
                      const newCustomPairs = [...customPairs, customPair];
                      setCustomPairs(newCustomPairs);
                      localStorage.setItem('customForexPairs', JSON.stringify(newCustomPairs));
                      setCustomPair('');
                    }
                  }}
                  className="p-2 bg-blue-600 rounded-r-lg hover:bg-blue-700"
                >
                  Add
                </button>
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={handleSubmit}
          className="w-full mt-8 p-4 bg-blue-600 rounded-lg hover:bg-blue-700 transition-all duration-300 text-lg font-semibold shadow-lg hover:shadow-blue-500/50"
        >
          Save Preferences & Continue
        </button>
        </div>
      </div>
    </div>
  );
};

export default Questionnaire;
