import React from 'react';
import { useAuth } from '../../context/AuthContext';
import './css/navbar.css';

const Navbar = ({ isDarkMode, setIsDarkMode, setView, currentView }) => {
    const { logout } = useAuth();

    // Updated Handler to broadcast theme changes instantly
    const handleThemeToggle = () => {
        const nextMode = !isDarkMode;

        // 1. Update React State (for the Navbar/Dashboard)
        setIsDarkMode(nextMode);

        // 2. Update LocalStorage
        localStorage.setItem('theme', nextMode ? 'dark' : 'light');

        // 3. BROADCAST: This tells AuthTheme to update IMMEDIATELY
        window.dispatchEvent(new Event('themeChange'));
    };

    return (
        <nav className="navbar">
            <div className="navbar-container">
                {/* 1. BRAND */}
                <div className="nav-brand" onClick={() => setView('dashboard')}>
                    <h1>💰 Manager</h1>
                </div>

                {/* 2. MENU */}
                <div className="nav-menu">
                    <button
                        className={`nav-item ${currentView === 'dashboard' ? 'active' : ''}`}
                        onClick={() => setView('dashboard')}
                    >
                        Dashboard
                    </button>
                    <button
                        className={`nav-item ${currentView === 'settings' ? 'active' : ''}`}
                        onClick={() => setView('settings')}
                    >
                        Settings
                    </button>
                </div>

                {/* 3. ACTIONS */}
                <div className="nav-right">
                    {/* Theme Toggle Button */}
                    <button
                        className="theme-toggle"
                        onClick={handleThemeToggle}
                        title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
                        aria-label="Toggle Theme"
                    >
                        <span className="toggle-icon">
                            {/* Logic flipped: Show Sun in Dark Mode to switch to Light, Moon in Light to switch to Dark */}
                            {isDarkMode ? '☀️' : '🌙'}
                        </span>
                    </button>

                    <button className="btn-logout-minimal" onClick={logout}>
                        Logout
                    </button>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;