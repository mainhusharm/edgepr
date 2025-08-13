import React, { useState, useEffect, useMemo } from 'react';
import { Signal, TradeOutcome } from '../trading/types';
import api from '../api';

interface SignalsFeedProps {
  onMarkAsTaken: (signal: Signal, outcome: TradeOutcome, pnl?: number) => void;
  onAddToJournal: (signal: Signal) => void;
  onChatWithNexus: (signal: Signal) => void;
}

const SignalsFeed: React.FC<SignalsFeedProps> = ({ onMarkAsTaken, onAddToJournal, onChatWithNexus }) => {
  const [signals, setSignals] = useState<Signal[]>([]);
  const [winningTrades, setWinningTrades] = useState<Signal[]>([]);
  const [losingTrades, setLosingTrades] = useState<Signal[]>([]);
  const [skippedTrades, setSkippedTrades] = useState<Signal[]>([]);
  const [activeTab, setActiveTab] = useState('active');
  const [showOutcomeModal, setShowOutcomeModal] = useState(false);
  const [selectedSignal, setSelectedSignal] = useState<Signal | null>(null);
  const [manualPnl, setManualPnl] = useState('');
  const [takenSignalIds, setTakenSignalIds] = useState<string[]>([]);
  const [skippedSignalIds, setSkippedSignalIds] = useState<string[]>([]);
  const [dailyLossLimitHit, setDailyLossLimitHit] = useState(false);

  useEffect(() => {
    const loadSignals = () => {
      try {
        // Only load signals from admin dashboard - no prefilled signals
        const adminSignals = JSON.parse(localStorage.getItem('telegram_messages') || '[]');
        
        // Only show signals if they exist from admin
        if (adminSignals.length === 0) {
          setSignals([]);
          return;
        }

        // Convert admin messages to Signal format
        const convertedSignals: Signal[] = adminSignals.map((msg: any) => {
          const lines = msg.text.split('\n');
          const pair = lines[0] || 'UNKNOWN';
          const direction = lines[1]?.includes('BUY') ? 'LONG' : lines[1]?.includes('SELL') ? 'SHORT' : 'LONG';
          
          // Extract prices from text
          const entryMatch = msg.text.match(/Entry\s+([0-9.]+)/i);
          const slMatch = msg.text.match(/Stop Loss\s+([0-9.]+)/i);
          const tpMatch = msg.text.match(/Take Profit\s+([0-9.,\s]+)/i);
          const confidenceMatch = msg.text.match(/Confidence\s+([0-9]+)%/i);
          
          const entryPrice = entryMatch ? parseFloat(entryMatch[1]) : 0;
          const stopLoss = slMatch ? parseFloat(slMatch[1]) : 0;
          const takeProfit = tpMatch ? parseFloat(tpMatch[1].split(',')[0]) : 0;
          const confidence = confidenceMatch ? parseInt(confidenceMatch[1]) : 0;
          
          return {
            id: msg.id.toString(),
            pair,
            direction,
            entryPrice,
            stopLoss,
            takeProfit,
            confidence,
            riskRewardRatio: '1:2',
            timestamp: msg.timestamp,
            description: msg.text.split('\n\n')[1] || 'Professional trading signal',
            market: 'forex',
            status: 'active'
          };
        });
        
        setSignals(convertedSignals);
      } catch (error) {
        console.error('Error fetching signals:', error);
        setSignals([]);
      }
    };

    loadSignals();
    
    // Listen for new signals from admin
    const handleNewSignal = () => {
      loadSignals();
    };
    
    window.addEventListener('newSignalSent', handleNewSignal);
    window.addEventListener('newSignalGenerated', handleNewSignal);
    
    const interval = setInterval(loadSignals, 5000); // Refresh every 5 seconds

    return () => {
      clearInterval(interval);
      window.removeEventListener('newSignalSent', handleNewSignal);
      window.removeEventListener('newSignalGenerated', handleNewSignal);
    };
  }, []);

  const handleMarkAsTakenClick = (signal: Signal) => {
    setTakenSignalIds(prev => [...prev, signal.id]);
    setSelectedSignal(signal);
    setShowOutcomeModal(true);
  };

  const handleSkipTrade = (signal: Signal) => {
    setSkippedTrades(prev => [...prev, signal]);
    setSkippedSignalIds(prev => [...prev, signal.id]);
  };

  const handleAddToJournalClick = () => {
    if (selectedSignal) {
      onAddToJournal(selectedSignal);
      setShowOutcomeModal(false);
      setSelectedSignal(null);
    }
  };

  const handleChatWithNexusClick = () => {
    if (selectedSignal) {
      onChatWithNexus(selectedSignal);
      setShowOutcomeModal(false);
      setSelectedSignal(null);
    }
  };

  const handleOutcomeSelection = (outcome: TradeOutcome) => {
    if (selectedSignal) {
      if (outcome === 'Target Hit') {
        setWinningTrades(prev => [...prev, selectedSignal]);
      } else if (outcome === 'Stop Loss Hit') {
        const newLosingTrades = [...losingTrades, selectedSignal];
        setLosingTrades(newLosingTrades);
      }
      
      if (outcome === 'Manual Close') {
        const pnl = parseFloat(manualPnl);
        if (!isNaN(pnl)) {
          onMarkAsTaken(selectedSignal, outcome, pnl);
        }
      } else {
        onMarkAsTaken(selectedSignal, outcome);
      }
      
      // Remove signal from active signals
      const updatedMessages = JSON.parse(localStorage.getItem('telegram_messages') || '[]')
        .filter((msg: any) => msg.id.toString() !== selectedSignal.id);
      localStorage.setItem('telegram_messages', JSON.stringify(updatedMessages));
      
      setSignals(prevSignals => prevSignals.filter(s => s.id !== selectedSignal.id));
    }
    setShowOutcomeModal(false);
    setSelectedSignal(null);
    setManualPnl('');
  };

  const renderSignals = (signalsToRender: Signal[], type: 'winning' | 'losing' | 'active' | 'skipped') => {
    let cardClass = '';
    if (type === 'winning') {
      cardClass = 'winning-trade';
    } else if (type === 'losing') {
      cardClass = 'losing-trade';
    } else if (type === 'skipped') {
      cardClass = 'skipped-trade';
    }

    return signalsToRender.map(signal => {
      const isTaken = takenSignalIds.includes(signal.id);
      const isSkipped = skippedSignalIds.includes(signal.id);
      const pipsAtRisk = Math.abs(signal.entryPrice - signal.stopLoss);
      const lotSize = pipsAtRisk > 0 ? (questionnaireData.accountBalance * (questionnaireData.riskPercentage / 100)) / pipsAtRisk : 0;
      const cardClasses = [
        'signal-card',
        cardClass,
        isTaken ? 'taken-trade' : '',
        isSkipped ? 'skipped-trade' : '',
        dailyLossLimitHit ? 'limit-hit' : ''
      ].join(' ');

      return (
        <div key={signal.id} className={cardClasses}>
          <div>
            <div className="signal-header">
              <span className="signal-pair">{signal.pair}</span>
              <span className={`signal-type ${signal.direction.toLowerCase()}`}>{signal.direction}</span>
              <span style={{ color: 'var(--primary-green)', fontWeight: 600 }}>{signal.confidence}% Confidence</span>
              {signal.status && <span className={`signal-status ${signal.status.toLowerCase().replace(' ', '-')}`}>{signal.status}</span>}
            </div>
            {isSkipped ? (
              <div className="skipped-message">
                <div className="text-2xl font-bold text-gray-400">Trade Skipped</div>
                <div className="text-sm text-gray-500">This trade can no longer be taken.</div>
              </div>
            ) : (
              <div className="signal-details">
                <div className="signal-detail">
                  <span className="detail-label">Entry</span>
                  <span className="detail-value entry">{signal.entryPrice}</span>
                </div>
                <div className="signal-detail">
                  <span className="detail-label">Stop Loss</span>
                  <span className="detail-value sl">{signal.stopLoss}</span>
                </div>
                <div className="signal-detail">
                  <span className="detail-label">Take Profit</span>
                  <span className="detail-value tp">{signal.takeProfit}</span>
                </div>
                <div className="signal-detail">
                  <span className="detail-label">R:R Ratio</span>
                  <span className="detail-value" style={{ color: 'var(--primary-cyan)' }}>{signal.riskRewardRatio}</span>
                </div>
                <div className="signal-detail">
                  <span className="detail-label">Lot Size</span>
                  <span className="detail-value" style={{ color: 'var(--primary-purple)' }}>{lotSize.toFixed(2)}</span>
                </div>
              </div>
            )}
            <div className="signal-footer">
              <p className="signal-description">{signal.description}</p>
              <span className="signal-time">{new Date(signal.timestamp).toLocaleString()}</span>
            </div>
          </div>
          {type === 'active' && !isSkipped && (
            <div className="flex flex-col space-y-2">
              <button className="action-btn" onClick={() => handleMarkAsTakenClick(signal)} disabled={isTaken || dailyLossLimitHit}>
                {isTaken ? 'Taken' : 'Mark as Taken'}
              </button>
              <button className="action-btn" style={{ background: 'var(--warning-yellow)'}} onClick={() => handleSkipTrade(signal)} disabled={isTaken || dailyLossLimitHit}>
                Skip Trade
              </button>
            </div>
          )}
        </div>
      );
    });
  };

  return (
    <>
      <style>{`
        :root {
            --primary-cyan: #00ffff;
            --primary-green: #00ff88;
            --primary-purple: #8b5cf6;
            --primary-pink: #ec4899;
            --danger-red: #ff4444;
            --warning-yellow: #ffaa00;
            --bg-dark: #0a0a0f;
            --bg-panel: rgba(15, 15, 35, 0.6);
            --border-glow: rgba(0, 255, 136, 0.3);
        }
        .page-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 30px;
            padding: 20px;
            background: var(--bg-panel);
            backdrop-filter: blur(20px);
            border-radius: 20px;
            border: 1px solid var(--border-glow);
        }
        .page-title {
            font-size: 32px;
            font-weight: bold;
            background: linear-gradient(135deg, var(--primary-cyan), var(--primary-green));
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }
        .page-subtitle {
            color: rgba(255, 255, 255, 0.6);
            margin-top: 5px;
        }
        .filters-bar {
            display: flex;
            gap: 10px;
            margin-bottom: 30px;
            flex-wrap: wrap;
        }
        .tab-btn {
            padding: 12px 24px;
            background: transparent;
            border: 1px solid var(--border-glow);
            color: white;
            border-radius: 12px;
            outline: none;
            cursor: pointer;
            transition: all 0.3s;
        }
        .tab-btn.active {
            background: var(--primary-green);
            color: var(--bg-dark);
            box-shadow: 0 0 20px rgba(0, 255, 136, 0.3);
        }
        .glass-panel {
            background: var(--bg-panel);
            backdrop-filter: blur(20px);
            border: 1px solid var(--border-glow);
            border-radius: 20px;
            padding: 25px;
            margin-bottom: 25px;
            position: relative;
            overflow: hidden;
            transition: all 0.3s;
        }
        .signals-grid {
            display: grid;
            gap: 20px;
        }
        .signal-card {
            background: linear-gradient(135deg, rgba(20, 20, 40, 0.8), rgba(30, 30, 50, 0.8));
            border: 1px solid var(--border-glow);
            border-radius: 16px;
            padding: 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            transition: all 0.3s;
            position: relative;
            overflow: hidden;
        }
        .signal-card:hover {
            transform: translateX(10px);
            box-shadow: 0 5px 30px rgba(0, 255, 136, 0.3);
            border-color: var(--primary-green);
        }
        .winning-trade {
            border-color: var(--primary-green);
            box-shadow: 0 0 20px rgba(0, 255, 136, 0.5);
        }
        .losing-trade {
            border-color: var(--danger-red);
            box-shadow: 0 0 20px rgba(255, 68, 68, 0.5);
        }
        .skipped-trade {
            border-color: #888;
            background: linear-gradient(135deg, rgba(50, 50, 50, 0.8), rgba(70, 70, 70, 0.8));
        }
        .skipped-message {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 100%;
            padding: 20px;
        }
        .taken-trade {
            opacity: 0.6;
            background: #333;
        }
        .limit-hit {
            pointer-events: none;
            opacity: 0.5;
            position: relative;
        }
        .limit-hit::after {
            content: 'Daily loss limit reached';
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0,0,0,0.7);
            color: white;
            padding: 10px;
            border-radius: 5px;
            font-size: 14px;
        }
        .signal-footer {
            margin-top: 15px;
            font-size: 12px;
            color: rgba(255, 255, 255, 0.7);
        }
        .signal-description {
            margin-bottom: 5px;
        }
        .signal-status {
            font-size: 12px;
            font-weight: 600;
            padding: 4px 8px;
            border-radius: 6px;
            text-transform: uppercase;
        }
        .signal-status.target-hit {
            background-color: var(--primary-green);
            color: var(--bg-dark);
        }
        .signal-status.sl-hit {
            background-color: var(--danger-red);
            color: white;
        }
        .signal-header {
            display: flex;
            align-items: center;
            gap: 20px;
        }
        .signal-pair {
            font-size: 24px;
            font-weight: bold;
            color: var(--primary-cyan);
        }
        .signal-type {
            padding: 6px 12px;
            border-radius: 8px;
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;
        }
        .signal-type.long {
            background: linear-gradient(135deg, rgba(0, 255, 136, 0.2), rgba(0, 255, 136, 0.1));
            color: var(--primary-green);
            border: 1px solid var(--primary-green);
        }
        .signal-type.short {
            background: linear-gradient(135deg, rgba(255, 68, 68, 0.2), rgba(255, 68, 68, 0.1));
            color: var(--danger-red);
            border: 1px solid var(--danger-red);
        }
        .signal-details {
            display: flex;
            gap: 30px;
            margin-top: 15px;
        }
        .signal-detail {
            display: flex;
            flex-direction: column;
        }
        .detail-label {
            font-size: 11px;
            color: rgba(255, 255, 255, 0.5);
            text-transform: uppercase;
            margin-bottom: 5px;
        }
        .detail-value {
            font-size: 18px;
            font-weight: 600;
        }
        .detail-value.entry { color: var(--primary-cyan); }
        .detail-value.sl { color: var(--danger-red); }
        .detail-value.tp { color: var(--primary-green); }
        .action-btn {
            padding: 12px 24px;
            background: linear-gradient(135deg, var(--primary-green), var(--primary-cyan));
            border: none;
            border-radius: 12px;
            color: var(--bg-dark);
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s;
        }
        .action-btn:hover {
            transform: scale(1.05);
            box-shadow: 0 5px 20px rgba(0, 255, 136, 0.4);
        }
      `}</style>
      <div id="signals-page" className="page-content">
        {dailyLossLimitHit && (
          <div className="disclaimer-banner">
            You have hit your daily loss limit. No more trades are allowed today.
          </div>
        )}
        <div className="page-header">
          <div>
            <h1 className="page-title">Trading Signals</h1>
            <p className="page-subtitle">Real-time professional-grade signals with 85-95% accuracy</p>
          </div>
        </div>

        <div className="filters-bar">
          <button className={`tab-btn ${activeTab === 'active' ? 'active' : ''}`} onClick={() => setActiveTab('active')}>Active Signals</button>
          <button className={`tab-btn ${activeTab === 'winning' ? 'active' : ''}`} onClick={() => setActiveTab('winning')}>Winning Trades</button>
          <button className={`tab-btn ${activeTab === 'losing' ? 'active' : ''}`} onClick={() => setActiveTab('losing')}>Losing Trades</button>
          <button className={`tab-btn ${activeTab === 'skipped' ? 'active' : ''}`} onClick={() => setActiveTab('skipped')}>Skipped Trades</button>
        </div>

        <div className="glass-panel">
          <div className="signals-grid">
            {activeTab === 'active' && signals.length === 0 && (
              <div className="text-center py-12 text-white">
                <div className="text-lg font-semibold mb-2">No Active Signals</div>
                <div className="text-gray-400">Signals will appear here when sent by the admin team.</div>
              </div>
            )}
            {activeTab === 'active' && signals.length > 0 && renderSignals(signals, 'active')}

            {activeTab === 'winning' && winningTrades.length === 0 && (
              <div className="text-center py-12 text-white">
                <div className="text-lg font-semibold mb-2">No Winning Trades</div>
                <div className="text-gray-400">Trades marked as 'Target Hit' will appear here.</div>
              </div>
            )}
            {activeTab === 'winning' && winningTrades.length > 0 && renderSignals(winningTrades, 'winning')}

            {activeTab === 'losing' && losingTrades.length === 0 && (
              <div className="text-center py-12 text-white">
                <div className="text-lg font-semibold mb-2">No Losing Trades</div>
                <div className="text-gray-400">Trades marked as 'Stop Loss Hit' will appear here.</div>
              </div>
            )}
            {activeTab === 'losing' && losingTrades.length > 0 && renderSignals(losingTrades, 'losing')}

            {activeTab === 'skipped' && skippedTrades.length === 0 && (
              <div className="text-center py-12 text-white">
                <div className="text-lg font-semibold mb-2">No Skipped Trades</div>
                <div className="text-gray-400">Trades you've skipped will appear here.</div>
              </div>
            )}
            {activeTab === 'skipped' && skippedTrades.length > 0 && renderSignals(skippedTrades, 'skipped')}
          </div>
        </div>
      </div>

      {showOutcomeModal && selectedSignal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-gray-900 p-8 rounded-lg shadow-lg w-full max-w-lg border border-primary-cyan">
            <h3 className="text-2xl font-bold text-primary-cyan mb-6 text-center">Select Trade Outcome for {selectedSignal.pair}</h3>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <button onClick={() => handleOutcomeSelection('Target Hit')} className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-4 rounded-lg transition-transform transform hover:scale-105">Target Hit</button>
              <button onClick={() => handleOutcomeSelection('Stop Loss Hit')} className="bg-red-500 hover:bg-red-600 text-white font-bold py-3 px-4 rounded-lg transition-transform transform hover:scale-105">Stop Loss Hit</button>
              <button onClick={() => handleOutcomeSelection('Breakeven')} className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-3 px-4 rounded-lg transition-transform transform hover:scale-105">Breakeven</button>
              <button onClick={handleAddToJournalClick} className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-4 rounded-lg transition-transform transform hover:scale-105">Add to Journal</button>
              <button onClick={handleChatWithNexusClick} className="bg-purple-500 hover:bg-purple-600 text-white font-bold py-3 px-4 rounded-lg transition-transform transform hover:scale-105 col-span-2">Chat with Nexus Coach</button>
            </div>
            <div className="col-span-2">
              <input
                type="number"
                value={manualPnl}
                onChange={(e) => setManualPnl(e.target.value)}
                placeholder="Enter P&L for manual close"
                className="bg-gray-800 border border-gray-700 text-white px-4 py-3 rounded-lg w-full focus:ring-2 focus:ring-primary-cyan"
              />
              <button onClick={() => handleOutcomeSelection('Manual Close')} className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-4 rounded-lg w-full mt-2 transition-transform transform hover:scale-105">Manual Close</button>
            </div>
            <button onClick={() => setShowOutcomeModal(false)} className="mt-6 text-gray-400 hover:text-white w-full text-center">Cancel</button>
          </div>
        </div>
      )}
    </>
  );
};

export default SignalsFeed;
