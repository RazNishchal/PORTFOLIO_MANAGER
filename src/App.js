import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from './context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';

// Services
import {
  listenToPortfolio,
  updatePortfolioInDB,
  listenToMarketData
} from './services/portfolioService';

// UI Components
import Navbar from './components/UI/Navbar';
import Settings from './components/Auth/Settings';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import Verify from './components/Auth/Verify';

// Portfolio Components
import DashboardHeader from './components/Portfolio/DashboardHeader';
import TransactionForm from './components/Portfolio/TransactionForm';
import PortfolioTable from './components/Portfolio/PortfolioTable';
import MarketMovers from './components/Portfolio/MarketMovers';
import SectorChart from './components/Portfolio/SectorChart';
import PortfolioChart from './components/Portfolio/PortfolioChart';

import './App.css';

function App() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [holdings, setHoldings] = useState({});
  const [marketData, setMarketData] = useState({});
  const [isAuthProcessing, setIsAuthProcessing] = useState(false);

  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem('theme') === 'dark';
  });

  // 1️⃣ ROUTE PROTECTION & REDIRECTS
  useEffect(() => {
    if (authLoading) return;

    const path = location.pathname;

    // A. If user is authenticated and verified
    if (user?.emailVerified && !isAuthProcessing) {
      const authRoutes = ['/login', '/register', '/'];
      if (authRoutes.includes(path)) {
        navigate('/dashboard');
      }
    }
    // B. If user is NOT authenticated/verified
    else {
      const allowedPaths = ['/login', '/register'];
      if (!allowedPaths.includes(path)) {
        navigate('/login');
      }
    }
  }, [user, authLoading, isAuthProcessing, location.pathname, navigate]);

  // 2️⃣ DATA SYNC
  useEffect(() => {
    let unsubscribePortfolio;
    let unsubscribeMarket;

    if (user?.emailVerified && !isAuthProcessing) {
      unsubscribePortfolio = listenToPortfolio(user.uid, (data) => {
        setHoldings(data || {});
      });

      unsubscribeMarket = listenToMarketData((data) => {
        setMarketData(data || {});
      });
    }

    return () => {
      unsubscribePortfolio?.();
      unsubscribeMarket?.();
    };
  }, [user, isAuthProcessing]);

  // 3️⃣ THEME EFFECT
  useEffect(() => {
    const root = document.documentElement;
    root.className = isDarkMode ? 'dark-theme' : 'light-theme';
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  // 4️⃣ TRANSACTION HANDLER
  const handleTransaction = async (tx) => {
    if (!user) return;
    try {
      await updatePortfolioInDB(user.uid, tx, holdings, marketData);
    } catch (error) {
      alert(error.message);
    }
  };

  // 5️⃣ VERIFY ROUTE DETECTION
  const isVerifyRoute = useMemo(
    () => location.pathname === '/verify',
    [location.pathname]
  );

  // ⏳ Global Loading State
  if (authLoading) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
      </div>
    );
  }

  // Handle Verify route specifically if triggered
  if (isVerifyRoute) {
    return <Verify />;
  }

  /**
   * 🚧 AUTH GATE
   * Strictly handles: login, register
   */
  const accessDenied = !user || !user.emailVerified || isAuthProcessing;

  if (accessDenied) {
    if (location.pathname === '/register') {
      return (
        <Register
          toggleToLogin={() => navigate('/login')}
          setIsAuthProcessing={setIsAuthProcessing}
          // On registration success, we now go to login to wait for verification
          onRegistrationSuccess={() => navigate('/login')}
        />
      );
    }

    // Default: Login Page
    return (
      <Login
        toggleToRegister={() => navigate('/register')}
      />
    );
  }

  /**
   * 🔓 PROTECTED APP
   * Strictly handles: dashboard, settings
   */
  return (
    <div className="app-container">
      <Navbar
        isDarkMode={isDarkMode}
        setIsDarkMode={setIsDarkMode}
        setView={(v) => navigate(v === 'dashboard' ? '/dashboard' : '/settings')}
        currentView={location.pathname === '/settings' ? 'settings' : 'dashboard'}
      />

      <main className="dashboard-content">
        {location.pathname === '/settings' ? (
          <div className="settings-view-wrapper">
            <Settings />
          </div>
        ) : (
          <>
            <DashboardHeader holdings={holdings} marketData={marketData} />
            <div className="layout-grid-system">
              <div className="input-analysis-row">
                <div className="form-wrapper">
                  <TransactionForm
                    onAddTransaction={handleTransaction}
                    marketData={marketData}
                    holdings={holdings}
                  />
                </div>
                <div className="chart-wrapper">
                  <PortfolioChart
                    holdings={holdings}
                    marketData={marketData}
                  />
                </div>
              </div>
              <div className="full-row-item">
                <PortfolioTable holdings={holdings} marketData={marketData} />
              </div>
              <div className="full-row-item">
                <MarketMovers marketData={marketData} isDarkMode={isDarkMode} />
              </div>
              <div className="full-row-item">
                <SectorChart holdings={holdings} marketData={marketData} />
              </div>
            </div>
          </>
        )}
      </main>

      <footer className="app-footer">
        <p>© 2026 NEPSE Portfolio Manager • Secured Access</p>
      </footer>
    </div>
  );
}

export default App;