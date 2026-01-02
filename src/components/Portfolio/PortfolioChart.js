import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import './css/PortfolioChart.css';

const DUMMY_HOLDINGS = [
    { name: 'NTC (Demo)', value: 50000 },
    { name: 'NABIL (Demo)', value: 30000 },
    { name: 'UPPER (Demo)', value: 20000 }
];

const PortfolioChart = ({ holdings = {}, isDarkMode }) => {

    const { chartData, isDummy, totalInvestment } = useMemo(() => {
        const symbols = Object.keys(holdings);

        if (symbols.length === 0) {
            const dummyTotal = DUMMY_HOLDINGS.reduce((sum, item) => sum + item.value, 0);
            return { chartData: DUMMY_HOLDINGS, isDummy: true, totalInvestment: dummyTotal };
        }

        const realData = symbols.map(symbol => {
            const stock = holdings[symbol];
            const investment = (stock.units || 0) * (stock.wacc || 0);
            return { name: symbol, value: investment };
        }).filter(item => item.value > 0);

        const finalData = realData.length > 0 ? realData : DUMMY_HOLDINGS;
        const total = finalData.reduce((sum, item) => sum + item.value, 0);

        return {
            chartData: finalData,
            isDummy: realData.length === 0,
            totalInvestment: total
        };
    }, [holdings]);

    // Colors assigned to each scrip
    const COLORS = isDummy
        ? ['#94a3b8', '#cbd5e1', '#e2e8f0']
        : ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

    // Renders the label outside the pie with colors matching the specific slice
    const renderCustomLabel = ({ name, percent, x, y, cx, index }) => {
        const sliceColor = COLORS[index % COLORS.length];
        return (
            <text
                x={x}
                y={y}
                fill={sliceColor} // Matches scrip color
                textAnchor={x > cx ? 'start' : 'end'}
                dominantBaseline="central"
                fontSize="12px"
                fontWeight="700"
            >
                {`${name} ${(percent * 100).toFixed(1)}%`}
            </text>
        );
    };

    return (
        <div className={`portfolio-chart-container fade-in ${isDummy ? 'dummy-mode' : ''}`}>
            <div className="chart-header">
                <h3 className="chart-title">
                    <span className="title-icon">{isDummy ? '⏳' : '💰'}</span>
                    {isDummy ? 'Sample Investment Weight' : 'Portfolio Chart'}
                </h3>
                {isDummy && <span className="dummy-badge">Database Empty</span>}
            </div>

            <div className="pie-chart-wrapper">
                <ResponsiveContainer width="100%" height={320}>
                    <PieChart>
                        <Pie
                            data={chartData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={85}
                            paddingAngle={5}
                            dataKey="value"
                            stroke="none"
                            label={renderCustomLabel}
                            labelLine={{ stroke: isDarkMode ? '#475569' : '#cbd5e1', strokeWidth: 1 }}
                        >
                            {chartData.map((_, index) => (
                                <Cell key={index} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip
                            formatter={(value) => `Rs. ${value.toLocaleString()}`}
                            contentStyle={{
                                borderRadius: '12px',
                                border: 'none',
                                backgroundColor: isDarkMode ? '#1e293b' : '#ffffff',
                                color: isDarkMode ? '#f8fafc' : '#0f172a',
                                boxShadow: '0 10px 15px -3px rgba(0,0,0,0.3)'
                            }}
                            itemStyle={{ color: isDarkMode ? '#f8fafc' : '#0f172a' }}
                        />
                    </PieChart>
                </ResponsiveContainer>
            </div>

            {/* Legend with Scrip-Dedicated Colors */}
            <div className="custom-legend">
                {chartData.map((entry, index) => {
                    const itemColor = COLORS[index % COLORS.length];
                    return (
                        <div key={entry.name} className="legend-item">
                            <span
                                className="legend-dot"
                                style={{ backgroundColor: itemColor }}
                            ></span>
                            <div className="legend-info">
                                <span
                                    className="legend-name"
                                    style={{ color: itemColor }}
                                >
                                    {entry.name}
                                </span>
                                <span
                                    className="legend-perc"
                                    style={{ color: itemColor, opacity: 0.85 }}
                                >
                                    {((entry.value / totalInvestment) * 100).toFixed(1)}%
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default PortfolioChart;