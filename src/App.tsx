import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import LandingPage from './components/LandingPage';
import SignUp from './components/SignUp';
import SignIn from './components/SignIn';
import MembershipPlans from './components/MembershipPlans';
import PropFirmSelection from './components/PropFirmSelection';
import AccountConfiguration from './components/AccountConfiguration';
import RiskConfiguration from './components/RiskConfiguration';
import TradingPlanGeneration from './components/TradingPlanGenerator';
import PaymentFlow from './components/PaymentFlow';
import Questionnaire from './components/Questionnaire';
import RiskManagementPage from './components/RiskManagementPage';
import TradeMentor from './components/TradeMentor';
import Dashboard from './components/Dashboard';
import DashboardConcept2 from './components/DashboardConcept2';
import DashboardConcept3 from './components/DashboardConcept3';
import DashboardConcept4 from './components/DashboardConcept4';
import AdminLogin from './components/AdminLogin';
import AdminDashboard from './components/AdminDashboard';
import AffiliateLinks from './components/AffiliateLinks';
import ProtectedRoute from './components/ProtectedRoute';
import { UserProvider, useUser } from './contexts/UserContext';
import { TradingPlanProvider, useTradingPlan } from './contexts/TradingPlanContext';
import { AdminProvider } from './contexts/AdminContext';
import { clearState } from './trading/dataStorage';
import Features from './components/Features';
import About from './components/About';
import Terms from './components/Terms';
import TermsOfService from './components/TermsOfService';
import PrivacyPolicy from './components/PrivacyPolicy';
import FAQ from './components/FAQ';
import { SignalDistributionProvider } from './components/SignalDistributionService';
import FuturisticCursor from './components/FuturisticCursor';
import FuturisticBackground from './components/FuturisticBackground';
import CustomerServiceDashboard from './components/customer-service-dashboard';

const AppContent = () => {
  const [concept, setConcept] = useState('');
  const { logout: userLogout } = useUser();
  const { resetPlan } = useTradingPlan();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    userLogout();
    resetPlan();
    clearState();
    navigate('/signin');
  };

  const renderDashboard = () => {
    switch (Number(concept)) {
      case 1:
        return <Dashboard onLogout={handleLogout} />;
      case 2:
        return <DashboardConcept2 onLogout={handleLogout} />;
      case 3:
        return <DashboardConcept3 onLogout={handleLogout} />;
      case 4:
        return <DashboardConcept4 onLogout={handleLogout} />;
      default:
        return <Dashboard onLogout={handleLogout} />;
    }
  };

  return (
    <>
      <div className="min-h-screen">
        <FuturisticBackground />
        <FuturisticCursor />
        {location.pathname.startsWith('/dashboard') && (
          <div className="concept-switcher" style={{ position: 'fixed', top: '10px', right: '10px', zIndex: 9999 }}>
            <select onChange={(e) => setConcept(e.target.value)} value={concept} style={{ background: 'transparent', color: 'white', padding: '5px', border: '1px solid white' }}>
              <option value="" disabled>select your prefered theme</option>
              <option value={1}>Holographic Neural</option>
              <option value={2}>Quantum Glass</option>
              <option value={3}>Cyberpunk Neon</option>
              <option value={4}>Organic Flow</option>
            </select>
          </div>
        )}
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/signin" element={<SignIn />} />
          <Route path="/membership" element={<MembershipPlans />} />
          <Route path="/payment" element={<PaymentFlow />} />
          <Route path="/questionnaire" element={<Questionnaire />} />
          <Route path="/risk-management" element={<RiskManagementPage />} />
          <Route path="/setup/prop-firm" element={<PropFirmSelection />} />
          <Route path="/setup/account" element={<AccountConfiguration />} />
          <Route path="/setup/risk" element={<RiskConfiguration />} />
          <Route path="/setup/plan" element={<TradingPlanGeneration />} />
          <Route
            path="/dashboard/:tab"
            element={
              <ProtectedRoute>
                {renderDashboard()}
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                {renderDashboard()}
              </ProtectedRoute>
            }
          />
          <Route path="/admin" element={<AdminLogin />} />
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute>
                <AdminDashboard onLogout={handleLogout} />
              </ProtectedRoute>
            }
          />
          <Route path="/affiliate-links" element={<AffiliateLinks />} />
          <Route path="/features" element={<Features />} />
          <Route path="/about" element={<About />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/terms-of-service" element={<TermsOfService />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/trade-mentor/:tradeId" element={<TradeMentor />} />
          <Route path="/customer-service" element={<CustomerServiceDashboard />} />
        </Routes>
      </div>
    </>
  );
}

function App() {
  return (
    <SignalDistributionProvider>
      <AdminProvider>
        <UserProvider>
          <TradingPlanProvider>
            <Router>
              <AppContent />
            </Router>
          </TradingPlanProvider>
        </UserProvider>
      </AdminProvider>
    </SignalDistributionProvider>
  );
}

export default App;
