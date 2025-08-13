import React, { useEffect } from 'react';

const QuantumBacktester: React.FC = () => {
  useEffect(() => {
    // Ensure the script is not added multiple times
    if (document.getElementById('tradingview-script')) {
      return;
    }

    const script = document.createElement('script');
    script.id = 'tradingview-script';
    script.src = 'https://s3.tradingview.com/tv.js';
    script.async = true;
    script.onload = () => {
      // @ts-ignore
      if (window.TradingView) {
        // @ts-ignore
        new window.TradingView.widget({
          "width": "100%",
          "height": 500,
          "symbol": "NASDAQ:AAPL",
          "interval": "D",
          "timezone": "Etc/UTC",
          "theme": "dark",
          "style": "1",
          "locale": "en",
          "toolbar_bg": "#f1f3f6",
          "enable_publishing": false,
          "allow_symbol_change": true,
          "container_id": "tradingview-widget",
          "hide_side_toolbar": false,
          "studies": [
            "MASimple@tv-basicstudies",
            "RSI@tv-basicstudies"
          ],
          "show_popup_button": true,
          "popup_width": "1000",
          "popup_height": "650"
        });
      }
    };
    document.body.appendChild(script);

    // All the backtesting logic from the original script tag
    let backtestingState = {
        trades: [] as any[],
        currentPrice: 0,
        isPlaying: false,
        speed: 1,
        balance: 10000,
        initialBalance: 10000,
        openPositions: [] as any[],
        metrics: {
            totalTrades: 0,
            profitableTrades: 0,
            lossTrades: 0,
            totalProfit: 0,
            totalLoss: 0,
            maxDrawdown: 0,
            peakBalance: 10000
        }
    };

    function createParticles() {
        const particlesContainer = document.getElementById('particles');
        if (!particlesContainer) return;
        particlesContainer.innerHTML = ''; // Clear existing particles
        for (let i = 0; i < 50; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            particle.style.left = Math.random() * 100 + '%';
            particle.style.animationDelay = Math.random() * 20 + 's';
            particle.style.animationDuration = (15 + Math.random() * 10) + 's';
            particlesContainer.appendChild(particle);
        }
    }

    function loadSymbol() {
        const symbolInput = document.getElementById('symbolInput') as HTMLInputElement;
        const symbol = symbolInput.value;
        if (symbol) {
            // @ts-ignore
            if (window.TradingView) {
                // @ts-ignore
                new window.TradingView.widget({
                    "width": "100%",
                    "height": 500,
                    "symbol": `NASDAQ:${symbol}`,
                    "interval": getCurrentInterval(),
                    "timezone": "Etc/UTC",
                    "theme": "dark",
                    "style": "1",
                    "locale": "en",
                    "toolbar_bg": "#f1f3f6",
                    "enable_publishing": false,
                    "allow_symbol_change": true,
                    "container_id": "tradingview-widget",
                    "hide_side_toolbar": false,
                    "studies": [
                        "MASimple@tv-basicstudies",
                        "RSI@tv-basicstudies"
                    ],
                    "show_popup_button": true,
                    "popup_width": "1000",
                    "popup_height": "650"
                });
            }
            updateAIMessage(`Loaded ${symbol}. Analyzing historical data...`);
        }
    }

    function getCurrentInterval() {
        const activeBtn = document.querySelector('.timeframe-btn.active');
        return activeBtn ? activeBtn.getAttribute('data-interval') : 'D';
    }

    function executeTrade(type: 'buy' | 'sell') {
        const lotSize = parseFloat((document.getElementById('lotSize') as HTMLInputElement).value);
        const stopLoss = parseFloat((document.getElementById('stopLoss') as HTMLInputElement).value);
        const takeProfit = parseFloat((document.getElementById('takeProfit') as HTMLInputElement).value);
        
        const currentPrice = 150 + Math.random() * 10;
        
        const trade = {
            id: Date.now(),
            type: type,
            symbol: (document.getElementById('symbolInput') as HTMLInputElement).value,
            entryPrice: currentPrice,
            lotSize: lotSize,
            stopLoss: type === 'buy' ? currentPrice - stopLoss : currentPrice + stopLoss,
            takeProfit: type === 'buy' ? currentPrice + takeProfit : currentPrice - takeProfit,
            timestamp: new Date().toLocaleTimeString(),
            status: 'open',
            pnl: 0,
            closePrice: 0,
        };
        
        backtestingState.openPositions.push(trade);
        backtestingState.trades.push(trade);
        
        addTradeToHistory(trade);
        updateMetrics();
        
        const aiMessage = type === 'buy' 
            ? `📈 Long position opened at ${currentPrice.toFixed(2)}. Risk/Reward ratio: ${(takeProfit/stopLoss).toFixed(2)}:1`
            : `📉 Short position opened at ${currentPrice.toFixed(2)}. Monitoring resistance levels...`;
        updateAIMessage(aiMessage);
        
        setTimeout(() => closeTrade(trade), 3000 + Math.random() * 5000);
    }

    function closeTrade(trade: any) {
        const isWin = Math.random() > 0.45;
        const closePrice = isWin 
            ? (trade.type === 'buy' ? trade.takeProfit : trade.stopLoss)
            : (trade.type === 'buy' ? trade.stopLoss : trade.takeProfit);
        
        const pnl = trade.type === 'buy' 
            ? (closePrice - trade.entryPrice) * trade.lotSize * 100
            : (trade.entryPrice - closePrice) * trade.lotSize * 100;
        
        trade.closePrice = closePrice;
        trade.pnl = pnl;
        trade.status = 'closed';
        
        if (pnl > 0) {
            backtestingState.metrics.profitableTrades++;
            backtestingState.metrics.totalProfit += pnl;
        } else {
            backtestingState.metrics.lossTrades++;
            backtestingState.metrics.totalLoss += Math.abs(pnl);
        }
        
        backtestingState.balance += pnl;
        backtestingState.metrics.totalTrades++;
        
        if (backtestingState.balance > backtestingState.metrics.peakBalance) {
            backtestingState.metrics.peakBalance = backtestingState.balance;
        }
        const drawdown = ((backtestingState.metrics.peakBalance - backtestingState.balance) / backtestingState.metrics.peakBalance) * 100;
        if (drawdown > backtestingState.metrics.maxDrawdown) {
            backtestingState.metrics.maxDrawdown = drawdown;
        }
        
        const index = backtestingState.openPositions.findIndex(p => p.id === trade.id);
        if (index > -1) {
            backtestingState.openPositions.splice(index, 1);
        }
        
        updateTradeInHistory(trade);
        updateMetrics();
        
        const aiMessage = pnl > 0 
            ? `✅ Trade closed with profit: +${pnl.toFixed(2)}. Good trade!`
            : `❌ Trade closed with loss: -${Math.abs(pnl).toFixed(2)}. Review your stop loss.`;
        updateAIMessage(aiMessage);
    }

    function addTradeToHistory(trade: any) {
        const historyList = document.getElementById('tradeHistory');
        if (!historyList) return;
        const tradeItem = document.createElement('div');
        tradeItem.className = 'trade-item';
        tradeItem.id = `trade-${trade.id}`;
        
        tradeItem.innerHTML = `
            <div class="trade-header">
                <span class="trade-type ${trade.type}">${trade.type.toUpperCase()}</span>
                <span>${trade.timestamp}</span>
            </div>
            <div class="trade-details">
                ${trade.symbol} • ${trade.lotSize} lots @ ${trade.entryPrice.toFixed(2)}
                <br>Status: <span style="color: #ffaa00;">OPEN</span>
            </div>
            <div class="trade-result"> 
                <span class="result-label">Result:</span> 
                <span class="result-value">--</span> 
            </div>
        `;
        
        historyList.insertBefore(tradeItem, historyList.firstChild);
    }

    function updateTradeInHistory(trade: any) {
        const tradeItem = document.getElementById(`trade-${trade.id}`);
        if (tradeItem) {
            const pnlColor = trade.pnl > 0 ? '#00ff88' : '#ff4444';
            const resultText = trade.pnl > 0 ? 'Win' : 'Loss';
            tradeItem.innerHTML = `
                <div class="trade-header">
                    <span class="trade-type ${trade.type}">${trade.type.toUpperCase()}</span>
                    <span>${trade.timestamp}</span>
                </div>
                <div class="trade-details">
                    ${trade.symbol} • ${trade.lotSize} lots @ ${trade.entryPrice.toFixed(2)}
                    <br>Closed @ ${trade.closePrice.toFixed(2)}
                    <br>P&L: <span style="color: ${pnlColor}; font-weight: 600;">${trade.pnl > 0 ? '+' : ''}${trade.pnl.toFixed(2)}</span>
                </div>
                <div class="trade-result">
                    <span class="result-label">Result:</span>
                    <span class="result-value" style="color: ${pnlColor};">${resultText}</span>
                </div>
            `;
        }
    }

    function updateMetrics() {
        const winRate = backtestingState.metrics.totalTrades > 0 
            ? (backtestingState.metrics.profitableTrades / backtestingState.metrics.totalTrades * 100).toFixed(1)
            : "0";
        
        const totalPnL = backtestingState.balance - backtestingState.initialBalance;
        const sharpeRatio = calculateSharpeRatio();
        const profitFactor = backtestingState.metrics.totalLoss > 0 
            ? (backtestingState.metrics.totalProfit / backtestingState.metrics.totalLoss).toFixed(2)
            : "0.0";
        
        const totalTradesEl = document.getElementById('totalTrades');
        if (totalTradesEl) totalTradesEl.textContent = backtestingState.metrics.totalTrades.toString();
        
        const winRateEl = document.getElementById('winRate');
        if (winRateEl) winRateEl.textContent = winRate + '%';

        const totalPnLEl = document.getElementById('totalPnL');
        if (totalPnLEl) {
            totalPnLEl.textContent = `${totalPnL >= 0 ? '+' : '-'}$${Math.abs(totalPnL).toFixed(2)}`;
            totalPnLEl.style.color = totalPnL >= 0 ? '#00ff88' : '#ff4444';
        }

        const sharpeRatioEl = document.getElementById('sharpeRatio');
        if (sharpeRatioEl) sharpeRatioEl.textContent = sharpeRatio.toFixed(2);
        
        const profitTradesEl = document.getElementById('profitTrades');
        if (profitTradesEl) profitTradesEl.textContent = backtestingState.metrics.profitableTrades.toString();

        const lossTradesEl = document.getElementById('lossTrades');
        if (lossTradesEl) lossTradesEl.textContent = backtestingState.metrics.lossTrades.toString();

        const avgWinEl = document.getElementById('avgWin');
        if (avgWinEl) avgWinEl.textContent = backtestingState.metrics.profitableTrades > 0 
            ? `+$${(backtestingState.metrics.totalProfit / backtestingState.metrics.profitableTrades).toFixed(2)}`
            : '$0';

        const avgLossEl = document.getElementById('avgLoss');
        if (avgLossEl) avgLossEl.textContent = backtestingState.metrics.lossTrades > 0 
            ? `-$${(backtestingState.metrics.totalLoss / backtestingState.metrics.lossTrades).toFixed(2)}`
            : '$0';

        const profitFactorEl = document.getElementById('profitFactor');
        if (profitFactorEl) profitFactorEl.textContent = profitFactor;

        const maxDrawdownEl = document.getElementById('maxDrawdown');
        if (maxDrawdownEl) maxDrawdownEl.textContent = backtestingState.metrics.maxDrawdown.toFixed(1) + '%';
    }

    function calculateSharpeRatio() {
        if (backtestingState.trades.length < 2) return 0;
        
        const returns = backtestingState.trades
            .filter(t => t.status === 'closed')
            .map(t => t.pnl / backtestingState.initialBalance);
        
        if (returns.length === 0) return 0;
        
        const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
        const stdDev = Math.sqrt(returns.reduce((sq, n) => sq + Math.pow(n - avgReturn, 2), 0) / returns.length);
        
        return stdDev > 0 ? (avgReturn / stdDev) * Math.sqrt(252) : 0;
    }

    function togglePlayback() {
        backtestingState.isPlaying = !backtestingState.isPlaying;
        const playBtn = document.getElementById('playBtn');
        if (playBtn) playBtn.textContent = backtestingState.isPlaying ? '⏸' : '▶';
        
        if (backtestingState.isPlaying) {
            updateAIMessage('📊 Playback started. Watch for trading opportunities...');
            simulatePlayback();
        }
    }

    function simulatePlayback() {
        if (!backtestingState.isPlaying) return;
        setTimeout(() => simulatePlayback(), 1000 / backtestingState.speed);
    }

    function stepForward() {
        updateAIMessage('⏭ Stepped forward one period');
    }

    function resetBacktest() {
        if (confirm('Reset all backtesting data?')) {
            backtestingState = {
                trades: [],
                currentPrice: 0,
                isPlaying: false,
                speed: 1,
                balance: 10000,
                initialBalance: 10000,
                openPositions: [],
                metrics: {
                    totalTrades: 0,
                    profitableTrades: 0,
                    lossTrades: 0,
                    totalProfit: 0,
                    totalLoss: 0,
                    maxDrawdown: 0,
                    peakBalance: 10000
                }
            };
            
            const tradeHistory = document.getElementById('tradeHistory');
            if (tradeHistory) tradeHistory.innerHTML = '';
            updateMetrics();
            updateAIMessage('🔄 Backtesting session reset. Ready for new strategy testing.');
        }
    }

    function exportResults() {
        const results = {
            summary: {
                totalTrades: backtestingState.metrics.totalTrades,
                winRate: (backtestingState.metrics.profitableTrades / backtestingState.metrics.totalTrades * 100).toFixed(1) + '%',
                totalPnL: backtestingState.balance - backtestingState.initialBalance,
                sharpeRatio: calculateSharpeRatio().toFixed(2),
                maxDrawdown: backtestingState.metrics.maxDrawdown.toFixed(1) + '%'
            },
            trades: backtestingState.trades
        };
        
        const dataStr = JSON.stringify(results, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        
        const exportFileDefaultName = `backtest_results_${Date.now()}.json`;
        
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
        
        updateAIMessage('📥 Results exported successfully!');
    }

    function clearAll() {
        resetBacktest();
    }

    function toggleAI() {
        const aiChat = document.getElementById('aiChat');
        if (aiChat) aiChat.classList.toggle('active');
    }

    function updateAIMessage(message: string) {
        const aiMessages = document.querySelector('.ai-messages');
        if (!aiMessages) return;
        const messageDiv = document.createElement('div');
        messageDiv.className = 'ai-message';
        messageDiv.textContent = message;
        aiMessages.appendChild(messageDiv);
        aiMessages.scrollTop = aiMessages.scrollHeight;
    }

    function closeModal() {
        const modal = document.getElementById('resultsModal');
        if (modal) modal.classList.remove('active');
    }

    // Event Listeners
    document.querySelector('.buy-btn')?.addEventListener('click', () => executeTrade('buy'));
    document.querySelector('.sell-btn')?.addEventListener('click', () => executeTrade('sell'));
    document.querySelector('.timeframe-btn[onclick="loadSymbol()"]')?.addEventListener('click', loadSymbol);
    document.querySelectorAll('.timeframe-btn[data-interval]').forEach(btn => {
        btn.addEventListener('click', function(this: HTMLElement) {
            document.querySelectorAll('.timeframe-btn[data-interval]').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            loadSymbol();
        });
    });
    document.getElementById('playBtn')?.addEventListener('click', togglePlayback);
    document.querySelector('.playback-btn[onclick="stepForward()"]')?.addEventListener('click', stepForward);
    document.querySelector('.playback-btn[onclick="resetBacktest()"]')?.addEventListener('click', resetBacktest);
    document.getElementById('speedSelect')?.addEventListener('change', function(this: HTMLSelectElement) {
        backtestingState.speed = parseFloat(this.value);
    });
    document.querySelector('.control-btn[onclick="exportResults()"]')?.addEventListener('click', exportResults);
    document.querySelector('.control-btn.danger[onclick="clearAll()"]')?.addEventListener('click', clearAll);
    document.querySelector('.ai-assistant')?.addEventListener('click', toggleAI);
    document.querySelector('.modal-close')?.addEventListener('click', closeModal);

    createParticles();
    updateMetrics();
    updateAIMessage('🚀 Quantum Backtesting initialized. Start testing your strategy!');

    return () => {
      // Cleanup function to remove the script when the component unmounts
      const scriptElement = document.getElementById('tradingview-script');
      if (scriptElement) {
        document.body.removeChild(scriptElement);
      }
    };
  }, []);

  return (
    <>
      <style>{`
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        .backtesting-body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
            background: #0a0a0f;
            color: #ffffff;
            height: 100%;
            overflow: hidden;
        }

        .backtesting-container {
            display: flex;
            height: 100vh;
            position: relative;
            background: radial-gradient(ellipse at top left, #0f0f23 0%, #0a0a0f 50%);
        }

        .quantum-particles {
            position: absolute;
            width: 100%;
            height: 100%;
            overflow: hidden;
            pointer-events: none;
            z-index: 1;
        }

        .particle {
            position: absolute;
            width: 3px;
            height: 3px;
            background: linear-gradient(45deg, #00ff88, #00ffff);
            border-radius: 50%;
            animation: float 20s infinite linear;
            opacity: 0.4;
        }

        @keyframes float {
            0% {
                transform: translateY(100vh) translateX(0) scale(0);
                opacity: 0;
            }
            10% {
                opacity: 0.4;
            }
            90% {
                opacity: 0.4;
            }
            100% {
                transform: translateY(-100px) translateX(100px) scale(1);
                opacity: 0;
            }
        }

        .main-content {
            flex: 1;
            display: flex;
            flex-direction: column;
            position: relative;
            z-index: 10;
        }

        .header {
            height: 70px;
            background: rgba(15, 15, 35, 0.8);
            backdrop-filter: blur(20px);
            border-bottom: 1px solid rgba(0, 255, 136, 0.2);
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 0 30px;
            z-index: 100;
        }

        .logo {
            font-size: 24px;
            font-weight: bold;
            background: linear-gradient(135deg, #00ff88, #00ffff);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }

        .header-stats {
            display: flex;
            gap: 40px;
        }

        .stat-item {
            text-align: center;
        }

        .stat-value {
            font-size: 20px;
            font-weight: 600;
            color: #00ff88;
        }

        .stat-label {
            font-size: 11px;
            color: rgba(255, 255, 255, 0.5);
            text-transform: uppercase;
            margin-top: 4px;
        }

        .trading-area {
            flex: 1;
            display: flex;
            gap: 20px;
            padding: 20px;
            position: relative;
        }

        .chart-section {
            flex: 1;
            display: flex;
            flex-direction: column;
            gap: 20px;
        }

        .chart-container {
            flex: 1;
            background: rgba(20, 20, 30, 0.6);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(0, 255, 136, 0.2);
            border-radius: 20px;
            padding: 20px;
            position: relative;
            overflow: hidden;
        }

        .chart-wrapper {
            position: relative;
            width: 100%;
            height: 500px;
        }

        .trade-overlay {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 10;
        }

        .position-marker {
            position: absolute;
            display: flex;
            align-items: center;
            pointer-events: all;
            animation: fadeIn 0.3s ease;
        }

        @keyframes fadeIn {
            from {
                opacity: 0;
                transform: scale(0.8);
            }
            to {
                opacity: 1;
                transform: scale(1);
            }
        }

        .position-line {
            position: absolute;
            left: 0;
            width: 100%;
            height: 2px;
            opacity: 0.8;
        }

        .position-line.entry {
            background: linear-gradient(90deg, transparent, #00ffff, #00ffff, transparent);
            box-shadow: 0 0 10px rgba(0, 255, 255, 0.5);
        }

        .position-line.stop-loss {
            background: linear-gradient(90deg, transparent, #ff4444, #ff4444, transparent);
            box-shadow: 0 0 10px rgba(255, 68, 68, 0.5);
            border-top: 2px dashed #ff4444;
            height: 0;
        }

        .position-line.take-profit {
            background: linear-gradient(90deg, transparent, #00ff88, #00ff88, transparent);
            box-shadow: 0 0 10px rgba(0, 255, 136, 0.5);
            border-top: 2px dashed #00ff88;
            height: 0;
        }

        .position-label {
            position: absolute;
            background: rgba(20, 20, 40, 0.95);
            border: 1px solid;
            border-radius: 8px;
            padding: 8px 12px;
            font-size: 12px;
            font-weight: 600;
            white-space: nowrap;
            backdrop-filter: blur(10px);
            display: flex;
            align-items: center;
            gap: 8px;
            cursor: pointer;
            transition: all 0.3s;
            z-index: 20;
        }

        .position-label:hover {
            transform: scale(1.05);
            box-shadow: 0 5px 20px rgba(0, 0, 0, 0.3);
        }

        .position-label.buy {
            border-color: #00ff88;
            color: #00ff88;
            background: linear-gradient(135deg, rgba(0, 255, 136, 0.2), rgba(0, 255, 136, 0.1));
        }

        .position-label.sell {
            border-color: #ff4444;
            color: #ff4444;
            background: linear-gradient(135deg, rgba(255, 68, 68, 0.2), rgba(255, 68, 68, 0.1));
        }

        .position-label .lots {
            background: rgba(255, 255, 255, 0.1);
            padding: 2px 6px;
            border-radius: 4px;
            font-size: 11px;
        }

        .position-icon {
            font-size: 16px;
        }

        .sl-tp-zone {
            position: absolute;
            left: 0;
            width: 100%;
            opacity: 0.1;
            pointer-events: none;
        }

        .sl-tp-zone.profit-zone {
            background: linear-gradient(180deg, rgba(0, 255, 136, 0.3), transparent);
        }

        .sl-tp-zone.loss-zone {
            background: linear-gradient(180deg, transparent, rgba(255, 68, 68, 0.3));
        }

        .price-level-label {
            position: absolute;
            right: 10px;
            background: rgba(20, 20, 40, 0.9);
            padding: 4px 8px;
            border-radius: 6px;
            font-size: 11px;
            font-weight: 600;
            border: 1px solid;
            backdrop-filter: blur(10px);
        }

        .price-level-label.sl {
            border-color: #ff4444;
            color: #ff4444;
        }

        .price-level-label.tp {
            border-color: #00ff88;
            color: #00ff88;
        }

        .price-level-label.entry {
            border-color: #00ffff;
            color: #00ffff;
        }

        .chart-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 15px;
        }

        .symbol-selector {
            display: flex;
            gap: 10px;
            align-items: center;
        }

        .symbol-input {
            background: rgba(0, 255, 136, 0.1);
            border: 1px solid rgba(0, 255, 136, 0.3);
            color: white;
            padding: 8px 15px;
            border-radius: 10px;
            outline: none;
            transition: all 0.3s;
        }

        .symbol-input:focus {
            border-color: #00ff88;
            box-shadow: 0 0 15px rgba(0, 255, 136, 0.3);
        }

        .timeframe-buttons {
            display: flex;
            gap: 10px;
        }

        .timeframe-btn {
            padding: 8px 15px;
            background: rgba(0, 255, 136, 0.1);
            border: 1px solid rgba(0, 255, 136, 0.3);
            color: #00ff88;
            border-radius: 8px;
            cursor: pointer;
            transition: all 0.3s;
        }

        .timeframe-btn:hover {
            background: rgba(0, 255, 136, 0.2);
            transform: translateY(-2px);
        }

        .timeframe-btn.active {
            background: linear-gradient(135deg, #00ff88, #00ffff);
            color: #0a0a0f;
            font-weight: 600;
        }

        #tradingview-widget {
            width: 100%;
            height: 500px;
            border-radius: 15px;
            overflow: hidden;
        }

        .trade-controls {
            background: rgba(20, 20, 30, 0.6);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(0, 255, 136, 0.2);
            border-radius: 20px;
            padding: 20px;
        }

        .trade-buttons {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
            margin-bottom: 20px;
        }

        .trade-btn {
            padding: 15px;
            border: none;
            border-radius: 12px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s;
            position: relative;
            overflow: hidden;
        }

        .trade-btn::before {
            content: '';
            position: absolute;
            top: 50%;
            left: 50%;
            width: 0;
            height: 0;
            border-radius: 50%;
            transform: translate(-50%, -50%);
            transition: all 0.5s;
        }

        .trade-btn:hover::before {
            width: 300px;
            height: 300px;
        }

        .buy-btn {
            background: linear-gradient(135deg, #00ff88, #00cc70);
            color: #0a0a0f;
        }

        .buy-btn::before {
            background: rgba(255, 255, 255, 0.2);
        }

        .sell-btn {
            background: linear-gradient(135deg, #ff4444, #cc0000);
            color: white;
        }

        .sell-btn::before {
            background: rgba(0, 0, 0, 0.2);
        }

        .trade-btn:hover {
            transform: scale(1.05);
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
        }

        .trade-inputs {
            display: flex;
            flex-direction: column;
            gap: 15px;
        }

        .input-group {
            display: flex;
            flex-direction: column;
            gap: 8px;
        }

        .input-label {
            font-size: 12px;
            color: rgba(255, 255, 255, 0.6);
            text-transform: uppercase;
            letter-spacing: 1px;
        }

        .trade-input {
            background: rgba(0, 255, 136, 0.05);
            border: 1px solid rgba(0, 255, 136, 0.2);
            color: white;
            padding: 12px;
            border-radius: 10px;
            outline: none;
            transition: all 0.3s;
            font-size: 16px;
        }

        .trade-input:focus {
            border-color: #00ff88;
            background: rgba(0, 255, 136, 0.1);
        }

        .sidebar {
            width: 350px;
            display: flex;
            flex-direction: column;
            gap: 20px;
            max-height: 100%;
        }

        .performance-panel {
            background: rgba(20, 20, 30, 0.6);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(0, 255, 136, 0.2);
            border-radius: 20px;
            padding: 20px;
        }

        .panel-title {
            font-size: 18px;
            margin-bottom: 20px;
            background: linear-gradient(135deg, #00ff88, #00ffff);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }

        .metric-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
        }

        .metric-card {
            background: rgba(0, 255, 136, 0.05);
            border: 1px solid rgba(0, 255, 136, 0.1);
            border-radius: 12px;
            padding: 15px;
            text-align: center;
            transition: all 0.3s;
        }

        .metric-card:hover {
            transform: translateY(-3px);
            border-color: rgba(0, 255, 136, 0.3);
            box-shadow: 0 5px 15px rgba(0, 255, 136, 0.1);
        }

        .metric-value {
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 5px;
        }

        .metric-value.positive {
            color: #00ff88;
        }

        .metric-value.negative {
            color: #ff4444;
        }

        .metric-name {
            font-size: 11px;
            color: rgba(255, 255, 255, 0.5);
            text-transform: uppercase;
        }

        .trade-history {
            background: rgba(20, 20, 30, 0.6);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(0, 255, 136, 0.2);
            border-radius: 20px;
            padding: 20px;
            flex: 1;
            overflow: hidden;
            display: flex;
            flex-direction: column;
        }

        .history-list {
            flex: 1;
            overflow-y: auto;
            margin-top: 15px;
        }

        .trade-item {
            background: rgba(0, 255, 136, 0.05);
            border: 1px solid rgba(0, 255, 136, 0.1);
            border-radius: 12px;
            padding: 12px;
            margin-bottom: 10px;
            transition: all 0.3s;
            animation: slideIn 0.3s ease;
            display: grid;
            grid-template-columns: 1fr auto;
            gap: 10px;
        }
        .trade-result {
            text-align: right;
        }
        .result-label {
            font-size: 10px;
            color: rgba(255, 255, 255, 0.5);
            text-transform: uppercase;
        }
        .result-value {
            font-weight: 600;
        }

        @keyframes slideIn {
            from {
                opacity: 0;
                transform: translateX(20px);
            }
            to {
                opacity: 1;
                transform: translateX(0);
            }
        }

        .trade-item:hover {
            background: rgba(0, 255, 136, 0.1);
            transform: translateX(-5px);
        }

        .trade-header {
            display: flex;
            justify-content: space-between;
            margin-bottom: 8px;
        }

        .trade-type {
            font-weight: 600;
            text-transform: uppercase;
            font-size: 12px;
        }

        .trade-type.buy {
            color: #00ff88;
        }

        .trade-type.sell {
            color: #ff4444;
        }

        .trade-details {
            font-size: 12px;
            color: rgba(255, 255, 255, 0.6);
        }

        .controls-footer {
            display: flex;
            gap: 15px;
            margin-top: 20px;
        }

        .control-btn {
            flex: 1;
            padding: 12px;
            background: rgba(0, 255, 136, 0.1);
            border: 1px solid rgba(0, 255, 136, 0.3);
            color: #00ff88;
            border-radius: 10px;
            cursor: pointer;
            transition: all 0.3s;
            font-weight: 600;
        }

        .control-btn:hover {
            background: rgba(0, 255, 136, 0.2);
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(0, 255, 136, 0.2);
        }

        .control-btn.danger {
            background: rgba(255, 68, 68, 0.1);
            border-color: rgba(255, 68, 68, 0.3);
            color: #ff4444;
        }

        .control-btn.danger:hover {
            background: rgba(255, 68, 68, 0.2);
            box-shadow: 0 5px 15px rgba(255, 68, 68, 0.2);
        }

        .modal {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            backdrop-filter: blur(10px);
            z-index: 1000;
            align-items: center;
            justify-content: center;
        }

        .modal.active {
            display: flex;
        }

        .modal-content {
            background: linear-gradient(135deg, rgba(20, 20, 40, 0.95), rgba(30, 30, 50, 0.95));
            border: 1px solid rgba(0, 255, 136, 0.3);
            border-radius: 20px;
            padding: 30px;
            max-width: 500px;
            width: 90%;
            animation: modalSlide 0.3s ease;
        }

        @keyframes modalSlide {
            from {
                transform: translateY(-50px);
                opacity: 0;
            }
            to {
                transform: translateY(0);
                opacity: 1;
            }
        }

        .modal-title {
            font-size: 24px;
            margin-bottom: 20px;
            background: linear-gradient(135deg, #00ff88, #00ffff);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }

        .results-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin: 20px 0;
        }

        .result-item {
            background: rgba(0, 255, 136, 0.05);
            border: 1px solid rgba(0, 255, 136, 0.2);
            border-radius: 12px;
            padding: 15px;
            text-align: center;
        }

        .result-value {
            font-size: 28px;
            font-weight: bold;
            margin-bottom: 8px;
        }

        .result-label {
            font-size: 12px;
            color: rgba(255, 255, 255, 0.6);
            text-transform: uppercase;
        }

        .modal-close {
            width: 100%;
            padding: 15px;
            background: linear-gradient(135deg, #00ff88, #00ffff);
            border: none;
            border-radius: 12px;
            color: #0a0a0f;
            font-weight: 600;
            font-size: 16px;
            cursor: pointer;
            transition: all 0.3s;
        }

        .modal-close:hover {
            transform: scale(1.02);
            box-shadow: 0 10px 30px rgba(0, 255, 136, 0.3);
        }

        ::-webkit-scrollbar {
            width: 8px;
        }

        ::-webkit-scrollbar-track {
            background: rgba(20, 20, 30, 0.5);
            border-radius: 4px;
        }

        ::-webkit-scrollbar-thumb {
            background: linear-gradient(to bottom, #00ff88, #00ffff);
            border-radius: 4px;
        }

        .loading {
            display: flex;
            gap: 5px;
            justify-content: center;
            align-items: center;
            height: 100%;
        }

        .loading-bar {
            width: 4px;
            height: 30px;
            background: linear-gradient(to top, #00ff88, #00ffff);
            border-radius: 2px;
            animation: loading-wave 1s ease-in-out infinite;
        }

        .loading-bar:nth-child(1) { animation-delay: 0s; }
        .loading-bar:nth-child(2) { animation-delay: 0.1s; }
        .loading-bar:nth-child(3) { animation-delay: 0.2s; }
        .loading-bar:nth-child(4) { animation-delay: 0.3s; }
        .loading-bar:nth-child(5) { animation-delay: 0.4s; }

        @keyframes loading-wave {
            0%, 100% {
                transform: scaleY(0.5);
            }
            50% {
                transform: scaleY(1);
            }
        }

        .playback-controls {
            background: rgba(20, 20, 30, 0.6);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(0, 255, 136, 0.2);
            border-radius: 20px;
            padding: 20px;
            display: flex;
            align-items: center;
            gap: 20px;
        }

        .playback-btn {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            background: linear-gradient(135deg, #00ff88, #00ffff);
            border: none;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: all 0.3s;
            color: #0a0a0f;
            font-size: 18px;
        }

        .playback-btn:hover {
            transform: scale(1.1);
            box-shadow: 0 0 20px rgba(0, 255, 136, 0.5);
        }

        .speed-control {
            display: flex;
            align-items: center;
            gap: 10px;
            margin-left: auto;
        }

        .speed-label {
            font-size: 12px;
            color: rgba(255, 255, 255, 0.6);
        }

        .speed-select {
            background: rgba(0, 255, 136, 0.1);
            border: 1px solid rgba(0, 255, 136, 0.3);
            color: white;
            padding: 8px;
            border-radius: 8px;
            outline: none;
        }

        .ai-assistant {
            position: fixed;
            bottom: 30px;
            right: 30px;
            width: 60px;
            height: 60px;
            background: linear-gradient(135deg, #00ff88, #00ffff);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            box-shadow: 0 10px 30px rgba(0, 255, 136, 0.3);
            transition: all 0.3s;
            z-index: 999;
            animation: pulse 2s infinite;
        }

        @keyframes pulse {
            0%, 100% {
                box-shadow: 0 10px 30px rgba(0, 255, 136, 0.3);
            }
            50% {
                box-shadow: 0 10px 40px rgba(0, 255, 136, 0.5);
            }
        }

        .ai-assistant:hover {
            transform: scale(1.1);
        }

        .ai-chat {
            position: fixed;
            bottom: 100px;
            right: 30px;
            width: 350px;
            height: 450px;
            background: rgba(20, 20, 40, 0.95);
            border: 1px solid rgba(0, 255, 136, 0.3);
            border-radius: 20px;
            display: none;
            flex-direction: column;
            z-index: 998;
            animation: slideUp 0.3s ease;
        }

        @keyframes slideUp {
            from {
                transform: translateY(20px);
                opacity: 0;
            }
            to {
                transform: translateY(0);
                opacity: 1;
            }
        }

        .ai-chat.active {
            display: flex;
        }

        .ai-header {
            padding: 20px;
            border-bottom: 1px solid rgba(0, 255, 136, 0.2);
            display: flex;
            align-items: center;
            gap: 15px;
        }

        .ai-avatar {
            width: 40px;
            height: 40px;
            background: linear-gradient(135deg, #00ff88, #00ffff);
            border-radius: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 20px;
        }

        .ai-messages {
            flex: 1;
            padding: 20px;
            overflow-y: auto;
        }

        .ai-message {
            background: rgba(0, 255, 136, 0.1);
            border-radius: 15px;
            padding: 12px;
            margin-bottom: 10px;
            font-size: 14px;
            line-height: 1.5;
        }
      `}</style>
      <div className="backtesting-body">
        <div className="backtesting-container">
            <div className="quantum-particles" id="particles"></div>
            <div className="main-content">
                <div className="header">
                    <div className="logo">QUANTUM BACKTEST</div>
                    <div className="header-stats">
                        <div className="stat-item">
                            <div className="stat-value" id="totalTrades">0</div>
                            <div className="stat-label">Total Trades</div>
                        </div>
                        <div className="stat-item">
                            <div className="stat-value" id="winRate">0%</div>
                            <div className="stat-label">Win Rate</div>
                        </div>
                        <div className="stat-item">
                            <div className="stat-value" id="totalPnL">$0</div>
                            <div className="stat-label">Total P&L</div>
                        </div>
                        <div className="stat-item">
                            <div className="stat-value" id="sharpeRatio">0.0</div>
                            <div className="stat-label">Sharpe Ratio</div>
                        </div>
                    </div>
                </div>
                <div className="trading-area">
                    <div className="chart-section">
                        <div className="chart-container">
                            <div className="chart-header">
                                <div className="symbol-selector">
                                    <input type="text" className="symbol-input" id="symbolInput" placeholder="Enter Symbol" defaultValue="AAPL" />
                                    <button className="timeframe-btn" onClick={() => {
                                        const symbolInput = document.getElementById('symbolInput') as HTMLInputElement;
                                        const symbol = symbolInput.value;
                                        if (symbol) {
                                            // @ts-ignore
                                            if (window.TradingView) {
                                                // @ts-ignore
                                                new window.TradingView.widget({
                                                    "width": "100%",
                                                    "height": 500,
                                                    "symbol": `NASDAQ:${symbol}`,
                                                    "interval": "D",
                                                    "timezone": "Etc/UTC",
                                                    "theme": "dark",
                                                    "style": "1",
                                                    "locale": "en",
                                                    "toolbar_bg": "#f1f3f6",
                                                    "enable_publishing": false,
                                                    "allow_symbol_change": true,
                                                    "container_id": "tradingview-widget",
                                                });
                                            }
                                        }
                                    }}>Load</button>
                                </div>
                                <div className="timeframe-buttons">
                                    <button className="timeframe-btn" data-interval="1">1m</button>
                                    <button className="timeframe-btn" data-interval="5">5m</button>
                                    <button className="timeframe-btn" data-interval="15">15m</button>
                                    <button className="timeframe-btn" data-interval="60">1H</button>
                                    <button className="timeframe-btn active" data-interval="D">1D</button>
                                    <button className="timeframe-btn" data-interval="W">1W</button>
                                </div>
                            </div>
                            <div className="chart-wrapper">
                                <div id="tradingview-widget"></div>
                                <div className="trade-overlay" id="tradeOverlay"></div>
                            </div>
                        </div>
                        <div className="playback-controls">
                            <button className="playback-btn" id="playBtn">▶</button>
                            <button className="playback-btn" onClick={() => {}}>⏭</button>
                            <button className="playback-btn" onClick={() => {}}>⏹</button>
                            <div className="speed-control">
                                <span className="speed-label">Speed:</span>
                                <select className="speed-select" id="speedSelect">
                                    <option value="0.5">0.5x</option>
                                    <option value="1" >1x</option>
                                    <option value="2">2x</option>
                                    <option value="5">5x</option>
                                    <option value="10">10x</option>
                                </select>
                            </div>
                        </div>
                        <div className="trade-controls">
                            <div className="trade-buttons">
                                <button className="trade-btn buy-btn">
                                    BUY / LONG
                                </button>
                                <button className="trade-btn sell-btn">
                                    SELL / SHORT
                                </button>
                            </div>
                            <div className="trade-inputs">
                                <div className="input-group">
                                    <label className="input-label">Position Size (Lots)</label>
                                    <input type="number" className="trade-input" id="lotSize" defaultValue="1" min="0.01" step="0.01" />
                                </div>
                                <div className="input-group">
                                    <label className="input-label">Stop Loss (Points)</label>
                                    <input type="number" className="trade-input" id="stopLoss" defaultValue="50" min="1" />
                                </div>
                                <div className="input-group">
                                    <label className="input-label">Take Profit (Points)</label>
                                    <input type="number" className="trade-input" id="takeProfit" defaultValue="100" min="1" />
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="sidebar">
                        <div className="performance-panel">
                            <h3 className="panel-title">Performance Metrics</h3>
                            <div className="metric-grid">
                                <div className="metric-card">
                                    <div className="metric-value positive" id="profitTrades">0</div>
                                    <div className="metric-name">Profitable</div>
                                </div>
                                <div className="metric-card">
                                    <div className="metric-value negative" id="lossTrades">0</div>
                                    <div className="metric-name">Loss Trades</div>
                                </div>
                                <div className="metric-card">
                                    <div className="metric-value positive" id="avgWin">$0</div>
                                    <div className="metric-name">Avg Win</div>
                                </div>
                                <div className="metric-card">
                                    <div className="metric-value negative" id="avgLoss">$0</div>
                                    <div className="metric-name">Avg Loss</div>
                                </div>
                                <div className="metric-card">
                                    <div className="metric-value" id="profitFactor">0.0</div>
                                    <div className="metric-name">Profit Factor</div>
                                </div>
                                <div className="metric-card">
                                    <div className="metric-value" id="maxDrawdown">0%</div>
                                    <div className="metric-name">Max DD</div>
                                </div>
                            </div>
                        </div>
                        <div className="trade-history">
                            <h3 className="panel-title">Trade History</h3>
                            <div className="history-list" id="tradeHistory">
                            </div>
                        </div>
                        <div className="controls-footer">
                            <button className="control-btn">Export Results</button>
                            <button className="control-btn danger">Clear All</button>
                        </div>
                    </div>
                </div>
            </div>
            <div className="ai-assistant">
                🤖
            </div>
            <div className="ai-chat" id="aiChat">
                <div className="ai-header">
                    <div className="ai-avatar">🧠</div>
                    <div>
                        <div style={{ fontWeight: 600 }}>Quantum AI Coach</div>
                        <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>Backtesting Assistant</div>
                    </div>
                </div>
                <div className="ai-messages">
                    <div className="ai-message">
                        👋 Welcome to Quantum Backtesting! I'm here to help you improve your trading strategy. Start placing trades and I'll provide real-time analysis and suggestions.
                    </div>
                </div>
            </div>
            <div className="modal" id="resultsModal">
                <div className="modal-content">
                    <h2 className="modal-title">Backtesting Results</h2>
                    <div className="results-grid">
                        <div className="result-item">
                            <div className="result-value positive" id="modalTotalPnL">$0</div>
                            <div className="result-label">Total P&L</div>
                        </div>
                        <div className="result-item">
                            <div className="result-value" id="modalWinRate">0%</div>
                            <div className="result-label">Win Rate</div>
                        </div>
                        <div className="result-item">
                            <div className="result-value" id="modalTotalTrades">0</div>
                            <div className="result-label">Total Trades</div>
                        </div>
                        <div className="result-item">
                            <div className="result-value" id="modalSharpe">0.0</div>
                            <div className="result-label">Sharpe Ratio</div>
                        </div>
                    </div>
                    <button className="modal-close">Continue Trading</button>
                </div>
            </div>
        </div>
      </div>
    </>
  );
};

export default QuantumBacktester;
