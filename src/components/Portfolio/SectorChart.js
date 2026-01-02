import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import './css/SectorChart.css';

const SectorChart = ({ holdings = {}, marketData = {}, isDarkMode }) => {
    const { sectorData, totalValue } = useMemo(() => {
        const sectors = {};
        let total = 0;

        Object.keys(holdings).forEach(symbol => {
            const stock = holdings[symbol];
            const info = marketData[symbol] || {};
            const sector = info.sector || 'Others';
            const currentPrice = info.lastPrice || stock.wacc || 0;
            const value = (stock.units || 0) * currentPrice;

            if (value > 0) {
                sectors[sector] = (sectors[sector] || 0) + value;
                total += value;
            }
        });

        const formattedData = Object.keys(sectors).map(name => ({
            name,
            value: sectors[name]
        }));

        return { sectorData: formattedData, totalValue: total };
    }, [holdings, marketData]);

    const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

    const renderLabel = ({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`;

    if (sectorData.length === 0) return null;

    return (
        <div className="sector-chart-container">
            <h3 className="chart-title">Sector Allocation</h3>
            <div className="pie-chart-wrapper">
                <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                        <Pie
                            data={sectorData}
                            cx="50%"
                            cy="50%"
                            outerRadius={80}
                            dataKey="value"
                            label={renderLabel}
                        >
                            {sectorData.map((entry, index) => (
                                <Cell key={index} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip
                            contentStyle={{
                                backgroundColor: isDarkMode ? '#1e293b' : '#ffffff',
                                border: 'none',
                                borderRadius: '8px',
                                color: isDarkMode ? '#f8fafc' : '#0f172a'
                            }}
                        />
                    </PieChart>
                </ResponsiveContainer>
            </div>
            <div className="sector-legend">
                {sectorData.map((entry, index) => (
                    <div key={entry.name} className="sector-legend-item">
                        <span className="dot" style={{ backgroundColor: COLORS[index % COLORS.length] }}></span>
                        <span className="name">{entry.name}</span>
                        <span className="percent">{((entry.value / totalValue) * 100).toFixed(1)}%</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default SectorChart;