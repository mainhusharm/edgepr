import React from 'react';
import { AlertTriangle, Shield, Target, TrendingDown } from 'lucide-react';

const RiskProtocol = () => {
  const riskRules = [
    {
      id: 'max-position-size',
      title: 'Max Position Size',
      description: 'Maximum size for a single position, relative to account balance.',
      value: '5%',
      icon: Shield,
      color: 'text-green-400',
    },
    {
      id: 'max-daily-risk',
      title: 'Max Daily Risk',
      description: 'Maximum percentage of account to risk in a single day.',
      value: '2%',
      icon: AlertTriangle,
      color: 'text-red-400',
    },
    {
      id: 'max-weekly-drawdown',
      title: 'Max Weekly Drawdown',
      description: 'Maximum drawdown allowed in a single week to protect capital.',
      value: '5%',
      icon: TrendingDown,
      color: 'text-orange-400',
    },
    {
      id: 'min-rr-ratio',
      title: 'Minimum R:R Ratio',
      description: 'Minimum risk-to-reward ratio required for entering a trade.',
      value: '1:2',
      icon: Target,
      color: 'text-blue-400',
    },
  ];

  return (
    <>
      <style>{`
        :root {
            --primary-cyan: #00ffff;
            --primary-green: #00ff88;
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
        .glass-panel {
            background: var(--bg-panel);
            backdrop-filter: blur(20px);
            border: 1px solid var(--border-glow);
            border-radius: 20px;
            padding: 25px;
            margin-bottom: 25px;
        }
        .rule-card {
            background: linear-gradient(135deg, rgba(20, 20, 40, 0.8), rgba(30, 30, 50, 0.8));
            border: 1px solid var(--border-glow);
            border-radius: 16px;
            padding: 20px;
            transition: all 0.3s;
        }
        .rule-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 5px 20px rgba(0, 255, 136, 0.2);
        }
      `}</style>
      <div className="page-content">
        <div className="page-header">
          <div>
            <h1 className="page-title">Risk Protocol</h1>
            <p className="page-subtitle">Your personalized risk management framework.</p>
          </div>
        </div>

        <div className="glass-panel">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {riskRules.map(rule => (
              <div key={rule.id} className="rule-card">
                <div className="flex items-start space-x-4">
                  <div className={`p-2 rounded-lg bg-gray-800 ${rule.color}`}>
                    <rule.icon className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">{rule.title}</h3>
                    <p className="text-sm text-gray-400 mt-1">{rule.description}</p>
                  </div>
                </div>
                <div className="text-right mt-4">
                  <span className={`text-2xl font-bold ${rule.color}`}>{rule.value}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default RiskProtocol;
