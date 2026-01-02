import React from 'react';
import './css/DashboardHeader.css';

const DashboardHeader = ({ holdings = {}, marketData = {} }) => {
    let totalInvestment = 0;
    let currentVal = 0;
    let dailyPL = 0;

    Object.keys(holdings).forEach(symbol => {
        const stock = holdings[symbol];
        // Ensure we have numbers even if marketData is pending
        const live = marketData[symbol] || { ltp: stock.wacc || 0, prevClose: stock.wacc || 0 };

        totalInvestment += (stock.units * (stock.wacc || 0));
        currentVal += (stock.units * (live.ltp || 0));
        dailyPL += ((live.ltp || 0) - (live.prevClose || 0)) * stock.units;
    });

    const totalPL = currentVal - totalInvestment;
    const plPercent = totalInvestment > 0 ? (totalPL / totalInvestment) * 100 : 0;

    return (
        <div className="dashboard-header-grid fade-in">
            <div className="stat-card">
                <span className="stat-label">Total Portfolio Value</span>
                <h2 className="stat-value">Rs. {currentVal.toLocaleString()}</h2>
                <span className={`stat-sub ${totalPL >= 0 ? 'up' : 'down'}`}>
                    {totalPL >= 0 ? '▲' : '▼'} {plPercent.toFixed(2)}% (Rs. {Math.abs(totalPL).toLocaleString()})
                </span>
            </div>

            <div className="stat-card">
                <span className="stat-label">Today's Profit/Loss</span>
                <h2 className={`stat-value ${dailyPL >= 0 ? 'text-up' : 'text-down'}`}>
                    {dailyPL >= 0 ? '+' : '-'} Rs. {Math.abs(dailyPL).toLocaleString()}
                </h2>
                <span className="stat-sub">Live Market Change</span>
            </div>

            <div className="stat-card">
                <span className="stat-label">Invested Capital</span>
                <h2 className="stat-value">Rs. {totalInvestment.toLocaleString()}</h2>
                <span className="stat-sub">Cash Outflow</span>
            </div>
        </div>
    );
};

export default DashboardHeader;