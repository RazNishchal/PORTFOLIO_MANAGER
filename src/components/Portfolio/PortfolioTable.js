import React, { useState, useRef, useEffect } from 'react';
import './css/PortfolioTable.css';

const PortfolioTable = ({ holdings = {}, marketData = {}, isDarkMode }) => {
    const [searchTerm, setSearchTerm] = useState("");
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [selectedSymbol, setSelectedSymbol] = useState(null);
    const dropdownRef = useRef(null);

    // 1. Filter Logic
    const allSymbols = Object.keys(marketData);
    const filteredSuggestions = allSymbols.filter(sym => {
        const nameMatch = marketData[sym]?.name?.toLowerCase().includes(searchTerm.toLowerCase());
        const symbolMatch = sym.toLowerCase().includes(searchTerm.toLowerCase());
        return (nameMatch || symbolMatch) && searchTerm !== "";
    }).slice(0, 8);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Helper: Render Value with Dynamic Colors
    const renderValue = (value) => {
        const isPositive = value >= 0;
        return (
            <span className={`pl-badge ${isPositive ? "pl-up" : "pl-down"}`}>
                {isPositive ? '▲' : '▼'} {Math.abs(value).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
        );
    };

    /**
     * LOGIC FIX: Normalized Symbol Mapping
     * This ensures displaySymbols works even if the input is lowercase.
     */
    const displaySymbols = selectedSymbol
        ? [selectedSymbol.toUpperCase()]
        : Object.keys(holdings);

    return (
        <div className={`portfolio-table-container main-card fade-in ${isDarkMode ? 'dark-mode' : 'light-mode'}`}>
            <div className="table-header-flex">
                <div className="title-group">
                    <h3 className="section-title">Portfolio Explorer</h3>
                    <span className="badge-live">Live</span>
                </div>

                <div className="search-container" ref={dropdownRef}>
                    <input
                        type="text"
                        placeholder="Search stock..."
                        className="search-input"
                        value={searchTerm}
                        onFocus={() => setIsDropdownOpen(true)}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />

                    {isDropdownOpen && filteredSuggestions.length > 0 && (
                        <div className="search-dropdown">
                            {filteredSuggestions.map(sym => (
                                <div
                                    key={sym}
                                    className="dropdown-item"
                                    onClick={() => {
                                        setSelectedSymbol(sym);
                                        setSearchTerm("");
                                        setIsDropdownOpen(false);
                                    }}
                                >
                                    <div className="drop-info">
                                        <span className="drop-sym">{sym}</span>
                                        <span className="drop-name">{marketData[sym]?.name}</span>
                                    </div>
                                    <span className="drop-price">Rs. {marketData[sym]?.ltp}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <div className="table-responsive">
                <table className="custom-table">
                    <thead>
                        <tr>
                            <th>Stock</th>
                            <th className="text-center">Qty</th>
                            <th className="text-center">WACC</th>
                            <th className="text-center">LTP</th>
                            <th className="text-center">Overall P/L</th>
                        </tr>
                    </thead>
                    <tbody>
                        {displaySymbols.length > 0 ? (
                            displaySymbols.map(symbol => {
                                // Robust lookup: ensures key matching regardless of case
                                const actualKey = Object.keys(holdings).find(k => k.toUpperCase() === symbol.toUpperCase());
                                const stock = actualKey ? holdings[actualKey] : { units: 0, wacc: 0 };
                                const live = marketData[symbol] || { ltp: stock.wacc || 0 };

                                const totalCost = stock.units * stock.wacc;
                                const currentValue = stock.units * live.ltp;
                                const profitLoss = currentValue - totalCost;

                                return (
                                    <tr key={symbol} className="table-row">
                                        <td>
                                            <div className="stock-info-cell">
                                                <div className="symbol-icon" style={{
                                                    background: isDarkMode ? '#2d3748' : '#edf2f7',
                                                    color: isDarkMode ? '#cbd5e0' : '#4a5568'
                                                }}>
                                                    {symbol.substring(0, 2)}
                                                </div>
                                                <div className="symbol-details">
                                                    <strong className="symbol-name">{symbol}</strong>
                                                    {(!actualKey || holdings[actualKey].units === 0) && (
                                                        <span className="not-held-tag">Not Held</span>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="text-center font-mono">{stock.units}</td>
                                        <td className="text-center font-mono">Rs. {Number(stock.wacc).toFixed(2)}</td>
                                        <td className="text-center font-mono">
                                            <strong className="ltp-text">{Number(live.ltp).toFixed(2)}</strong>
                                        </td>
                                        <td className="text-center">
                                            {renderValue(profitLoss)}
                                        </td>
                                    </tr>
                                );
                            })
                        ) : (
                            <tr>
                                <td colSpan="5" className="empty-msg-cell">No holdings available.</td>
                            </tr>
                        )}
                    </tbody>
                </table>

                {selectedSymbol && (
                    <div className="table-footer">
                        <button className="clear-filter-btn" onClick={() => setSelectedSymbol(null)}>
                            ← Show All Holdings
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PortfolioTable;