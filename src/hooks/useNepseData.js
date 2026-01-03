import { useState, useEffect } from 'react';
import { fetchNepseData } from '../services/nepseApi';

export const useNepseData = (intervalTime = 60000) => {
    const [stocks, setStocks] = useState({});
    const [lastUpdated, setLastUpdated] = useState(null);

    const updateData = async () => {
        const data = await fetchNepseData();
        if (data) {
            setStocks(data);
            setLastUpdated(new Date().toLocaleTimeString());
        }
    };

    useEffect(() => {
        updateData(); // Initial fetch
        const interval = setInterval(updateData, intervalTime);
        return () => clearInterval(interval); // Cleanup on unmount
    }, [intervalTime]);

    return { stocks, lastUpdated };
};