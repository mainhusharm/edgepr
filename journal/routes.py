from flask import Blueprint, request, jsonify
from .models import db, Trade, User, RiskPlan
from datetime import datetime
from .auth_middleware import session_required
import json
from flask_jwt_extended import jwt_required, get_jwt_identity

trades_bp = Blueprint('trades', __name__)
risk_plan_bp = Blueprint('risk_plan', __name__)
plan_generation_bp = Blueprint('plan_generation', __name__)

@trades_bp.route('/trades', methods=['POST'])
@jwt_required()
def add_trade():
    data = request.get_json()
    user_id = get_jwt_identity()

    if not data or not all(k in data for k in ['pair', 'type', 'entry', 'stopLoss', 'takeProfit']):
        return jsonify({'error': 'Missing required trade data'}), 400

    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404

    new_trade = Trade(
        signal_id=data['id'],
        date=datetime.utcnow().date(),
        asset=data['pair'],
        direction=data['type'].lower(),
        entry_price=float(data['entry']),
        sl=float(data['stopLoss']),
        tp=float(data['takeProfit'][0]),
        outcome='pending',
        lot_size=0,
        exit_price=0,
        user_id=user.id
    )
    
    db.session.add(new_trade)
    db.session.commit()
    
    return jsonify({'message': 'Trade added successfully', 'trade_id': new_trade.id}), 201

@trades_bp.route('/trades', methods=['GET'])
@jwt_required()
def get_trades():
    user_id = get_jwt_identity()
    trades = Trade.query.filter_by(user_id=user_id).order_by(Trade.date.desc()).all()
    
    def calculate_trade_results(trade):
        pips = 0
        profit = 0
        rsr = 0
        
        if trade.outcome != 'pending':
            if 'jpy' in trade.asset.lower():
                pips_multiplier = 0.01
            else:
                pips_multiplier = 0.0001
            
            if trade.direction == 'buy':
                pips = (trade.exit_price - trade.entry_price) / pips_multiplier
            else:
                pips = (trade.entry_price - trade.exit_price) / pips_multiplier
            
            profit = pips * trade.lot_size
            
            if trade.sl and trade.tp:
                risk = abs(trade.entry_price - trade.sl)
                reward = abs(trade.tp - trade.entry_price)
                if risk > 0:
                    rsr = reward / risk
                    
        return round(pips, 2), round(profit, 2), round(rsr, 2)

    return jsonify([{
        'id': trade.id,
        'signal_id': trade.signal_id,
        'date': trade.date.isoformat(),
        'asset': trade.asset,
        'direction': trade.direction,
        'entry_price': trade.entry_price,
        'sl': trade.sl,
        'tp': trade.tp,
        'outcome': trade.outcome,
        'pips': calculate_trade_results(trade)[0],
        'profit': calculate_trade_results(trade)[1],
        'rsr': calculate_trade_results(trade)[2]
    } for trade in trades])

@trades_bp.route('/trades/<int:signal_id>', methods=['DELETE'])
def delete_trade(signal_id):
    trade_to_delete = Trade.query.filter_by(signal_id=signal_id).first()
    
    if not trade_to_delete:
        return jsonify({'error': 'Trade not found'}), 404
        
    db.session.delete(trade_to_delete)
    db.session.commit()
    
    return jsonify({'message': 'Trade deleted successfully'}), 200

@risk_plan_bp.route('/risk-plan', methods=['POST'])
@jwt_required()
def create_or_update_risk_plan():
    data = request.get_json()
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404

    risk_plan = RiskPlan.query.filter_by(user_id=user_id).first()
    if not risk_plan:
        risk_plan = RiskPlan(user_id=user_id)
        db.session.add(risk_plan)

    # User Profile
    risk_plan.initial_balance = data.get('initialBalance')
    risk_plan.account_equity = data.get('accountEquity')
    risk_plan.trades_per_day = data.get('tradesPerDay')
    risk_plan.trading_session = data.get('tradingSession')
    risk_plan.crypto_assets = data.get('cryptoAssets')
    risk_plan.forex_assets = data.get('forexAssets')
    risk_plan.has_account = data.get('hasAccount')
    risk_plan.experience = data.get('experience')

    # Risk Parameters
    risk_plan.max_daily_risk = data.get('maxDailyRisk')
    risk_plan.max_daily_risk_pct = data.get('maxDailyRiskPct')
    risk_plan.base_trade_risk = data.get('baseTradeRisk')
    risk_plan.base_trade_risk_pct = data.get('baseTradeRiskPct')
    risk_plan.min_risk_reward = data.get('minRiskReward')

    # Trades
    risk_plan.trades = data.get('trades')

    # Prop Firm Compliance
    risk_plan.prop_firm_compliance = data.get('propFirmCompliance')

    db.session.commit()
    return jsonify({'message': 'Risk plan saved successfully'}), 200

@risk_plan_bp.route('/risk-plan', methods=['GET'])
@jwt_required()
def get_risk_plan():
    user_id = get_jwt_identity()
    risk_plan = RiskPlan.query.filter_by(user_id=user_id).first()
    if not risk_plan:
        return jsonify({'error': 'Risk plan not found for this user'}), 404

    return jsonify({
        'user_id': risk_plan.user_id,
        'potential_profit_30_days': risk_plan.potential_profit_30_days,
        'potential_profit_45_days': risk_plan.potential_profit_45_days,
        'potential_profit_60_days': risk_plan.potential_profit_60_days,
        'has_60_day_guarantee': risk_plan.has_60_day_guarantee
    })

def generate_comprehensive_risk_plan(answers):
    """
    Generate risk management plan for any combination of questionnaire answers
    Ensures prop firm compliance and funded account success
    """
    
    # Extract and validate user answers with defaults
    trades_per_day = answers.get('tradesPerDay', '1-2')
    trading_session = answers.get('tradingSession', 'any')
    crypto_assets = answers.get('cryptoAssets', [])
    forex_assets = answers.get('forexAssets', [])
    has_account = answers.get('hasAccount', 'no')
    account_equity = answers.get('accountEquity', 10000)
    trading_experience = answers.get('tradingExperience', 'beginner')
    daily_trading_time = answers.get('dailyTradingTime', '1-2 hours')
    max_consecutive_losses = answers.get('maxConsecutiveLosses', 3)
    preferred_session = answers.get('preferredSession', 'any')
    
    # Validate account equity
    try:
        account_equity = float(account_equity) if account_equity else 10000.0
    except (TypeError, ValueError):
        account_equity = 10000.0
    
    # Determine experience-based risk parameters
    risk_profiles = {
        'beginner': {'daily_risk': 0.04, 'trade_risk': 0.02, 'min_rr': 2.0},
        'intermediate': {'daily_risk': 0.05, 'trade_risk': 0.025, 'min_rr': 2.5},
        'advanced': {'daily_risk': 0.06, 'trade_risk': 0.03, 'min_rr': 3.0}
    }
    
    profile = risk_profiles.get(trading_experience, risk_profiles['beginner'])
    
    # Calculate number of trades from trades_per_day string
    def parse_trades_per_day(trades_str):
        if '+' in trades_str:
            return int(trades_str.replace('+', '')) + 2
        elif '-' in trades_str:
            parts = trades_str.split('-')
            return int(parts[1])
        else:
            return int(trades_str)
    
    num_trades = parse_trades_per_day(trades_per_day)
    
    # Calculate risk allocations
    max_daily_risk = account_equity * profile['daily_risk']
    base_trade_risk = account_equity * profile['trade_risk']
    
    # Adjust trade risk based on number of trades to stay within daily limit
    adjusted_trade_risk = min(base_trade_risk, max_daily_risk / num_trades)
    
    # Asset-specific risk adjustments
    def get_asset_multiplier(asset_type, asset_name):
        """Adjust risk based on asset volatility"""
        crypto_multipliers = {
            'BTC': 1.0, 'ETH': 1.1, 'SOL': 1.3, 'XRP': 1.2, 
            'ADA': 1.2, 'DOGE': 1.5, 'AVAX': 1.3, 'SHIB': 1.8
        }
        forex_multipliers = {
            'EURUSD': 1.0, 'GBPUSD': 1.1, 'USDJPY': 1.0,
            'XAU/USD': 1.2, 'USOIL': 1.3, 'US30': 1.1
        }
        
        if asset_type == 'crypto':
            return crypto_multipliers.get(asset_name, 1.4)
        else:
            return forex_multipliers.get(asset_name, 1.2)
    
    # Generate individual trade plans
    trades = []
    all_assets = [(asset, 'crypto') for asset in crypto_assets] + \
                [(asset, 'forex') for asset in forex_assets]
    
    for i in range(1, num_trades + 1):
        # Rotate through available assets or use generic allocation
        if all_assets:
            asset, asset_type = all_assets[(i-1) % len(all_assets)]
            multiplier = get_asset_multiplier(asset_type, asset)
            trade_risk = adjusted_trade_risk * multiplier
        else:
            asset = f"Generic Asset {i}"
            trade_risk = adjusted_trade_risk
        
        # Calculate profit target based on risk-reward ratio
        profit_target = trade_risk * profile['min_rr']
        
        trades.append({
            'trade': f'trade-{i}',
            'asset': asset if all_assets else 'Any selected asset',
            'lossLimit': round(trade_risk, 2),
            'profitTarget': round(profit_target, 2),
            'riskRewardRatio': f"1:{profile['min_rr']}"
        })
    
    # Create comprehensive plan
    plan = {
        'userProfile': {
            'accountEquity': account_equity,
            'tradesPerDay': trades_per_day,
            'tradingSession': trading_session,
            'cryptoAssets': crypto_assets,
            'forexAssets': forex_assets,
            'hasAccount': has_account,
            'experience': trading_experience
        },
        'riskParameters': {
            'maxDailyRisk': round(max_daily_risk, 2),
            'maxDailyRiskPct': f"{profile['daily_risk']*100}%",
            'baseTradeRisk': round(adjusted_trade_risk, 2),
            'baseTradeRiskPct': f"{(adjusted_trade_risk/account_equity)*100:.2f}%",
            'minRiskReward': f"1:{profile['min_rr']}"
        },
        'trades': trades,
        'propFirmCompliance': {
            'dailyLossLimit': f"${round(max_daily_risk, 2)} ({profile['daily_risk']*100}%)",
            'totalDrawdownLimit': f"${round(account_equity * 0.10, 2)} (10%)",
            'profitTarget': f"${round(account_equity * 0.08, 2)} (8%)",
            'consistencyRule': "Maintain steady performance for Phase 2"
        }
    }
    
    return plan

@plan_generation_bp.route('/generate-plan', methods=['POST'])
def generate_plan():
    data = request.get_json()
    answers = data.get('answers')

    if not answers:
        return jsonify({'error': 'Missing required data'}), 400

    try:
        plan = generate_comprehensive_risk_plan(answers)
        if plan:
            return jsonify(plan), 200
        else:
            return jsonify({'error': 'Failed to generate trading plan'}), 500
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@trades_bp.route('/accounts', methods=['GET'])
def get_accounts():
    return jsonify([]), 200

@risk_plan_bp.route('/api/trading-plan', methods=['GET'])
@jwt_required()
def get_trading_plan():
    user_id = get_jwt_identity()
    risk_plan = RiskPlan.query.filter_by(user_id=user_id).first()

    if not risk_plan:
        return jsonify({'error': 'Trading plan not found'}), 404

    trading_plan_data = {
        'userProfile': {
            'initialBalance': risk_plan.initial_balance,
            'accountEquity': risk_plan.account_equity,
            'tradesPerDay': risk_plan.trades_per_day,
            'tradingSession': risk_plan.trading_session,
            'cryptoAssets': risk_plan.crypto_assets,
            'forexAssets': risk_plan.forex_assets,
            'hasAccount': risk_plan.has_account,
            'experience': risk_plan.experience,
        },
        'riskParameters': {
            'maxDailyRisk': risk_plan.max_daily_risk,
            'maxDailyRiskPct': risk_plan.max_daily_risk_pct,
            'baseTradeRisk': risk_plan.base_trade_risk,
            'baseTradeRiskPct': risk_plan.base_trade_risk_pct,
            'minRiskReward': risk_plan.min_risk_reward,
        },
        'trades': risk_plan.trades,
        'propFirmCompliance': risk_plan.prop_firm_compliance,
    }

    return jsonify({'tradingPlan': trading_plan_data})
