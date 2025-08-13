import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Calculator, History, DollarSign, Target, AlertTriangle } from 'lucide-react';

interface BacktestTrade {
  id: string;
  symbol: string;
  direction: 'BUY' | 'SELL';
  entryPrice: number;
  stopLoss: number;
  targetPrice: number;
  lotSize: number;
  profitLoss: number;
  timestamp: Date;
  riskReward: number;
  pips: number;
}

const QuantumBacktester: React.FC = () => {
  const [tradeData, setTradeData] = useState({
    symbol: 'EURUSD',
    direction: 'BUY' as 'BUY' | 'SELL',
    entryPrice: '',
    stopLoss: '',
    targetPrice: '',
    lotSize: '0.1'
  });
  
  const [calculation, setCalculation] = useState({
    riskAmount: 0,
    rewardAmount: 0,
    riskReward: 0,
    pips: 0,
    profitLoss: 0
  });
  
  const [backtestHistory, setBacktestHistory] = useState<BacktestTrade[]>([]);
  const [showCalculation, setShowCalculation] = useState(false);

  // Load backtest history from localStorage
  useEffect(() => {
    const savedHistory = localStorage.getItem('backtest_history');
    if (savedHistory) {
      const parsed = JSON.parse(savedHistory).map((trade: any) => ({
        ...trade,
        timestamp: new Date(trade.timestamp)
      }));
      setBacktestHistory(parsed);
    }
  }, []);

  // Save backtest history to localStorage
  useEffect(() => {
    localStorage.setItem('backtest_history', JSON.stringify(backtestHistory));
  }, [backtestHistory]);

  // Calculate trade metrics whenever inputs change
  useEffect(() => {
    const entry = parseFloat(tradeData.entryPrice);
    const sl = parseFloat(tradeData.stopLoss);
    const target = parseFloat(tradeData.targetPrice);
    const lots = parseFloat(tradeData.lotSize);

    if (entry && sl && target && lots) {
      const pipSize = tradeData.symbol.includes('JPY') ? 0.01 : 0.0001;
      const pipValue = tradeData.symbol.includes('JPY') ? 9.09 : 10; // Approximate pip values
      
      let riskPips, rewardPips, profitLoss;
      
      if (tradeData.direction === 'BUY') {
        riskPips = (entry - sl) / pipSize;
        rewardPips = (target - entry) / pipSize;
        profitLoss = (target - entry) * lots * 100000; // Standard lot calculation
      } else {
        riskPips = (sl - entry) / pipSize;
        rewardPips = (entry - target) / pipSize;
        profitLoss = (entry - target) * lots * 100000;
      }
      
      const riskAmount = Math.abs(riskPips * pipValue * lots);
      const rewardAmount = Math.abs(rewardPips * pipValue * lots);
      const riskReward = riskPips > 0 ? rewardPips / riskPips : 0;
      
      setCalculation({
        riskAmount,
        rewardAmount,
        riskReward,
        pips: Math.abs(rewardPips),
        profitLoss
      });
      
      setShowCalculation(true);
    } else {
      setShowCalculation(false);
    }
  }, [tradeData]);

  const handleInputChange = (field: string, value: string) => {
    setTradeData(prev => ({ ...prev, [field]: value }));
  };

  const executeTrade = (outcome: 'WIN' | 'LOSS') => {
    if (!showCalculation) {
      alert('Please fill in all trade parameters');
      return;
    }

    const finalPnL = outcome === 'WIN' ? calculation.rewardAmount : -calculation.riskAmount;
    
    const newTrade: BacktestTrade = {
      id: Date.now().toString(),
      symbol: tradeData.symbol,
      direction: tradeData.direction,
      entryPrice: parseFloat(tradeData.entryPrice),
      stopLoss: parseFloat(tradeData.stopLoss),
      targetPrice: parseFloat(tradeData.targetPrice),
      lotSize: parseFloat(tradeData.lotSize),
      profitLoss: finalPnL,
      timestamp: new Date(),
      riskReward: calculation.riskReward,
      pips: calculation.pips
    };

    setBacktestHistory(prev => [newTrade, ...prev]);
    
    // Reset form
    setTradeData(prev => ({
      ...prev,
      entryPrice: '',
      stopLoss: '',
      targetPrice: ''
    }));
  };

  const clearHistory = () => {
    if (confirm('Are you sure you want to clear all backtest history?')) {
      setBacktestHistory([]);
    }
  };

  const totalTrades = backtestHistory.length;
  const winningTrades = backtestHistory.filter(t => t.profitLoss > 0).length;
  const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;
  const totalPnL = backtestHistory.reduce((sum, trade) => sum + trade.profitLoss, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-panel">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">Quantum Backtester</h2>
            <p className="text-gray-400">Test your trading strategies with precise calculations</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">{winRate.toFixed(1)}%</div>
              <div className="text-xs text-gray-400">Win Rate</div>
            </div>
            <div className="text-center">
              <div className={`text-2xl font-bold ${totalPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                ${totalPnL.toFixed(2)}
              </div>
              <div className="text-xs text-gray-400">Total P&L</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Trade Setup Panel */}
        <div className="glass-panel">
          <h3 className="text-xl font-semibold text-white mb-6 flex items-center">
            <Calculator className="w-5 h-5 mr-2 text-blue-400" />
            Trade Setup
          </h3>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Symbol</label>
                <select
                  value={tradeData.symbol}
                  onChange={(e) => handleInputChange('symbol', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800/70 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
                >
                  <option value="EURUSD">EUR/USD</option>
                  <option value="GBPUSD">GBP/USD</option>
                  <option value="USDJPY">USD/JPY</option>
                  <option value="XAUUSD">XAU/USD</option>
                  <option value="AUDUSD">AUD/USD</option>
                  <option value="USDCAD">USD/CAD</option>
                  <option value="NZDUSD">NZD/USD</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Direction</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleInputChange('direction', 'BUY')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      tradeData.direction === 'BUY'
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    <TrendingUp className="w-4 h-4 inline mr-1" />
                    BUY
                  </button>
                  <button
                    onClick={() => handleInputChange('direction', 'SELL')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      tradeData.direction === 'SELL'
                        ? 'bg-red-600 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    <TrendingDown className="w-4 h-4 inline mr-1" />
                    SELL
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Entry Price</label>
                <input
                  type="number"
                  step="0.00001"
                  value={tradeData.entryPrice}
                  onChange={(e) => handleInputChange('entryPrice', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800/70 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
                  placeholder="1.08500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Lot Size</label>
                <input
                  type="number"
                  step="0.01"
                  value={tradeData.lotSize}
                  onChange={(e) => handleInputChange('lotSize', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800/70 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-purple-500"
                  placeholder="0.1"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Stop Loss</label>
                <input
                  type="number"
                  step="0.00001"
                  value={tradeData.stopLoss}
                  onChange={(e) => handleInputChange('stopLoss', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800/70 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-red-500"
                  placeholder="1.08300"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Target Price</label>
                <input
                  type="number"
                  step="0.00001"
                  value={tradeData.targetPrice}
                  onChange={(e) => handleInputChange('targetPrice', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800/70 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-green-500"
                  placeholder="1.08700"
                />
              </div>
            </div>

            {/* Calculation Display */}
            {showCalculation && (
              <div className="bg-gray-800/50 rounded-xl p-4 border border-blue-500/30">
                <h4 className="text-white font-semibold mb-3 flex items-center">
                  <Target className="w-4 h-4 mr-2 text-blue-400" />
                  Trade Calculation
                </h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="bg-red-600/20 rounded-lg p-3">
                    <div className="text-red-400 font-medium">Risk Amount</div>
                    <div className="text-white text-lg font-bold">${calculation.riskAmount.toFixed(2)}</div>
                  </div>
                  <div className="bg-green-600/20 rounded-lg p-3">
                    <div className="text-green-400 font-medium">Reward Amount</div>
                    <div className="text-white text-lg font-bold">${calculation.rewardAmount.toFixed(2)}</div>
                  </div>
                  <div className="bg-blue-600/20 rounded-lg p-3">
                    <div className="text-blue-400 font-medium">Risk:Reward</div>
                    <div className="text-white text-lg font-bold">1:{calculation.riskReward.toFixed(2)}</div>
                  </div>
                  <div className="bg-purple-600/20 rounded-lg p-3">
                    <div className="text-purple-400 font-medium">Pips</div>
                    <div className="text-white text-lg font-bold">{calculation.pips.toFixed(1)}</div>
                  </div>
                </div>
              </div>
            )}

            {/* Execute Buttons */}
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => executeTrade('WIN')}
                disabled={!showCalculation}
                className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white py-3 rounded-lg font-semibold transition-colors flex items-center justify-center space-x-2"
              >
                <TrendingUp className="w-4 h-4" />
                <span>Execute WIN</span>
              </button>
              
              <button
                onClick={() => executeTrade('LOSS')}
                disabled={!showCalculation}
                className="bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white py-3 rounded-lg font-semibold transition-colors flex items-center justify-center space-x-2"
              >
                <TrendingDown className="w-4 h-4" />
                <span>Execute LOSS</span>
              </button>
            </div>
          </div>
        </div>

        {/* Statistics Panel */}
        <div className="glass-panel">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-white flex items-center">
              <History className="w-5 h-5 mr-2 text-purple-400" />
              Backtest Statistics
            </h3>
            {backtestHistory.length > 0 && (
              <button
                onClick={clearHistory}
                className="text-red-400 hover:text-red-300 text-sm"
              >
                Clear History
              </button>
            )}
          </div>
          
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-gray-800/50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-white">{totalTrades}</div>
              <div className="text-xs text-gray-400">Total Trades</div>
            </div>
            <div className="bg-gray-800/50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-blue-400">{winRate.toFixed(1)}%</div>
              <div className="text-xs text-gray-400">Win Rate</div>
            </div>
            <div className="bg-gray-800/50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-green-400">{winningTrades}</div>
              <div className="text-xs text-gray-400">Wins</div>
            </div>
            <div className="bg-gray-800/50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-red-400">{totalTrades - winningTrades}</div>
              <div className="text-xs text-gray-400">Losses</div>
            </div>
          </div>

          <div className="bg-gray-800/50 rounded-lg p-4">
            <div className="text-center">
              <div className={`text-3xl font-bold ${totalPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                ${totalPnL.toFixed(2)}
              </div>
              <div className="text-gray-400 text-sm">Net Profit/Loss</div>
            </div>
          </div>
        </div>
      </div>

      {/* Backtest History Chat */}
      <div className="glass-panel">
        <h3 className="text-xl font-semibold text-white mb-6 flex items-center">
          <History className="w-5 h-5 mr-2 text-cyan-400" />
          Backtest History ({backtestHistory.length} trades)
        </h3>
        
        <div className="space-y-3 max-h-96 overflow-y-auto futuristic-scrollbar">
          {backtestHistory.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <Calculator className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No backtest trades yet</p>
              <p className="text-sm mt-2 opacity-70">Execute trades above to see your backtest history</p>
            </div>
          ) : (
            backtestHistory.map(trade => (
              <div
                key={trade.id}
                className={`bg-gray-800/50 rounded-xl p-4 border-l-4 transition-all ${
                  trade.profitLoss > 0 ? 'border-green-400' : 'border-red-400'
                }`}
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="text-xl">
                      {trade.profitLoss > 0 ? '✅' : '❌'}
                    </div>
                    <div>
                      <div className={`text-lg font-bold ${
                        trade.profitLoss > 0 ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {trade.direction} {trade.symbol}
                      </div>
                      <div className="text-sm text-gray-400">
                        {trade.timestamp.toLocaleString()}
                      </div>
                    </div>
                  </div>
                  <div className={`text-right ${trade.profitLoss > 0 ? 'text-green-400' : 'text-red-400'}`}>
                    <div className="text-lg font-bold">
                      {trade.profitLoss > 0 ? '+' : ''}${trade.profitLoss.toFixed(2)}
                    </div>
                    <div className="text-xs text-gray-400">
                      {trade.pips.toFixed(1)} pips
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-3 text-xs">
                  <div className="bg-gray-700/50 rounded p-2 text-center">
                    <div className="text-gray-400">Entry</div>
                    <div className="text-white font-semibold">{trade.entryPrice}</div>
                  </div>
                  <div className="bg-gray-700/50 rounded p-2 text-center">
                    <div className="text-gray-400">Stop Loss</div>
                    <div className="text-red-400 font-semibold">{trade.stopLoss}</div>
                  </div>
                  <div className="bg-gray-700/50 rounded p-2 text-center">
                    <div className="text-gray-400">Target</div>
                    <div className="text-green-400 font-semibold">{trade.targetPrice}</div>
                  </div>
                  <div className="bg-gray-700/50 rounded p-2 text-center">
                    <div className="text-gray-400">Lot Size</div>
                    <div className="text-blue-400 font-semibold">{trade.lotSize}</div>
                  </div>
                </div>

                <div className="mt-3 text-xs text-gray-400">
                  Risk:Reward 1:{trade.riskReward.toFixed(2)} • 
                  {trade.profitLoss > 0 ? ' Target Hit' : ' Stop Loss Hit'}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default QuantumBacktester;