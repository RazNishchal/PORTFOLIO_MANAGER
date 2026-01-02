import React, { useState, useMemo, useRef, useEffect } from 'react';
import './css/TransactionForm.css';

const TransactionForm = ({ onAddTransaction, marketData = {}, holdings = {} }) => {
    const [formData, setFormData] = useState({
        symbol: '',
        type: 'BUY',
        units: '',
        price: ''
    });

    const [searchTerm, setSearchTerm] = useState('');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [errorMsg, setErrorMsg] = useState('');
    const [successMsg, setSuccessMsg] = useState('');
    const dropdownRef = useRef(null);

    // ⚡ CLEANER: Matches your capital-letter DB structure
    const cleanForDB = (str) => {
        if (!str) return "";
        return str.toString().split('-')[0].replace(/[^a-zA-Z0-9]/g, '').trim().toUpperCase();
    };

    const currentHolding = useMemo(() => {
        const target = cleanForDB(formData.symbol || searchTerm);
        if (!target || !holdings) return null;
        return holdings[target] || null;
    }, [formData.symbol, searchTerm, holdings]);

    const availableUnits = currentHolding ? Number(currentHolding.units || 0) : 0;

    // ⚡ UPDATED FILTER: Searches through the Market Table symbols and names
    const filteredOptions = useMemo(() => {
        const term = searchTerm.trim().toUpperCase();
        if (!term) return [];

        // Object.values or entries depending on how marketData is passed
        const allStocks = Object.entries(marketData);

        return allStocks
            .filter(([symbol, info]) => {
                const stockSymbol = symbol.toUpperCase();
                const stockName = (info.name || "").toUpperCase();
                return stockSymbol.includes(term) || stockName.includes(term);
            })
            .slice(0, 8); // Limit for performance/UI
    }, [searchTerm, marketData]);

    // Reset index when search changes
    useEffect(() => {
        setSelectedIndex(0);
    }, [searchTerm]);

    const handleSelect = (symbol, info) => {
        const cleanSymbol = symbol.toUpperCase();
        setFormData(prev => ({
            ...prev,
            symbol: cleanSymbol,
            price: info.ltp ? info.ltp.toString() : prev.price
        }));
        setSearchTerm(cleanSymbol);
        setIsDropdownOpen(false);
        setErrorMsg('');
    };

    const handleKeyDown = (e) => {
        if (!isDropdownOpen || filteredOptions.length === 0) return;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedIndex(prev => (prev + 1) % filteredOptions.length);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedIndex(prev => (prev - 1 + filteredOptions.length) % filteredOptions.length);
        } else if (e.key === 'Enter') {
            e.preventDefault();
            const selected = filteredOptions[selectedIndex];
            if (selected) {
                handleSelect(selected[0], selected[1]);
            }
        }
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSubmit = (e) => {
        e.preventDefault();
        const inputUnits = Number(formData.units);
        const inputPrice = parseFloat(formData.price);
        const finalSymbol = cleanForDB(formData.symbol || searchTerm);

        if (formData.type === 'SELL') {
            if (availableUnits <= 0) {
                setErrorMsg(`No holdings for ${finalSymbol}`);
                return;
            }
            if (inputUnits > availableUnits) {
                setErrorMsg(`Only ${availableUnits} available`);
                return;
            }
        }

        onAddTransaction({
            ...formData,
            symbol: finalSymbol,
            units: inputUnits,
            price: inputPrice,
            date: new Date().toISOString()
        });

        setSuccessMsg(`Transaction added for ${finalSymbol}`);
        setFormData({ symbol: '', type: 'BUY', units: '', price: '' });
        setSearchTerm('');
        setErrorMsg('');
        setTimeout(() => setSuccessMsg(''), 3000);
    };

    return (
        <div className="transaction-card main-card fade-in">
            <div className="form-header-row">
                <h3 className="form-title"><span>➕</span> New Transaction</h3>
                {errorMsg && <div className="floating-error-msg">{errorMsg}</div>}
                {successMsg && <div className="floating-success-msg">{successMsg}</div>}
            </div>

            <form onSubmit={handleSubmit} className="transaction-form-body" autoComplete="off">
                <div
                    className="form-group search-section"
                    ref={dropdownRef}
                    onFocus={() => setIsDropdownOpen(true)}
                >
                    <label className="stat-label">Search Scrip</label>
                    <div className="search-wrapper">
                        <input
                            type="text"
                            className="input-field"
                            placeholder="Type Symbol (NICA, ADBL...)"
                            value={searchTerm}
                            onKeyDown={handleKeyDown}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setIsDropdownOpen(true);
                            }}
                            required
                        />

                        {isDropdownOpen && filteredOptions.length > 0 && (
                            <ul className="custom-dropdown">
                                {filteredOptions.map(([symbol, info], index) => (
                                    <li
                                        key={symbol}
                                        className={index === selectedIndex ? 'active-hover' : ''}
                                        onMouseEnter={() => setSelectedIndex(index)}
                                        onClick={() => handleSelect(symbol, info)}
                                    >
                                        <div className="drop-info-left">
                                            <span className="drop-sym">{symbol}</span>
                                            <span className="drop-name">{info.name || 'Company Name'}</span>
                                        </div>
                                        <div className="drop-info-right">
                                            <span className="drop-price">Rs. {info.ltp || '0'}</span>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>

                <div className="form-row">
                    <div className="form-group">
                        <label className="stat-label">Action</label>
                        <select
                            className="input-field"
                            value={formData.type}
                            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                        >
                            <option value="BUY">BUY</option>
                            <option value="SELL">SELL</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <div className="label-with-helper">
                            <label className="stat-label">Units</label>
                            {formData.type === 'SELL' && (
                                <span className="helper-text" style={{ color: availableUnits > 0 ? '#10b981' : '#f43f5e', fontSize: '0.7rem' }}>
                                    {availableUnits > 0 ? `Owned: ${availableUnits}` : "0 Owned"}
                                </span>
                            )}
                        </div>
                        <input
                            type="number"
                            className="input-field"
                            value={formData.units}
                            onChange={(e) => setFormData({ ...formData, units: e.target.value })}
                            required
                        />
                    </div>
                </div>

                <div className="form-group">
                    <label className="stat-label">Price</label>
                    <input
                        type="number"
                        step="0.01"
                        className="input-field"
                        value={formData.price}
                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                        required
                    />
                </div>

                <button
                    type="submit"
                    className="btn-submit"
                    style={{ backgroundColor: formData.type === 'BUY' ? '#10b981' : '#f43f5e' }}
                >
                    Confirm {formData.type}
                </button>
            </form>
        </div>
    );
};

export default TransactionForm;