import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { TrendingUp, ArrowLeft, Eye, EyeOff, AlertCircle, CheckCircle, User, Mail, Lock } from 'lucide-react';
import { useUser } from '../contexts/UserContext';
import { useTradingPlan } from '../contexts/TradingPlanContext';
import { propFirms } from '../data/propFirms';
import Header from './Header';

const SignUp = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { setUser } = useUser();
  const { updateTradingPlan, updatePropFirm, updateAccountConfig, updateRiskConfig } = useTradingPlan();
  
  // Get selected plan from location state or default
  const selectedPlan = location.state?.selectedPlan || {
    name: 'Professional',
    price: 99,
    period: 'month'
  };

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    // Trading questionnaire data
    propFirm: '',
    accountType: '',
    accountSize: '',
    riskPerTrade: '1',
    riskRewardRatio: '2',
    tradesPerDay: '1-2',
    tradingExperience: 'beginner',
    tradingSession: 'any',
    cryptoAssets: [] as string[],
    forexAssets: [] as string[],
    hasAccount: 'no'
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  const propFirmOptions = propFirms.map(firm => ({ value: firm.name, label: firm.name }));
  const cryptoOptions = ["BTC", "ETH", "SOL", "XRP", "ADA", "DOGE", "AVAX", "DOT", "MATIC", "LTC"];
  const forexOptions = ["EURUSD", "GBPUSD", "USDJPY", "USDCAD", "AUDUSD", "USDCHF", "NZDUSD", "XAUUSD"];

  const validateForm = () => {
    if (!formData.firstName.trim()) {
      return 'First name is required';
    }
    if (!formData.lastName.trim()) {
      return 'Last name is required';
    }
    if (!formData.email || !formData.email.includes('@')) {
      return 'Please enter a valid email address';
    }
    if (formData.password.length < 8) {
      return 'Password must be at least 8 characters long';
    }
    if (formData.password !== formData.confirmPassword) {
      return 'Passwords do not match';
    }
    if (!agreedToTerms) {
      return 'Please agree to the Terms of Service and Privacy Policy';
    }
    
    // Validate trading questionnaire data
    if (currentStep === 2) {
      if (!formData.propFirm) return 'Please select a prop firm';
      if (!formData.accountType) return 'Please select an account type';
      if (!formData.accountSize) return 'Please enter account size';
    }
    
    return null;
  };

  const generateTradingPlan = () => {
    const selectedPropFirm = propFirms.find(f => f.name === formData.propFirm);
    if (!selectedPropFirm) return null;

    const accountEquity = parseFloat(formData.accountSize) || 10000;
    const riskPerTrade = parseFloat(formData.riskPerTrade);
    const riskRewardRatio = parseFloat(formData.riskRewardRatio);
    
    // Calculate risk parameters
    const maxDailyRisk = accountEquity * 0.05; // 5% max daily risk
    const baseTradeRisk = accountEquity * (riskPerTrade / 100);
    
    // Generate trades based on user preferences
    const numTrades = formData.tradesPerDay === '1-2' ? 2 : 
                     formData.tradesPerDay === '3-5' ? 4 : 3;
    
    const trades = Array.from({ length: numTrades }, (_, i) => ({
      trade: `trade-${i + 1}`,
      asset: formData.forexAssets[i % formData.forexAssets.length] || 'EURUSD',
      lossLimit: baseTradeRisk,
      profitTarget: baseTradeRisk * riskRewardRatio,
      riskRewardRatio: `1:${riskRewardRatio}`
    }));

    const tradingPlan = {
      userProfile: {
        initialBalance: accountEquity,
        accountEquity,
        tradesPerDay: formData.tradesPerDay,
        tradingSession: formData.tradingSession,
        cryptoAssets: formData.cryptoAssets,
        forexAssets: formData.forexAssets,
        hasAccount: formData.hasAccount,
        experience: formData.tradingExperience,
      },
      riskParameters: {
        maxDailyRisk,
        maxDailyRiskPct: '5%',
        baseTradeRisk,
        baseTradeRiskPct: `${riskPerTrade}%`,
        minRiskReward: `1:${riskRewardRatio}`
      },
      trades,
      propFirmCompliance: {
        dailyLossLimit: selectedPropFirm.dailyLossLimit,
        totalDrawdownLimit: selectedPropFirm.maximumLoss,
        profitTarget: selectedPropFirm.profitTargets,
        consistencyRule: "Maintain steady performance"
      }
    };

    return { tradingPlan, selectedPropFirm };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    if (currentStep === 1) {
      setCurrentStep(2);
      return;
    }

    setIsLoading(true);

    try {
      // Generate trading plan from questionnaire data
      const planData = generateTradingPlan();
      if (!planData) {
        throw new Error('Failed to generate trading plan');
      }

      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          password: formData.password,
          plan_type: selectedPlan.name.toLowerCase(),
          // Include trading questionnaire data
          tradingData: {
            propFirm: formData.propFirm,
            accountType: formData.accountType,
            accountSize: formData.accountSize,
            riskPerTrade: formData.riskPerTrade,
            riskRewardRatio: formData.riskRewardRatio,
            tradesPerDay: formData.tradesPerDay,
            tradingExperience: formData.tradingExperience,
            tradingSession: formData.tradingSession,
            cryptoAssets: formData.cryptoAssets,
            forexAssets: formData.forexAssets,
            hasAccount: formData.hasAccount
          }
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.msg || 'Failed to create account');
      }

      const data = await response.json();
      localStorage.setItem('access_token', data.access_token);

      // Store trading plan and prop firm data
      // Store trading plan data in localStorage for persistence
      localStorage.setItem(`trading_plan_${formData.email}`, JSON.stringify(planData.tradingPlan));
      localStorage.setItem(`prop_firm_${formData.email}`, JSON.stringify(planData.selectedPropFirm));
      localStorage.setItem(`account_config_${formData.email}`, JSON.stringify({ 
        size: parseFloat(formData.accountSize), 
        challengeType: formData.accountType 
      }));
      localStorage.setItem(`risk_config_${formData.email}`, JSON.stringify({
        riskPercentage: parseFloat(formData.riskPerTrade),
        riskRewardRatio: parseFloat(formData.riskRewardRatio),
        tradingExperience: formData.tradingExperience
      }));

      const userData = {
        id: `user_${Date.now()}`,
        name: `${formData.firstName} ${formData.lastName}`,
        email: formData.email,
        membershipTier: selectedPlan.name.toLowerCase(),
        accountType: 'personal' as const,
        riskTolerance: 'moderate' as const,
        isAuthenticated: true,
        setupComplete: true, // Setup is complete after questionnaire
        selectedPlan,
        token: data.access_token,
        tradingData: {
          propFirm: formData.propFirm,
          accountType: formData.accountType,
          accountSize: formData.accountSize,
          riskPerTrade: formData.riskPerTrade,
          riskRewardRatio: formData.riskRewardRatio,
          tradesPerDay: formData.tradesPerDay,
          tradingExperience: formData.tradingExperience,
          tradingSession: formData.tradingSession,
          cryptoAssets: formData.cryptoAssets,
          forexAssets: formData.forexAssets,
          hasAccount: formData.hasAccount
        }
      };

      // Use the login function to properly set user data
      login(userData, data.access_token);
      localStorage.setItem('user_data', JSON.stringify(userData));

      // Also store in registered users list for admin dashboard
      const existingUsers = JSON.parse(localStorage.getItem('registered_users') || '[]');
      existingUsers.push(userData);
      localStorage.setItem('registered_users', JSON.stringify(existingUsers));

      // Dispatch event to notify admin dashboard
      window.dispatchEvent(new CustomEvent('userRegistered', { detail: userData }));

      // Navigate directly to dashboard since setup is complete
      navigate('/dashboard');
    } catch (err) {
      console.error('Signup error:', err);
      // For demo purposes, allow signup to proceed even if backend fails
      const planData = generateTradingPlan();
      if (planData) {
        const userData = {
          id: `user_${Date.now()}`,
          name: `${formData.firstName} ${formData.lastName}`,
          email: formData.email,
          membershipTier: selectedPlan.name.toLowerCase() as any,
          accountType: 'personal' as const,
          riskTolerance: 'moderate' as const,
          isAuthenticated: true,
          setupComplete: true,
          selectedPlan,
          token: `demo-token-${Date.now()}`,
          tradingData: {
            propFirm: formData.propFirm,
            accountType: formData.accountType,
            accountSize: formData.accountSize,
            riskPerTrade: formData.riskPerTrade,
            riskRewardRatio: formData.riskRewardRatio,
            tradesPerDay: formData.tradesPerDay,
            tradingExperience: formData.tradingExperience,
            tradingSession: formData.tradingSession,
            cryptoAssets: formData.cryptoAssets,
            forexAssets: formData.forexAssets,
            hasAccount: formData.hasAccount
          }
        };
        
        // Store all data persistently
        localStorage.setItem(`trading_plan_${formData.email}`, JSON.stringify(planData.tradingPlan));
        localStorage.setItem(`prop_firm_${formData.email}`, JSON.stringify(planData.selectedPropFirm));
        localStorage.setItem(`user_data_${formData.email}`, JSON.stringify(userData));
        
        login(userData, userData.token);
        navigate('/dashboard');
      } else {
        setError('Failed to generate trading plan. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (error) setError(''); // Clear error when user starts typing
  };

  const getSelectedPropFirm = () => {
    return propFirms.find(f => f.name === formData.propFirm);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
      <Header />
      <div className="flex items-center justify-center px-4">
        <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <Link to="/membership" className="inline-flex items-center space-x-2 text-blue-400 hover:text-blue-300 mb-8">
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Plans</span>
          </Link>
          
          <div className="flex items-center justify-center space-x-2 mb-6">
            <TrendingUp className="w-8 h-8 text-blue-400" />
            <span className="text-2xl font-bold text-white">TraderEdge Pro</span>
          </div>

          <h2 className="text-3xl font-bold text-white mb-2">
            {currentStep === 1 ? 'Create Your Account' : 'Trading Setup'}
          </h2>
          <p className="text-gray-400">
            {currentStep === 1 ? 'Start your journey to funded trading success' : 'Configure your trading preferences'}
          </p>
          <div className="flex justify-center space-x-2 mt-4">
            <div className={`w-3 h-3 rounded-full ${currentStep >= 1 ? 'bg-blue-500' : 'bg-gray-600'}`}></div>
            <div className={`w-3 h-3 rounded-full ${currentStep >= 2 ? 'bg-blue-500' : 'bg-gray-600'}`}></div>
          </div>
        </div>

        {/* Selected Plan Summary */}
        <div className="bg-blue-600/20 border border-blue-600 rounded-xl p-4 mb-6">
          <div className="text-center">
            <div className="text-blue-400 font-semibold text-lg">{selectedPlan.name} Plan</div>
            <div className="text-white text-2xl font-bold">${selectedPlan.price}/{selectedPlan.period}</div>
            <div className="text-blue-300 text-sm">Professional trading guidance</div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-gray-800/60 backdrop-blur-sm p-8 rounded-2xl border border-gray-700">
          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-600/20 border border-red-600 rounded-lg flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-red-400" />
              <span className="text-red-400 text-sm">{error}</span>
            </div>
          )}

          {currentStep === 1 && (
            <div className="space-y-6">
            {/* Name Fields */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">First Name</label>
                <div className="relative">
                  <User className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="John"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Last Name</label>
                <div className="relative">
                  <User className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Doe"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="john@example.com"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  className="w-full pl-10 pr-12 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Create a strong password"
                  required
                  minLength={8}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              <div className="mt-2 text-xs text-gray-400">
                Password must be at least 8 characters long
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Confirm Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                  className="w-full pl-10 pr-12 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Confirm your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Terms Agreement */}
            <div className="flex items-start space-x-3">
              <input
                type="checkbox"
                id="terms"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                className="mt-1 rounded bg-gray-700 border-gray-600 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="terms" className="text-sm text-gray-300 leading-relaxed">
                I agree to the{' '}
                <a href="/terms-of-service" target="_blank" className="text-blue-400 hover:text-blue-300">Terms of Service</a>
                {' '}and{' '}
                <a href="/privacy-policy" target="_blank" className="text-blue-400 hover:text-blue-300">Privacy Policy</a>
              </label>
            </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-white mb-4">Trading Preferences</h3>
              
              {/* Prop Firm Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Select Prop Firm</label>
                <select
                  value={formData.propFirm}
                  onChange={(e) => {
                    handleInputChange('propFirm', e.target.value);
                    // Reset account type when prop firm changes
                    handleInputChange('accountType', '');
                  }}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select Prop Firm</option>
                  {propFirmOptions.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>

              {/* Account Type */}
              {formData.propFirm && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Account Type</label>
                  <select
                    value={formData.accountType}
                    onChange={(e) => handleInputChange('accountType', e.target.value)}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select Account Type</option>
                    {getSelectedPropFirm()?.accountTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Account Size */}
              {formData.accountType && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Account Size</label>
                  <select
                    value={formData.accountSize}
                    onChange={(e) => handleInputChange('accountSize', e.target.value)}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select Account Size</option>
                    {getSelectedPropFirm()?.accountSizes.map(size => (
                      <option key={size} value={size}>${size.toLocaleString()}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Risk Parameters */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Risk Per Trade (%)</label>
                  <select
                    value={formData.riskPerTrade}
                    onChange={(e) => handleInputChange('riskPerTrade', e.target.value)}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="0.5">0.5% (Conservative)</option>
                    <option value="1">1% (Recommended)</option>
                    <option value="1.5">1.5% (Moderate)</option>
                    <option value="2">2% (Aggressive)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Risk:Reward Ratio</label>
                  <select
                    value={formData.riskRewardRatio}
                    onChange={(e) => handleInputChange('riskRewardRatio', e.target.value)}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="1">1:1</option>
                    <option value="2">1:2 (Recommended)</option>
                    <option value="3">1:3</option>
                  </select>
                </div>
              </div>

              {/* Trading Preferences */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Trades Per Day</label>
                  <select
                    value={formData.tradesPerDay}
                    onChange={(e) => handleInputChange('tradesPerDay', e.target.value)}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="1-2">1-2 (Recommended)</option>
                    <option value="3-5">3-5</option>
                    <option value="6-10">6-10</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Experience Level</label>
                  <select
                    value={formData.tradingExperience}
                    onChange={(e) => handleInputChange('tradingExperience', e.target.value)}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>
              </div>

              {/* Trading Session */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Preferred Trading Session</label>
                <select
                  value={formData.tradingSession}
                  onChange={(e) => handleInputChange('tradingSession', e.target.value)}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
                >
                  <option value="any">Any Session</option>
                  <option value="asian">Asian Session</option>
                  <option value="european">European Session</option>
                  <option value="us">US Session</option>
                </select>
              </div>

              {/* Asset Preferences */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Preferred Forex Assets</label>
                <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                  {forexOptions.map(asset => (
                    <label key={asset} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={formData.forexAssets.includes(asset)}
                        onChange={(e) => {
                          const newAssets = e.target.checked
                            ? [...formData.forexAssets, asset]
                            : formData.forexAssets.filter(a => a !== asset);
                          handleInputChange('forexAssets', newAssets);
                        }}
                        className="rounded bg-gray-700 border-gray-600 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-white text-sm">{asset}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Crypto Assets */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Preferred Crypto Assets</label>
                <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                  {cryptoOptions.map(asset => (
                    <label key={asset} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={formData.cryptoAssets.includes(asset)}
                        onChange={(e) => {
                          const newAssets = e.target.checked
                            ? [...formData.cryptoAssets, asset]
                            : formData.cryptoAssets.filter(a => a !== asset);
                          handleInputChange('cryptoAssets', newAssets);
                        }}
                        className="rounded bg-gray-700 border-gray-600 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-white text-sm">{asset}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed text-white py-3 rounded-lg font-semibold transition-colors flex items-center justify-center"
            >
              {isLoading ? (
                <>
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  {currentStep === 1 ? 'Creating Account...' : 'Setting Up Dashboard...'}
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5 mr-2" />
                  {currentStep === 1 ? 'Continue to Trading Setup' : 'Complete Setup'}
                </>
              )}
            </button>
        </form>

        {/* Back button for step 2 */}
        {currentStep === 2 && (
          <div className="text-center mt-4">
            <button
              onClick={() => setCurrentStep(1)}
              className="text-gray-400 hover:text-blue-400 transition-colors text-sm"
            >
              ← Back to Account Details
            </button>
          </div>
        )}

        {/* Sign In Link */}
        <div className="text-center mt-6">
          <p className="text-gray-400">
            Already have an account?{' '}
            <Link 
              to="/signin" 
              state={{ selectedPlan }}
              className="text-blue-400 hover:text-blue-300 font-semibold"
            >
              Sign in here
            </Link>
          </p>
        </div>

        {/* Security Notice */}
        <div className="mt-6 p-4 bg-gray-800/40 rounded-lg border border-gray-700">
          <div className="text-center text-xs text-gray-400">
            <p>🔒 Your data is encrypted and secure</p>
            <p>30-day money-back guarantee • Cancel anytime</p>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
};

export default SignUp;