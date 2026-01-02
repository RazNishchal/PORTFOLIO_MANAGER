import React, { useState, useMemo } from 'react';
import './css/DataInspector.css';

const DataInspector = ({ marketData = {} }) => {
    const [showRaw, setShowRaw] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const symbols = Object.keys(marketData);

    const filteredData = useMemo(() => {
        return symbols.filter(sym =>
            sym.toLowerCase().includes(searchTerm.toLowerCase()) ||
            marketData[sym].name?.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [searchTerm, marketData]);

    return (
        <div className="inspector-container fade-in">
            <div className="inspector-header">
                <h2>🔍 Scraped Data Inspector</h2>
                <div className="header-actions">
                    <button onClick={() => setShowRaw(!showRaw)} className="btn-toggle">
                        {showRaw ? 'Show Table View' : 'Show Raw JSON'}
                    </button>
                    <input
                        type="text"
                        placeholder="Search symbols or sectors..."
                        className="debug-search"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="stats-row">
                <div className="stat-pill">Total Scrips: <strong>{symbols.length}</strong></div>
                <div className="stat-pill">Last Updated: <strong>{new Date().toLocaleTimeString()}</strong></div>
            </div>

            {showRaw ? (
                <pre className="raw-json-box">
                    {JSON.stringify(marketData, null, 2)}
                </pre>
            ) : (
                <div className="table-wrapper">
                    <table className="debug-table">
                        <thead>
                            <tr>
                                <th>Symbol</th>
                                <th>Company Name</th>
                                <th>LTP (Rs.)</th>
                                <th>Sector</th>
                                <th>Change</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredData.map(sym => (
                                <tr key={sym}>
                                    <td className="bold-sym">{sym}</td>
                                    <td>{marketData[sym].name || 'N/A'}</td>
                                    <td className="price-td">{marketData[sym].ltp || '0'}</td>
                                    <td><span className="sector-tag">{marketData[sym].sector || 'Unknown'}</span></td>
                                    <td className={parseFloat(marketData[sym].change) >= 0 ? 'up' : 'down'}>
                                        {marketData[sym].change || '0'}%
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default DataInspector;