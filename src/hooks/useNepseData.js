"use client";

import { useState, useEffect, useCallback } from 'react';
import { fetchNepseData } from '../services/nepseApi';

/**
 * Custom Hook: useNepseData
 * Fetches live market prices from NEPSE and manages refresh intervals.
 */
export const useNepseData = (intervalTime = 60000) => {
    const [stocks, setStocks] = useState({});
    const [lastUpdated, setLastUpdated] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Wrapped in useCallback to prevent unnecessary re-renders in parent components
    const updateData = useCallback(async () => {
        try {
            const data = await fetchNepseData();
            if (data) {
                setStocks(data);
                setLastUpdated(new Date().toLocaleTimeString());
                setError(null);
            }
        } catch (err) {
            console.error("NEPSE Fetch Error:", err);
            setError("Failed to fetch market data");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        // 1. Trigger initial fetch
        updateData();

        // 2. Set up the polling interval
        const interval = setInterval(updateData, intervalTime);

        // 3. Cleanup: Stop the timer when the user leaves the page
        return () => clearInterval(interval);
    }, [intervalTime, updateData]);

    return {
        livePrices: stocks, // Renamed for clarity in PortfolioManager
        lastUpdated,
        loading,
        error,
        refresh: updateData // Allows manual refresh via a button
    };
};