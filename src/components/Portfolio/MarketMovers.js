import React from 'react';
import './css/MarketMovers.css';

const MarketMovers = ({ marketData, isDarkMode }) => {
    const stocks = Object.values(marketData || {});

    const getTop = (isGain) => [...stocks]
        .sort((a, b) => isGain
            ? (b.percentChange || 0) - (a.percentChange || 0)
            : (a.percentChange || 0) - (b.percentChange || 0))
        .slice(0, 5);

    const StockSection = ({ title, type, data }) => (
        <div className={`mover-column ${type}`}>
            <div className="mover-title">
                <span>{title}</span>
                <span className="icon-badge">{type === 'gainers' ? '▲' : '▼'}</span>
            </div>

            <div className="mover-header">
                <span>Ticker</span>
                <span>Price</span>
                <span style={{ textAlign: 'right' }}>Performance</span>
            </div>

            <div className="mover-list">
                {data.length > 0 ? data.map((stock) => (
                    <div key={stock.symbol} className="mover-row">
                        <div className="symbol-info">
                            <div className="symbol-text">{stock.symbol}</div>
                        </div>

                        <div className="ltp-value">
                            {Number(stock.ltp).toLocaleString('en-IN')}
                        </div>

                        <div className="change-wrapper" style={{ display: 'flex', justifyContent: 'flex-end' }}>
                            <div className="change-pill">
                                <span className="stat-point">
                                    {type === 'gainers' ? '+' : ''}{stock.pointChange}
                                </span>
                                <span className="stat-perc">{stock.percentChange}%</span>
                            </div>
                        </div>
                    </div>
                )) : (
                    <div className="loading-state">Syncing Market Data...</div>
                )}
            </div>
        </div>
    );

    return (
        <div className={`market-movers-container ${isDarkMode ? 'dark-mode' : ''}`}>
            <StockSection title="Top Gainers" type="gainers" data={getTop(true)} />
            <StockSection title="Top Losers" type="losers" data={getTop(false)} />
        </div>
    );
};

export default MarketMovers;